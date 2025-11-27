import xmltodict
from datetime import datetime

def parse_nfe_xml(xml_content: bytes):
    """
    Transforma os bytes brutos de um XML de NFe em um objeto Python limpo.
    """
    try:
        # 1. Transforma XML em Dict
        parsed = xmltodict.parse(xml_content)
        
        # 2. Navega até a raiz (pode ser nfeProc ou NFe direto)
        if 'nfeProc' in parsed:
            nfe_root = parsed['nfeProc']['NFe']['infNFe']
        else:
            nfe_root = parsed['NFe']['infNFe']
            
        # 3. Extrai Cabeçalho (Identificação e Emitente)
        header = {
            "chave_acesso": nfe_root['@Id'].replace('NFe', ''),
            "numero_nota": nfe_root['ide']['nNF'],
            "serie": nfe_root['ide']['serie'],
            "data_emissao": nfe_root['ide']['dhEmi'], # Formato ISO
            "emitente": {
                "cnpj": nfe_root['emit']['CNPJ'],
                "nome": nfe_root['emit']['xNome'],
                "ie": nfe_root['emit'].get('IE', '')
            },
            "valor_total_nota": float(nfe_root['total']['ICMSTot']['vNF'])
        }
        
        # 4. Extrai Produtos (Itens)
        # xmltodict retorna uma lista se houver vários, ou um dict se for só um.
        # Precisamos normalizar para sempre ser uma lista.
        detalhes = nfe_root['det']
        if not isinstance(detalhes, list):
            detalhes = [detalhes]
            
        itens = []
        for det in detalhes:
            prod = det['prod']
            itens.append({
                "codigo_fornecedor": prod['cProd'],
                "codigo_barras": prod.get('cEAN', 'SEM GTIN'), # cEAN é o código de barras global
                "nome": prod['xProd'],
                "ncm": prod['NCM'],
                "cfop": prod['CFOP'],
                "unidade": prod['uCom'],
                "quantidade": float(prod['qCom']),
                "valor_unitario": float(prod['vUnCom']),
                "valor_total": float(prod['vProd'])
            })
            
        return { "header": header, "itens": itens }

    except Exception as e:
        print(f"Erro ao parsear XML: {e}")
        raise ValueError("Arquivo XML inválido ou formato não reconhecido.")