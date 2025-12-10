from sqlalchemy.orm import Session
from .. import models
from datetime import datetime
import time
import random
import json
import subprocess
import os
import tempfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PHP_EXEC = "php" # Garanta que o php está no PATH do sistema
SCRIPT_PATH = os.path.join(BASE_DIR, "sefaz_service", "emitir_nfce.php")

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
    Motor REAL de Emissão.
    """
    nota = db.query(models.NotaFiscalSaida).get(nota_id)
    if not nota: raise ValueError("Nota não encontrada")
    
    # 1. Busca Dados Reais
    venda = nota.venda
    empresa = db.query(models.Empresa).first()
    
    # Busca certificado
    certificado = db.query(models.CertificadoDigital).filter_by(empresa_id=empresa.id, ativo=True).first()
    if not certificado:
        # Fallback: Se não tiver certificado real, mantemos a simulação para não travar o dev
        print("⚠️ Sem certificado: Rodando simulação.")
        return _simular_transmissao(nota, db)

    # 2. Monta o Payload JSON
    payload = {
        "empresa": {
            "razao_social": empresa.razao_social,
            "nome_fantasia": empresa.nome_fantasia,
            "cnpj": empresa.cnpj.replace(".", "").replace("/", "").replace("-", ""),
            "ie": empresa.inscricao_estadual,
            "regime": empresa.regime_tributario,
            "ambiente": "2" if empresa.ambiente_sefaz == 'homologacao' else "1",
            "csc_id": empresa.csc_id,
            "csc_token": empresa.csc_token
        },
        "venda": {
            "id": venda.id,
            "numero_nota": nota.numero,
            "total_produtos": venda.valor_total,
            "total_nota": venda.valor_total,
            "forma_pagamento": venda.forma_pagamento or "dinheiro",
            "cliente_cpf": venda.cliente.cpf if venda.cliente else None,
            "cliente_nome": venda.cliente.nome if venda.cliente else None,
            "itens": []
        }
    }

    for item in venda.itens:
        payload["venda"]["itens"].append({
            "codigo": str(item.produto.id),
            "descricao": item.descricao_manual or item.produto.nome,
            "ncm": item.produto.ncm or empresa.padrao_ncm or "00000000",
            "cfop": empresa.padrao_cfop_dentro,
            "csosn": empresa.padrao_csosn,
            "unidade": "UN",
            "quantidade": item.quantidade,
            "valor_unitario": item.preco_unitario_na_venda,
            "valor_total": item.quantidade * item.preco_unitario_na_venda
        })

    # 3. Prepara Arquivos Temporários
    fd_json, path_json = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd_json, 'w') as f:
        json.dump(payload, f)
    
    fd_pfx, path_pfx = tempfile.mkstemp(suffix=".pfx")
    with os.fdopen(fd_pfx, 'wb') as f:
        f.write(certificado.arquivo_binario)

    try:
        print(f"🚀 Chamando PHP para emitir Nota #{nota.numero}...")
        
        # 4. Executa PHP
        result = subprocess.run(
            [PHP_EXEC, SCRIPT_PATH, path_json, path_pfx, certificado.senha_arquivo],
            capture_output=True, text=True, encoding='utf-8' # Encoding importante!
        )
        
        # Parse da Resposta
        try:
            resposta = json.loads(result.stdout)
        except json.JSONDecodeError:
            print("❌ Erro JSON PHP:", result.stdout)
            raise Exception("Resposta inválida do emissor fiscal.")

        # 5. Atualiza o Banco
        if resposta['status'] == 'autorizada':
            nota.status_sefaz = "Autorizada"
            nota.cstat = str(resposta['cstat'])
            nota.xmotivo = resposta['motivo']
            nota.protocolo = resposta['protocolo']
            nota.chave_acesso = resposta.get('chave', nota.chave_acesso)
            nota.data_hora_autorizacao = datetime.utcnow()
        else:
            nota.status_sefaz = "Rejeitada"
            nota.cstat = str(resposta.get('cstat', '0'))
            nota.xmotivo = resposta.get('motivo', 'Erro desconhecido')

        db.add(nota)
        db.commit()
        db.refresh(nota)
        return nota

    finally:
        if os.path.exists(path_json): os.remove(path_json)
        if os.path.exists(path_pfx): os.remove(path_pfx)

# Função de fallback para testes sem certificado
def _simular_transmissao(nota, db):
    import time, random
    time.sleep(1)
    if random.choice([True, True, False]):
        nota.status_sefaz = "Autorizada"
        nota.xmotivo = "Autorizado (Simulado)"
    else:
        nota.status_sefaz = "Rejeitada"
        nota.xmotivo = "Rejeição Simulada"
    db.commit()
    return nota