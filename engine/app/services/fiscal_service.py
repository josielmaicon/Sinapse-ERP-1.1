from sqlalchemy.orm import Session
from .. import models
from datetime import datetime
import time
import random

def inicializar_nota_para_venda(venda_id: int, db: Session):
    """
    Cria o registro inicial da Nota Fiscal para uma venda concluída.
    """
    # 1. Verifica se já existe
    existing = db.query(models.NotaFiscalSaida).filter(models.NotaFiscalSaida.venda_id == venda_id).first()
    if existing:
        return existing

    # 2. Busca número sequencial
    ultima_nota = db.query(models.NotaFiscalSaida).order_by(models.NotaFiscalSaida.numero.desc()).first()
    proximo_numero = (ultima_nota.numero + 1) if (ultima_nota and ultima_nota.numero) else 1
    
    # 3. Busca a empresa para pegar o ID
    config = db.query(models.Empresa).first()
    
    # ✅ BLINDAGEM: Se não houver empresa, usa ID 1 e avisa
    if not config:
        print("⚠️ AVISO: Tabela 'Empresa' vazia. Usando ID 1 como fallback para a Nota Fiscal.")
        empresa_id = 1 
    else:
        empresa_id = config.id

    # 4. Cria o registro "Pendente"
    nova_nota = models.NotaFiscalSaida(
        venda_id=venda_id,
        empresa_id=empresa_id,
        numero=proximo_numero,
        serie=1,
        modelo="65", 
        status_sefaz="Pendente", 
        xmotivo="Nota gerada, aguardando transmissão",
        data_emissao=datetime.utcnow()
    )
    
    db.add(nova_nota)
    db.flush() # Garante que a nota ganhe um ID imediatamente
    
    return nova_nota

def transmitir_nota(nota_id: int, db: Session):
    """
    Simula a transmissão e FORÇA o salvamento.
    """
    nota = db.query(models.NotaFiscalSaida).get(nota_id)
    
    if not nota:
        raise ValueError(f"Nota ID {nota_id} não encontrada.")
    
    print(f"  > Transmitindo Nota {nota.id} (Status Atual: {nota.status_sefaz})...")

    time.sleep(0.5) # Simula delay de rede (reduzido para testes)
    
    # Simulação de sucesso aleatório
    sucesso = random.choice([True, True, False]) 
    
    if sucesso:
        nota.status_sefaz = "Autorizada"
        nota.cstat = "100"
        nota.xmotivo = "Autorizado o uso da NF-e"
        nota.protocolo = f"1352300{random.randint(100000,999999)}"
        nota.data_hora_autorizacao = datetime.utcnow()
    else:
        nota.status_sefaz = "Rejeitada"
        nota.cstat = "703"
        nota.xmotivo = "Rejeição: Data-Hora de Emissão atrasada"
    
    db.add(nota)
    db.commit()
    db.refresh(nota)
    
    return nota