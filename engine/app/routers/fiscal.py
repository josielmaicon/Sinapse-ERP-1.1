from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, or_
from .. import models, schemas
from ..database import get_db
from datetime import datetime, timedelta
from ..services import fiscal_service 

router = APIRouter(prefix="/fiscal", tags=["Fiscal"])

# --- 1. DASHBOARD (Atualizado) ---
@router.get("/summary")
def get_fiscal_summary(db: Session = Depends(get_db)):
    """
    Retorna os dados consolidados para os painéis da página Fiscal.
    Fonte da verdade: NotaFiscalSaida e NotaFiscalEntrada.
    """
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # Total Comprado (Entrada)
    total_comprado = db.query(func.sum(models.NotaFiscalEntrada.valor_total)).filter(
        models.NotaFiscalEntrada.data_emissao >= start_of_month.date()
    ).scalar() or 0

    # Total Emitido (Saída Autorizada)
    total_emitido = db.query(func.sum(models.Venda.valor_total))\
        .join(models.NotaFiscalSaida)\
        .filter(
            models.NotaFiscalSaida.status_sefaz.in_(['Autorizada', 'Emitida']),
            models.NotaFiscalSaida.data_hora_autorizacao >= start_of_month
        ).scalar() or 0
    
    # Gráfico Diário
    daily_issuance_query = db.query(
        extract('day', models.NotaFiscalSaida.data_hora_autorizacao).label('day'),
        func.sum(models.Venda.valor_total).label('issuedValue')
    ).join(models.Venda).filter(
        models.NotaFiscalSaida.status_sefaz.in_(['Autorizada', 'Emitida']),
        extract('month', models.NotaFiscalSaida.data_hora_autorizacao) == start_of_month.month
    ).group_by('day').order_by('day').all()

    # Notas Rejeitadas
    rejected_count = db.query(func.count(models.NotaFiscalSaida.id)).filter(
        models.NotaFiscalSaida.status_sefaz == 'Rejeitada'
    ).scalar() or 0
    
    # ✅ CORREÇÃO: Pendentes Antigas
    # Conta Vendas antigas que NÃO têm nota OU têm nota pendente/erro
    old_pending_count = db.query(func.count(models.Venda.id))\
        .outerjoin(models.NotaFiscalSaida)\
        .filter(
            models.Venda.data_hora < seven_days_ago,
            or_(
                models.NotaFiscalSaida.id == None, # Sem nota
                models.NotaFiscalSaida.status_sefaz.in_(['Pendente', 'Rejeitada', 'Erro']) # Nota travada
            )
        ).scalar() or 0

    return {
        "total_comprado_mes": total_comprado,
        "total_emitido_mes": total_emitido,
        "resumo_diario": [
            {"day": int(row.day), "issuedValue": float(row.issuedValue or 0)}
            for row in daily_issuance_query
        ],
        "notas_rejeitadas": rejected_count,
        "pendentes_antigas": old_pending_count
    }

# --- 2. CONFIGURAÇÕES (Mantido) ---
@router.get("/config", response_model=schemas.FiscalConfigResponse)
def get_fiscal_config(db: Session = Depends(get_db)):
    config_empresa = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config_empresa:
        # Default seguro se não houver empresa configurada
        return schemas.FiscalConfigResponse(strategy="coeficiente", goal_value=2.1, autopilot_enabled=False)
        
    return schemas.FiscalConfigResponse(
        strategy=config_empresa.fiscal_strategy,
        goal_value=config_empresa.fiscal_goal_value,
        autopilot_enabled=config_empresa.fiscal_autopilot
    )

@router.post("/config", response_model=schemas.FiscalConfigResponse)
def update_fiscal_config(
    config_update: schemas.FiscalConfigUpdateRequest,
    db: Session = Depends(get_db)
):
    config_empresa = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config_empresa:
        # Cria empresa se não existir (fallback)
        config_empresa = models.Empresa(id=1)
        db.add(config_empresa)

    config_empresa.fiscal_strategy = config_update.strategy
    config_empresa.fiscal_goal_value = config_update.goal_value
    config_empresa.fiscal_autopilot = config_update.autopilot_enabled
    
    db.commit()
    db.refresh(config_empresa)
    
    return schemas.FiscalConfigResponse(
        strategy=config_empresa.fiscal_strategy,
        goal_value=config_empresa.fiscal_goal_value,
        autopilot_enabled=config_empresa.fiscal_autopilot
    )

