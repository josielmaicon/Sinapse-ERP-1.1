from sqlalchemy.orm import Session
from .. import models
from datetime import datetime
import time
import random

def inicializar_nota_para_venda(venda_id: int, db: Session):
    """
    Cria o registro inicial da Nota Fiscal para uma venda concluída.
    Chamado automaticamente quando a venda é finalizada no PDV.
    """
    # 1. Verifica se já existe
    existing = db.query(models.NotaFiscalSaida).filter(models.NotaFiscalSaida.venda_id == venda_id).first()
    if existing:
        return existing

    # 2. Busca configurações para saber a numeração
    # (Num cenário real, teríamos uma tabela de Sequência Fiscal para não pular números)
    # Simplificação: Pega a última nota + 1
    ultima_nota = db.query(models.NotaFiscalSaida).order_by(models.NotaFiscalSaida.numero.desc()).first()
    proximo_numero = (ultima_nota.numero + 1) if ultima_nota and ultima_nota.numero else 1
    
    config = db.query(models.Empresa).first()
    serie = 1 # Padrão, ou ler de config

    # 3. Cria o registro "Pendente"
    nova_nota = models.NotaFiscalSaida(
        venda_id=venda_id,
        empresa_id=config.id,
        numero=proximo_numero,
        serie=serie,
        modelo="65", # NFC-e
        status_sefaz="pendente", 
        xmotivo="Aguardando processamento",
        data_emissao=datetime.utcnow()

    )
    
    db.add(nova_nota)
    
    # Aqui chamaríamos a função assíncrona (Background Task) para tentar transmitir
    # processar_emissao(nova_nota.id)
    
    return nova_nota

def transmitir_nota(nota_id: int, db: Session):
    """
    Simula a transmissão e FORÇA o salvamento.
    """
    nota = db.query(models.NotaFiscalSaida).get(nota_id)
    
    if not nota:
        raise ValueError("Nota não encontrada")
    
    print(f"  > Processando Nota {nota.id} (Status Atual: {nota.status_sefaz})...")

    time.sleep(1.0) # Simula delay de rede
    
    # Sorteio do destino (Simulação SEFAZ)
    sucesso = random.choice([True, True, False]) 
    
    if sucesso:
        nota.status_sefaz = "Autorizada" # ✅ Nome correto
        nota.cstat = "100"
        nota.xmotivo = "Autorizado o uso da NF-e"
        nota.protocolo = f"1352300{random.randint(100000,999999)}"
        nota.data_hora_autorizacao = datetime.utcnow()
    else:
        nota.status_sefaz = "Rejeitada" # ✅ Nome correto
        nota.cstat = "703"
        nota.xmotivo = "Rejeição: Data-Hora de Emissão atrasada"
    
    db.add(nota)
    db.commit()
    db.refresh(nota)
    
    print(f"  > Nota {nota.id} atualizada para: {nota.status_sefaz}")
    
    return nota