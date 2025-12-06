import os
import subprocess
import tempfile
import json
import gzip
import io
from base64 import b64decode
from fastapi import HTTPException
from lxml import etree
from datetime import datetime

# Ajuste conforme sua estrutura de pastas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PHP_CONSULTA = os.path.join(BASE_DIR, "sefaz_service", "consulta_dfe.php")
PHP_DISTRIB = os.path.join(BASE_DIR, "sefaz_service", "distribuicao_dfe.php")

# ==========================================
# FUNÇÕES AUXILIARES
# ==========================================

def run_php(script_path, args):
    """Executa o script PHP e retorna o JSON processado, ignorando Warnings."""
    
    # Adicionamos flags para garantir que Warnings não saiam no STDOUT
    command = [
        "php",
        "-d", "display_errors=0",       # Impede que erros apareçam na saída padrão (stdout)
        "-d", "log_errors=1",           # Força erros irem para o log/stderr
        "-d", "error_reporting=E_ERROR", # Ignora Deprecated, Notice e Warning, só para em Erro Fatal
        script_path
    ] + args

    process = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    stdout = process.stdout.strip()
    stderr = process.stderr.strip()

    # Log para debug
    print(f"➡️ [PY] Saída do PHP ({os.path.basename(script_path)}):")
    
    if process.returncode != 0:
        # Erros fatais do PHP costumam ter código de saída diferente de 0
        print(f"⚠️ [PY] STDERR: {stderr}")
        raise HTTPException(500, detail=f"Erro interno no motor SEFAZ (PHP). Verifique os logs.")

    try:
        # Tenta ler o JSON direto
        data = json.loads(stdout)
    except json.JSONDecodeError:
        # BLINDAGEM: Se falhar, tenta limpar o lixo antes e depois do JSON
        print("⚠️ [PY] JSON sujo detectado. Tentando limpar...")
        try:
            # Encontra onde começa o JSON '{' e onde termina '}'
            start = stdout.find('{')
            end = stdout.rfind('}') + 1
            
            if start != -1 and end != -1:
                json_str = stdout[start:end]
                data = json.loads(json_str)
            else:
                raise Exception("Nenhum JSON encontrado na string.")
        except Exception as e:
            print(f"❌ Falha fatal ao decodificar JSON PHP: {stdout}")
            raise HTTPException(500, detail="Retorno inválido do componente SEFAZ.")

    if data.get("status") != "ok":
        raise HTTPException(500, detail=f"Erro SEFAZ: {data.get('error')}")

    return data

def clean_namespaces(root):
    """Remove namespaces do XML para facilitar o find/findall na NFe final"""
    for elem in root.getiterator():
        if not hasattr(elem.tag, 'find'): continue
        i = elem.tag.find('}')
        if i >= 0:
            elem.tag = elem.tag[i+1:]
    return root

def extrair_produtos(root_nfe):
    """Extrai lista bruta de produtos de um objeto etree já limpo"""
    produtos = []
    dets = root_nfe.findall(".//det")

    for det in dets:
        prod = det.find("prod")
        if prod is None: continue
        
        def get_text(tag, default=""):
            el = prod.find(tag)
            return el.text if el is not None else default

        produtos.append({
            "nItem": det.get("nItem"),
            "codigo": get_text("cProd"),
            "ean": get_text("cEAN"),
            "descricao": get_text("xProd"),
            "ncm": get_text("NCM"),
            "cfop": get_text("CFOP"),
            "unidade": get_text("uCom"),
            "quantidade": float(get_text("qCom", "0")),
            "valor_unitario": float(get_text("vUnCom", "0")),
            "valor_total": float(get_text("vProd", "0"))
        })
    return produtos