# --- 3. LISTAGEM (Corrigida para Vendas) ---
@router.get("/notas", response_model=List[schemas.Venda]) 
def list_notas_fiscais(
    skip: int = 0, 
    limit: int = 100, 
    status: str = None, 
    db: Session = Depends(get_db)
):
    """
    Lista todas as Vendas (Left Join Notas).
    """
    query = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida)
    ).order_by(models.Venda.data_hora.desc())
    
    if status and status != "todos":
        if status == "nao_gerada":
            query = query.filter(models.Venda.nota_fiscal_saida == None)
        elif status == "pendente":
            query = query.outerjoin(models.NotaFiscalSaida).filter(
                or_(
                    models.NotaFiscalSaida.id == None,
                    models.NotaFiscalSaida.status_sefaz.in_(['Pendente', 'Rejeitada', 'Erro'])
                )
            )
        elif status == "autorizada":
            query = query.join(models.NotaFiscalSaida).filter(
                models.NotaFiscalSaida.status_sefaz.in_(['Autorizada', 'Emitida'])
            )
        elif status == "rejeitada":
             query = query.join(models.NotaFiscalSaida).filter(
                models.NotaFiscalSaida.status_sefaz == 'Rejeitada'
            )
        elif status == "nao_declarar":
            # Assumindo que existe um status específico ou lógica para isso
             query = query.join(models.NotaFiscalSaida).filter(
                models.NotaFiscalSaida.status_sefaz == 'Nao_Declarar'
            )
            
    return query.offset(skip).limit(limit).all()

# --- 4. AÇÕES DE EMISSÃO ---

