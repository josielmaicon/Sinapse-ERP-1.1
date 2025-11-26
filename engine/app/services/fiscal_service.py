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
        status="pendente",
        xmotivo="Aguardando processamento",
        data_emissao=datetime.utcnow()
    )
    
    db.add(nova_nota)
    
    # Aqui chamaríamos a função assíncrona (Background Task) para tentar transmitir
    # processar_emissao(nova_nota.id)
    
    return nova_nota

def transmitir_nota(nota_id: int, db: Session):
    """
    Tenta transmitir uma nota pendente/rejeitada para a SEFAZ.
    Retorna um dicionário com o resultado.
    """
    nota = db.query(models.NotaFiscalSaida).filter(models.NotaFiscalSaida.id == nota_id).first()
    if not nota:
        raise ValueError("Nota não encontrada")
    
    # --- AQUI ENTRARIA A LIB 'PyNFe' ou similar ---
    # 1. Gerar XML Assinado
    # 2. Enviar para URL da Sefaz
    # 3. Ler Retorno
    
    # SIMULAÇÃO DE ENVIO (Delay de rede)
    time.sleep(1.5) 
    
    # Simulação de Regras de Negócio da Sefaz
    sucesso = random.choice([True, True, True, False]) # 75% de chance de sucesso
    
    if sucesso:
        nota.status = "autorizada"
        nota.cstat = "100"
        nota.xmotivo = "Autorizado o uso da NF-e"
        nota.protocolo = f"13523000{random.randint(100000,999999)}"
        # nota.xml_retorno = "..."
    else:
        nota.status = "rejeitada"
        nota.cstat = "703" # Erro comum de data
        nota.xmotivo = "Rejeição: Data-Hora de Emissão atrasada"
    
    db.add(nota)
    db.commit()
    db.refresh(nota)
    
    return nota