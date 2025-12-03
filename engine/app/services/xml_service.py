import xmltodict
from datetime import datetime
from typing import Dict, Any, List

def parse_nfe_xml(xml_content: str) -> Dict[str, Any]:
    """
    Transforma o conteúdo XML (<procNFe> ou <nfeProc>) de uma NFe baixada
    pelo serviço DF-e em um objeto Python limpo e estruturado.
    
    Args:
        xml_content: String XML bruta da NF-e completa.
        
    Returns:
        Um dicionário contendo 'header' e 'itens' da nota.
    """
    try:
        # 1. Transforma XML em Dict
        parsed = xmltodict.parse(xml_content)
        
        # 2. Navegação até a raiz <infNFe>
        
        # O DF-e retorna <procNFe> que contém a nota e o protocolo
        if 'procNFe' in parsed:
            # Estrutura: <procNFe> -> <NFe> -> <infNFe>
            nfe_root = parsed['procNFe']['NFe']['infNFe']
        
        # Estrutura de sistemas antigos (ou upload direto)
        elif 'nfeProc' in parsed:
            nfe_root = parsed['nfeProc']['NFe']['infNFe']
            
        # Se veio a nota sem o protocolo
        elif 'NFe' in parsed:
            nfe_root = parsed['NFe']['infNFe']
        
        else:
             raise ValueError("Estrutura XML de NF-e completa não reconhecida.")

        
        # 3. Extrai Cabeçalho (Identificação e Emitente)
        header = {
            # O @Id da infNFe é a chave de acesso (com o prefixo 'NFe')
            "chave_acesso": nfe_root['@Id'].replace('NFe', ''),
            "numero_nota": nfe_root['ide']['nNF'],
            "serie": nfe_root['ide']['serie'],
            # Data e hora de emissão
            "data_emissao": nfe_root['ide']['dhEmi'], 
            "emitente": {
                "cnpj": nfe_root['emit']['CNPJ'],
                "nome": nfe_root['emit']['xNome'],
                "ie": nfe_root['emit'].get('IE', '')
            },
            # O valor total sempre deve ser float
            "valor_total_nota": float(nfe_root['total']['ICMSTot']['vNF'])
        }
        
        # 4. Extrai Produtos (Itens)
        detalhes = nfe_root['det']
        # xmltodict retorna uma lista se houver vários, ou um dict se for só um. Normalizar é obrigatório.
        if not isinstance(detalhes, list):
            detalhes = [detalhes]
            
        itens: List[Dict[str, Any]] = []
        for det in detalhes:
            prod = det['prod']
            
            # Garantir que os campos que serão usados em cálculos sejam float
            itens.append({
                "codigo_fornecedor": prod['cProd'],
                # cEAN é o código de barras global (pode estar ausente)
                "codigo_barras": prod.get('cEAN', 'SEM GTIN'), 
                "nome": prod['xProd'],
                "ncm": prod['NCM'],
                "cfop": prod['CFOP'],
                "unidade": prod['uCom'],
                "quantidade": float(prod['qCom']),
                "valor_unitario": float(prod['vUnCom']),
                "valor_total": float(prod['vProd'])
                # Nota: Outras informações fiscais (ICMS, PIS/COFINS) devem ser 
                # extraídas aqui se forem necessárias para o preview.
            })
            
        return { "header": header, "itens": itens }

    except Exception as e:
        print(f"Erro ao parsear XML: {e}")
        # Lançar um erro genérico com mais contexto
        raise ValueError(f"Falha ao interpretar a estrutura XML da NF-e: {e}")