import os
import subprocess
import tempfile
import json
from fastapi import HTTPException


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PHP_SCRIPT = os.path.join(BASE_DIR, "sefaz_service", "consulta_dfe.php")


def consultar_nfe_por_chave(chave_nfe, certificado_binario, senha, cnpj_empresa, homologacao=False):

    if not os.path.exists(PHP_SCRIPT):
        raise HTTPException(status_code=500, detail="Script PHP não encontrado no servidor.")

    # ---- CRIAÇÃO DE ARQUIVO PFX CORRETA NO MACOS ----
    fd, temp_pfx_path = tempfile.mkstemp(suffix=".pfx")
    os.close(fd)  # IMPORTANTE: evita lock e garante que PHP consiga acessar

    with open(temp_pfx_path, "wb") as f:
        f.write(certificado_binario)

    try:
        cmd = [
            "php",
            PHP_SCRIPT,
            chave_nfe,
            temp_pfx_path,
            senha,
            cnpj_empresa,
            "1" if homologacao else "0"
        ]

        print("DEBUG CMD:", cmd)

        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if process.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Erro PHP: {process.stderr}"
            )

        output = process.stdout.strip()
        data = json.loads(output)

        if "error" in data:
            raise HTTPException(status_code=500, detail=f"Erro NFePHP: {data['error']}")

        if "xml" not in data:
            raise HTTPException(status_code=500, detail="Retorno inválido do script PHP.")

        from base64 import b64decode
        return b64decode(data["xml"]).decode("utf-8")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar script PHP: {e}")
    finally:
        if os.path.exists(temp_pfx_path):
            os.remove(temp_pfx_path)
