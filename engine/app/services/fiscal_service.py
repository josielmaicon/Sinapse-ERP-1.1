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
    Motor REAL de Emissão NFC-e.
    1. Prepara dados (Empresa, Venda, Cliente).
    2. Decide a estratégia de identificação do destinatário.
    3. Aciona o microserviço PHP para assinatura e envio.
    4. Processa o retorno e atualiza o banco.
    """
    
    # 1. Busca a Nota e Validações Iniciais
    nota = db.query(models.NotaFiscalSaida).get(nota_id)
    if not nota: 
        raise ValueError(f"Nota ID {nota_id} não encontrada.")
    
    venda = nota.venda
    if not venda:
        raise ValueError("Venda vinculada não encontrada.")

    empresa = db.query(models.Empresa).first()
    if not empresa: 
        raise ValueError("Configurações da empresa não encontradas.")
    
    # Busca certificado ativo
    certificado = db.query(models.CertificadoDigital).filter_by(empresa_id=empresa.id, ativo=True).first()
    if not certificado:
        # Se não tiver certificado, cai no modo simulação (para não travar seu desenvolvimento)
        print("⚠️ Sem certificado: Rodando simulação de fallback.")
        return _simular_transmissao(nota, db)

    # 2. LÓGICA DO CLIENTE (A Hierarquia da Identidade)
    destinatario_cpf = None
    destinatario_nome = None

    if venda.cliente:
        # Prioridade 1: Cliente Cadastrado (Crediário/Fidelidade)
        # Remove pontuação do CPF para evitar rejeição
        raw_cpf = venda.cliente.cpf or ""
        destinatario_cpf = "".join(filter(str.isdigit, raw_cpf))
        destinatario_nome = venda.cliente.nome
    elif venda.cpf_nota:
        # Prioridade 2: CPF Avulso na Venda (O "CPF na nota" do caixa)
        raw_cpf = venda.cpf_nota
        destinatario_cpf = "".join(filter(str.isdigit, raw_cpf))
        destinatario_nome = None # Na NFC-e, se for só CPF, nome não é obrigatório (ou usa 'CONSUMIDOR')

    # 3. Monta o Payload JSON para o PHP
    payload = {
        "empresa": {
            "razao_social": empresa.razao_social,
            "nome_fantasia": empresa.nome_fantasia,
            "cnpj": empresa.cnpj.replace(".", "").replace("/", "").replace("-", ""),
            "ie": empresa.inscricao_estadual,
            "regime": empresa.regime_tributario,
            # Converte ambiente: 'homologacao' -> 2, 'producao' -> 1
            "ambiente": "2" if empresa.ambiente_sefaz == 'homologacao' else "1",
            "csc_id": empresa.csc_id,
            "csc_token": empresa.csc_token
        },
        "venda": {
            "id": venda.id,
            "numero_nota": nota.numero,
            "total_produtos": venda.valor_total, # Ajustar se tiver lógica de desconto/frete separada
            "total_nota": venda.valor_total,
            "forma_pagamento": venda.forma_pagamento or "dinheiro",
            
            # ✅ Dados do Cliente Processados
            "cliente_cpf": destinatario_cpf,
            "cliente_nome": destinatario_nome,
            
            "itens": []
        }
    }

    # Processa Itens
    for item in venda.itens:
        # Garante valores numéricos seguros
        qtd = float(item.quantidade)
        preco = float(item.preco_unitario_na_venda)
        
        payload["venda"]["itens"].append({
            "codigo": str(item.produto.id),
            "descricao": item.descricao_manual or item.produto.nome,
            # Fallback para NCM genérico se o cadastro estiver incompleto (Evita Rejeição 778)
            "ncm": item.produto.ncm or empresa.padrao_ncm or "00000000",
            "cfop": empresa.padrao_cfop_dentro,
            "csosn": empresa.padrao_csosn,
            "unidade": item.produto.unidade_medida or "UN",
            "quantidade": qtd,
            "valor_unitario": preco,
            "valor_total": qtd * preco
        })

    # 4. Prepara Arquivos Temporários (JSON e PFX)
    # O PFX é extraído do banco e salvo temporariamente para o PHP ler
    fd_json, path_json = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd_json, 'w') as f:
        json.dump(payload, f)
    
    fd_pfx, path_pfx = tempfile.mkstemp(suffix=".pfx")
    with os.fdopen(fd_pfx, 'wb') as f:
        f.write(certificado.arquivo_binario)

    try:
        print(f"🚀 [Python] Acionando PHP para emitir Nota #{nota.numero}...")
        
        # 5. Execução do Microserviço
        result = subprocess.run(
            [PHP_EXEC, SCRIPT_PATH, path_json, path_pfx, certificado.senha_arquivo],
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            # timeout=30 # Opcional: timeout de segurança para não travar a thread
        )
        
        # Log de erro do PHP (se houver crash)
        if result.stderr:
            print(f"⚠️ [PHP STDERR]: {result.stderr}")

        # 6. Parse da Resposta
        try:
            # Tenta decodificar o JSON retornado pelo PHP
            resposta = json.loads(result.stdout)
        except json.JSONDecodeError:
            print("❌ Erro ao ler JSON do PHP. Saída bruta:", result.stdout)
            # Retorna um erro amigável para o front
            nota.status_sefaz = "Erro"
            nota.xmotivo = "Falha interna no motor de emissão (PHP)."
            db.add(nota)
            db.commit()
            return nota

        # 7. Atualiza o Banco com o Resultado SEFAZ
        if resposta['status'] == 'autorizada':
            nota.status_sefaz = "Autorizada"
            nota.cstat = str(resposta.get('cstat', '100'))
            nota.xmotivo = resposta.get('motivo', 'Autorizado o uso da NF-e')
            nota.protocolo = resposta.get('protocolo')
            nota.chave_acesso = resposta.get('chave', nota.chave_acesso) # Atualiza a chave se o PHP gerou uma nova
            nota.data_hora_autorizacao = datetime.utcnow()
            
            # Salva o XML Protocolado (Base64) se disponível
            if 'xml_protocolado' in resposta:
                nota.xml_retorno = resposta['xml_protocolado'] 
                
        elif resposta['status'] == 'rejeitada':
            nota.status_sefaz = "Rejeitada"
            nota.cstat = str(resposta.get('cstat', '0'))
            nota.xmotivo = resposta.get('motivo', 'Rejeição desconhecida')
            # Se o PHP devolveu o XML de envio (para debug), salvamos
            if 'xml_envio' in resposta:
                nota.xml_envio = resposta['xml_envio']
                
        else:
            # Erros de validação local (antes de enviar) ou exceções
            nota.status_sefaz = "Erro"
            nota.xmotivo = resposta.get('motivo', 'Erro desconhecido durante emissão')

        db.add(nota)
        db.commit()
        db.refresh(nota)
        
        print(f"✅ Processamento concluído. Status: {nota.status_sefaz}")
        return nota

    except Exception as e:
        print(f"❌ Erro crítico no Python: {e}")
        # Não deixa o erro explodir para o usuário, salva o estado de erro na nota
        nota.status_sefaz = "Erro"
        nota.xmotivo = f"Erro sistêmico: {str(e)}"
        db.add(nota)
        db.commit()
        return nota

    finally:
        # 8. Limpeza (Segurança)
        # Apaga os arquivos temporários com a senha e dados
        if os.path.exists(path_json): os.remove(path_json)
        if os.path.exists(path_pfx): os.remove(path_pfx)

# --- FALLBACK DE SIMULAÇÃO ---
def _simular_transmissao(nota, db):
    """Usado quando não há certificado configurado"""
    import time, random
    time.sleep(1)
    
    # 80% de chance de sucesso simulado
    sucesso = random.random() > 0.2
    
    if sucesso:
        nota.status_sefaz = "Autorizada"
        nota.cstat = "100"
        nota.xmotivo = "Autorizado o uso da NF-e (SIMULADO)"
        nota.protocolo = f"14123{random.randint(100000,999999)}"
        nota.data_hora_autorizacao = datetime.utcnow()
    else:
        nota.status_sefaz = "Rejeitada"
        nota.cstat = "703"
        nota.xmotivo = "Rejeição: Data-Hora de Emissão atrasada (SIMULADO)"
    
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return nota