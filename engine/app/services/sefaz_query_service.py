# Python (consultar_nfe_por_chave)
import os
import subprocess
import tempfile
import json
import shutil
from fastapi import HTTPException
from base64 import b64decode

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PHP_SCRIPT = os.path.join(BASE_DIR, "sefaz_service", "consulta_dfe.php")


def consultar_nfe_por_chave(chave_nfe, certificado_binario, senha, cnpj_empresa, homologacao=False):
    if not os.path.exists(PHP_SCRIPT):
        raise HTTPException(status_code=500, detail="Script PHP não encontrado.")

    fd, temp_pfx_path = tempfile.mkstemp(suffix=".pfx")
    os.close(fd)

    runtime_tmp = tempfile.mkdtemp(prefix="nfephp_runtime_")

    try:
        with open(temp_pfx_path, "wb") as f:
            f.write(certificado_binario)

        env = os.environ.copy()
        env["TMPDIR"] = runtime_tmp
        env["TEMP"] = runtime_tmp
        env["TMP"] = runtime_tmp

        cmd = [
            "php",
            PHP_SCRIPT,
            chave_nfe,
            temp_pfx_path,
            senha,
            cnpj_empresa,
            "1" if homologacao else "0"
        ]

        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
            env=env
        )

        raw_output = process.stdout.strip()

        if not raw_output:
            raise HTTPException(
                status_code=500,
                detail="PHP retornou vazio (erro fatal antes do catch)."
            )

        try:
            data = json.loads(raw_output)
            print("\n=== XML CRU DA SEFAZ ===\n")
            print(data.get("raw_xml", "<< SEM raw_xml >>"))
            print("\n=========================\n")
        except:
            raise HTTPException(
                status_code=500,
                detail=f"PHP retornou conteúdo não-JSON: {raw_output[:200]}..."
            )

        if "error" in data:
            raise HTTPException(
                status_code=500,
                detail=f"Erro NFePHP: {data['error']}"
            )

        if "xml_base64" not in data:
            raise HTTPException(
                status_code=500,
                detail="Campo 'xml_base64' ausente no retorno da consulta."
            )

        return b64decode(data["xml_base64"]).decode("utf-8")

    finally:
        if os.path.exists(temp_pfx_path):
            os.remove(temp_pfx_path)
        shutil.rmtree(runtime_tmp, ignore_errors=True)
