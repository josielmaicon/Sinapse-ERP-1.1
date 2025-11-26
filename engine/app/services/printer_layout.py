from escpos.printer import Dummy
from datetime import datetime

def gerar_layout_cupom(venda, empresa_config):
    """
    Gera os comandos ESC/POS para o cupom fiscal/não-fiscal.
    Retorna os bytes brutos prontos para envio.
    """
    
    # Usamos o 'Dummy' para gerar os bytes na memória sem precisar de uma impressora real conectada agora
    p = Dummy()
    
    # --- 1. CABEÇALHO (Identidade) ---
    p.set(align='center', font='a', bold=True, width=2, height=2)
    p.text(f"{empresa_config.nome_fantasia}\n")
    
    p.set(align='center', font='a', bold=False, width=1, height=1)
    if empresa_config.cnpj:
        p.text(f"CNPJ: {empresa_config.cnpj}\n")
    
    p.text(f"{'-'*42}\n") # Separador (42 colunas é o padrão 80mm)
    
    # Mensagem de Cabeçalho (Configurada no Front)
    # (Assumindo que você vai adicionar 'cupom_header' no models.Empresa depois, 
    # por enquanto vamos simular ou deixar vazio se não existir no objeto)
    if hasattr(empresa_config, 'cupom_header') and empresa_config.cupom_header:
         p.text(f"{empresa_config.cupom_header}\n")
         p.text(f"{'-'*42}\n")

    # --- 2. DADOS DA VENDA ---
    p.set(align='left')
    p.text(f"DATA: {venda.data_hora.strftime('%d/%m/%Y %H:%M:%S')}\n")
    p.text(f"VENDA: #{venda.id:06d}\n")
    if venda.cliente:
        p.text(f"CLIENTE: {venda.cliente.nome}\n")
    else:
        p.text("CLIENTE: Consumidor Final\n")
        
    p.text(f"{'-'*42}\n")
    
    # --- 3. ITENS (O Coração) ---
    p.text("ITEM  COD   DESC             QTD   UN   TOTAL\n")
    
    for i, item in enumerate(venda.itens, start=1):
        # Lógica do Nome (Produto ou Diverso)
        nome_produto = item.descricao_manual if not item.produto else item.produto.nome
        codigo = "DIV" if not item.produto else (item.produto.codigo_barras or "SEM GTIN")
        
        # Linha 1: Nome do Produto
        p.text(f"{i:02d} {nome_produto[:38]}\n")
        
        # Linha 2: Detalhes (indentados)
        # Ex: 789...   2 x 5,00           10,00
        qtd = f"{item.quantidade:.0f}" if item.quantidade.is_integer() else f"{item.quantidade:.3f}"
        valor_unit = f"{item.preco_unitario_na_venda:.2f}"
        valor_total = f"{(item.quantidade * item.preco_unitario_na_venda):.2f}"
        
        # Formatação manual de colunas (ajuste fino de espaçamento)
        linha_detalhe = f"   {codigo[:13]:<13} {qtd:>5} x {valor_unit:>6} = {valor_total:>8}\n"
        p.text(linha_detalhe)

    p.text(f"{'-'*42}\n")
    
    # --- 4. TOTAIS E PAGAMENTO ---
    p.set(align='right', bold=True)
    p.text(f"TOTAL A PAGAR: R$ {venda.valor_total:.2f}\n")
    
    p.set(align='right', bold=False)
    # Se a venda tiver pagamentos mistos (precisamos implementar tabela de pagamentos real no futuro)
    # Por enquanto, usamos o campo 'forma_pagamento'
    if venda.forma_pagamento == 'misto':
        p.text("Pagamento Misto (Ver Detalhes)\n")
    else:
        p.text(f"Forma de Pagamento: {venda.forma_pagamento.upper()}\n")
    
    p.text("\n")

    # --- 5. RODAPÉ (Mensagens) ---
    p.set(align='center')
    
    if hasattr(empresa_config, 'cupom_footer') and empresa_config.cupom_footer:
        p.text(f"{empresa_config.cupom_footer}\n")
    
    if hasattr(empresa_config, 'politica_troca') and empresa_config.politica_troca:
        p.text("\n--- POLÍTICA DE TROCA ---\n")
        p.text(f"{empresa_config.politica_troca}\n")

    p.text("\nDeveloped by Sinapse ERP\n")
    
    # Códigos de corte
    p.cut()
    
    # Retorna os bytes brutos
    return p.output