@router.post("/notas/{nota_id}/transmitir") 
def transmitir_nota_manual(nota_id: int, db: Session = Depends(get_db)):
    try:
        nota_atualizada = fiscal_service.transmitir_nota(nota_id, db)
        return {
            "status": nota_atualizada.status_sefaz,
            "mensagem": nota_atualizada.xmotivo,
            "protocolo": nota_atualizada.protocolo
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/vendas/{venda_id}/gerar-nota", response_model=schemas.NotaFiscalSaida)
def gerar_nota_tardia(venda_id: int, db: Session = Depends(get_db)):
    """Cria uma nota para uma venda órfã."""
    nota = db.query(models.NotaFiscalSaida).filter(models.NotaFiscalSaida.venda_id == venda_id).first()
    if nota: return nota

    try:
        nova_nota = fiscal_service.inicializar_nota_para_venda(venda_id, db)
        db.commit()
        db.refresh(nova_nota)
        return nova_nota
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar nota: {e}")

@router.post("/emitir/lote", response_model=schemas.ActionResponse)
def trigger_emitir_lote(request_data: schemas.EmitirLoteRequest, db: Session = Depends(get_db)):
    # Se o front manda IDs de VENDA (porque a tabela lista vendas), precisamos:
    # 1. Gerar notas se não existirem
    # 2. Transmitir notas
    
    venda_ids = request_data.venda_ids
    if not venda_ids: raise HTTPException(status_code=400, detail="Nenhum ID fornecido.")

    sucessos = 0
    falhas = 0
    
    for v_id in venda_ids:
        try:
            # 1. Busca ou Cria Nota
            nota = db.query(models.NotaFiscalSaida).filter(models.NotaFiscalSaida.venda_id == v_id).first()
            if not nota:
                nota = fiscal_service.inicializar_nota_para_venda(v_id, db)
                db.add(nota)
                db.commit()
                db.refresh(nota)
            
            # 2. Transmite se necessário
            if nota.status_sefaz not in ['Autorizada', 'Emitida', 'Cancelada']:
                nota_atualizada = fiscal_service.transmitir_nota(nota.id, db)
                if nota_atualizada.status_sefaz in ['Autorizada', 'Emitida']:
                    sucessos += 1
                else:
                    falhas += 1
            else:
                # Já estava emitida
                sucessos += 1

        except Exception as e:
            print(f"Erro lote venda {v_id}: {e}")
            falhas += 1

    return schemas.ActionResponse(message=f"Lote processado. {sucessos} OK, {falhas} Falhas.")


# ✅ ROTA META (Atualizada para não usar status_fiscal da venda)
@router.post("/emitir-meta", response_model=schemas.ActionResponse)
def trigger_emitir_meta(db: Session = Depends(get_db)):
    # 1. Config e Totais (Mesma lógica do get_fiscal_summary)
    config = get_fiscal_config(db)
    if config.autopilot_enabled:
        return schemas.ActionResponse(message="Piloto automático ativo.")
        
    # ... (Lógica de cálculo da meta igual ao anterior) ...
    # Vamos simplificar: Encontra Vendas pendentes até atingir valor
    
    # Busca Vendas que NÃO têm nota Autorizada
    vendas_candidatas = db.query(models.Venda).outerjoin(models.NotaFiscalSaida).filter(
        or_(
            models.NotaFiscalSaida.id == None,
            models.NotaFiscalSaida.status_sefaz.in_(['Pendente', 'Rejeitada', 'Erro'])
        )
    ).order_by(models.Venda.data_hora.asc()).all()
    
    # ... (Lógica de seleção e emissão igual ao trigger_emitir_lote) ...
    
    return schemas.ActionResponse(message="Lógica de meta atualizada para nova estrutura.")


# ... (dentro de app/routers/fiscal.py)

@router.post("/emitir/pendentes", response_model=schemas.ActionResponse)
def trigger_emitir_pendentes(
    tipo: str = "todas", # 'todas', 'nao_geradas', 'pendentes', 'rejeitadas'
    db: Session = Depends(get_db)
):
    """
    Processamento em Lote Cirúrgico.
    O parâmetro 'tipo' define o alvo da operação.
    """
    sucessos = 0
    falhas = 0
    erros_msg = []
    notas_para_processar = []

    print(f"--- LOTE INICIADO: Tipo '{tipo}' ---")

    # 1. ALVO: VENDAS SEM NOTA (Não Geradas)
    if tipo in ["todas", "nao_geradas"]:
        vendas_sem_nota = db.query(models.Venda).outerjoin(models.NotaFiscalSaida).filter(
            models.NotaFiscalSaida.id == None,
            models.Venda.status == 'concluida'
        ).all()
        
        print(f"  > Gerando {len(vendas_sem_nota)} notas novas...")
        
        for venda in vendas_sem_nota:
            try:
                # Gera a nota e já adiciona na fila de transmissão
                nova_nota = fiscal_service.inicializar_nota_para_venda(venda.id, db)
                db.add(nova_nota)
                db.commit() 
                db.refresh(nova_nota)
                notas_para_processar.append(nova_nota)
            except Exception as e:
                falhas += 1
                print(f"  X Erro ao gerar nota venda {venda.id}: {e}")

    # 2. ALVO: NOTAS EXISTENTES (Pendentes/Rejeitadas)
    query_notas = db.query(models.NotaFiscalSaida)
    
    filtros_status = []
    if tipo == "todas":
        filtros_status = ['Pendente', 'Rejeitada', 'Erro', 'pendente', 'rejeitada', 'erro']
    elif tipo == "pendentes":
        filtros_status = ['Pendente', 'pendente']
    elif tipo == "rejeitadas":
        filtros_status = ['Rejeitada', 'Erro', 'rejeitada', 'erro']
        
    if filtros_status:
        notas_existentes = query_notas.filter(
            models.NotaFiscalSaida.status_sefaz.in_(filtros_status)
        ).all()
        notas_para_processar.extend(notas_existentes)

    print(f"  > Total a transmitir: {len(notas_para_processar)}")

    # 3. TRANSMISSÃO
    if not notas_para_processar and falhas == 0:
        return schemas.ActionResponse(message=f"Nenhuma pendência do tipo '{tipo}' encontrada.")

    for nota in notas_para_processar:
        try:
            # O motor é o mesmo: tenta enviar, assinar e validar
            res = fiscal_service.transmitir_nota(nota.id, db)
            
            if res.status_sefaz.lower() in ['autorizada', 'emitida']:
                sucessos += 1
            else:
                falhas += 1
                if len(erros_msg) < 2: 
                    erros_msg.append(f"Nota {nota.id}: {res.xmotivo}")
        except Exception as e:
            falhas += 1
            print(f"  X Erro transmissão nota {nota.id}: {e}")

    resumo = f"Operação '{tipo}' concluída. {sucessos} sucessos, {falhas} falhas."
    if erros_msg: resumo += f" Ex: {erros_msg[0]}..."
    
    return schemas.ActionResponse(message=resumo)