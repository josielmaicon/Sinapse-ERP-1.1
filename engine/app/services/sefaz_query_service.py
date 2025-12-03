import os
import tempfile
import base64
import zlib

from fastapi import HTTPException
from erpbrasil.nfelib_legacy.v4_00 import distDFeInt as schema_req
from erpbrasil.nfelib_legacy.v4_00 import retDistDFeInt as schema_resp

from erpbrasil.assinatura.certificado import Certificado
from erpbrasil.transmissao.transmissao import Transmissao

def get_xml_from_sefaz(
    chave_nfe: str,
    certificado_binario: bytes,
    senha: str,
    cnpj_destinatario: str,
    homologacao: bool = False
):
    temp_cert_path = None
    ambiente = "2" if homologacao else "1"

    try:
        # 1 — Criar arquivo temporário pfx
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as fp:
            fp.write(certificado_binario)
            temp_cert_path = fp.name

        # 2 — Carregar certificado A1
        cert = Certificado.arquivo_pfx(temp_cert_path, senha)

        # 3 — Criar transmissor SOAP
        transmissor = Transmissao(certificado=cert)

        # 4 — Montar XML <distDFeInt>
        req = schema_req.distDFeInt(
            versao="1.00",
            tpAmb=ambiente,
            cUFAutor="35",  # SP (não afeta consulta por chave)
            CNPJ=cnpj_destinatario,
            consChNFe=schema_req.consChNFe(chNFe=chave_nfe)
        )

        xml_req = req.toxml()

        # 5 — Enviar para SEFAZ
        resposta_xml = transmissor.transmitir(
            servico="NFeDistribuicaoDFe",
            estado="AN",  # Ambiente Nacional (SIAN)
            xml=xml_req
        )

        # 6 — Parsear XML
        resposta = schema_resp.retDistDFeInt.fromxml(resposta_xml)

        if not resposta.loteDistDFeInt or not resposta.loteDistDFeInt.docZip:
            raise HTTPException(status_code=404, detail="Nenhum documento retornado pela SEFAZ.")

        # 7 — Extrair docZip
        for doc in resposta.loteDistDFeInt.docZip:
            if doc.tpAmb == ambiente:
                conteudo_zip = base64.b64decode(doc.value)
                xml_descompactado = zlib.decompress(conteudo_zip, -15)
                return xml_descompactado.decode("utf-8")

        raise HTTPException(status_code=404, detail="NF-e não encontrada para esta chave.")

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar Distribuição DF-e: {e}"
        )

    finally:
        if temp_cert_path and os.path.exists(temp_cert_path):
            os.remove(temp_cert_path)
