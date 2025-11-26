import socket
from fastapi import HTTPException

def enviar_impressao(dados_raw: bytes, impressora_config):
    """
    Recebe os bytes ESC/POS e envia para a impressora correta
    baseado na configuração do PDV.
    """
    
    if not impressora_config:
        print("⚠️ Nenhuma impressora configurada para este PDV.")
        return False

    tipo = impressora_config.tipo # 'rede', 'usb', 'windows'
    caminho = impressora_config.caminho # IP ou Nome

    print(f"🖨️ Tentando imprimir em [{tipo}] -> {caminho}")

    try:
        if tipo == 'rede':
            # Impressão via Socket TCP/IP (Porta 9100 padrão)
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5) # Timeout de 5 segundos
                s.connect((caminho, 9100))
                s.sendall(dados_raw)
                print("✅ Enviado para impressora de rede.")
                return True

        elif tipo == 'usb' or tipo == 'windows':
            # ⚠️ ATENÇÃO: Python rodando no servidor não acessa USB do cliente web.
            # Mas como sua arquitetura é Híbrida/Local (o python roda na máquina),
            # podemos tentar imprimir no Spooler local ou USB direto.
            
            # Implementação simples de arquivo (Raw Spooler no Linux/Mac ou LPT1 no Windows)
            # Para Windows robusto, precisaríamos da lib 'win32print'.
            # Vamos simular um dump em arquivo por enquanto para não quebrar se faltar driver.
            
            with open("ultimo_cupom.bin", "wb") as f:
                f.write(dados_raw)
            print(f"✅ Simulação: Arquivo 'ultimo_cupom.bin' gerado (Modo {tipo}).")
            return True
            
    except Exception as e:
        print(f"❌ Erro de Impressão: {e}")
        raise HTTPException(status_code=500, detail=f"Falha na impressora: {str(e)}")