def processar_xml_distribuicao(xml_envelopado_str):
    """
    Recebe o XML SOAP da distribuição, acha o docZip ignorando namespaces, 
    descompacta e retorna o XML da NFe limpo.
    """
    try:
        # 1. Parse do Envelope SOAP
        root_dist = etree.fromstring(xml_envelopado_str.encode("utf-8"))

        # 2. Busca o docZip usando XPath que ignora namespaces (Infalível)
        # Procura qualquer tag chamada 'docZip' em qualquer profundidade
        doc_zip_elements = root_dist.xpath("//*[local-name()='docZip']")
        
        xml_real = ""
        root_nfe = None

        if doc_zip_elements and doc_zip_elements[0].text:
            doc_zip = doc_zip_elements[0]
            
            # Descompacta: Base64 -> Gzip -> String
            conteudo_compactado = b64decode(doc_zip.text)
            with gzip.GzipFile(fileobj=io.BytesIO(conteudo_compactado)) as f:
                xml_real = f.read().decode("utf-8")
            
            # 3. Parse do XML Real da Nota (que estava dentro do zip)
            root_nfe = etree.fromstring(xml_real.encode("utf-8"))
            root_nfe = clean_namespaces(root_nfe)
        else:
            print("⚠️ [PY] docZip não encontrado ou vazio no XML de distribuição.")
            # Tenta verificar se tem motivo de erro no XML de retorno
            xMotivo = root_dist.xpath("//*[local-name()='xMotivo']")
            if xMotivo:
                print(f"⚠️ Motivo SEFAZ: {xMotivo[0].text}")
        
        return xml_real, root_nfe

    except Exception as e:
        print(f"❌ [PY] Erro ao processar XML Distribuição: {e}")
        return None, None

# ==========================================
# FUNÇÃO PRINCIPAL (SERVIÇO)
# ==========================================

def consultar_nfe_por_chave(chave_nfe, certificado_binario, senha, cnpj_empresa, producao=True):
    print("➡️ [PY] Iniciando consulta NF-e Completa...")

    fd, temp_pfx_path = tempfile.mkstemp(suffix=".pfx")
    os.close(fd)

    try:
        with open(temp_pfx_path, "wb") as f:
            f.write(certificado_binario)

        ambiente_flag = "1" if producao else "0"

        # ----------------------------------------
        # ETAPA 1: CONSULTA STATUS (Validação)
        # ----------------------------------------
        # O retorno dessa etapa não traz produtos, apenas diz se a nota existe
        data_consulta = run_php(PHP_CONSULTA, [
            chave_nfe, temp_pfx_path, senha, cnpj_empresa, ambiente_flag
        ])
        
        # Opcional: Validar cStat da consulta aqui se quiser barrar antes

        # ----------------------------------------
        # ETAPA 2: DISTRIBUIÇÃO (Download do XML)
        # ----------------------------------------
        data_distrib = run_php(PHP_DISTRIB, [
            chave_nfe, temp_pfx_path, senha, cnpj_empresa, ambiente_flag
        ])

        # Decodifica o base64 do envelope SOAP que veio no JSON
        xml_distrib_bruto = b64decode(data_distrib["xml_base64"]).decode("utf-8")

        # ----------------------------------------
        # ETAPA 3: EXTRAÇÃO E DESCOMPACTAÇÃO
        # ----------------------------------------
        xml_nfe_real, root_nfe = processar_xml_distribuicao(xml_distrib_bruto)
        
        if not xml_nfe_real or root_nfe is None:
            # Se chegou aqui, o PHP funcionou, mas não tinha docZip (ex: nota não encontrada para este CNPJ, ou evento de ciência apenas)
            raise HTTPException(404, detail="XML da Nota não encontrado na SEFAZ. Verifique se a nota foi emitida contra este CNPJ.")

        # ----------------------------------------
        # ETAPA 4: EXTRAÇÃO DE DADOS
        # ----------------------------------------
        header = {
            "emitente_nome": root_nfe.findtext(".//emit/xNome"),
            "emitente_cnpj": root_nfe.findtext(".//emit/CNPJ"),
            "numero_nota": root_nfe.findtext(".//ide/nNF"),
            "serie": root_nfe.findtext(".//ide/serie"),            # <--- ADICIONADO
            "data_emissao": root_nfe.findtext(".//ide/dhEmi"),
            "valor_total": root_nfe.findtext(".//total/ICMSTot/vNF"), # <--- ADICIONADO
            "protocolo": root_nfe.findtext(".//protNFe/infProt/nProt")
        }

        produtos_extraidos = extrair_produtos(root_nfe)

        return {
            "status": "ok",
            "chNFe": chave_nfe,
            "header": header,
            "produtos": produtos_extraidos,
            "xml_nfe": xml_nfe_real
        }

    finally:
        if os.path.exists(temp_pfx_path):
            os.remove(temp_pfx_path)