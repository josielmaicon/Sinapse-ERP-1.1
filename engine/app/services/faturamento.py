from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .. import models

def processar_juros_atraso(db: Session):
    """
    Rotina CORE: Varre todos os clientes, verifica vencimentos e carência,
    e aplica juros/multa se necessário.
    Deve ser executada uma vez por dia (idealmente na madrugada).
    """
    
    # 1. Busca Configurações da Empresa (Regras)
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config:
        return {"status": "erro", "mensagem": "Configurações não encontradas."}

    juros_mensal = config.crediario_juros_mensal or 0.0
    # multa_fixa = config.crediario_multa or 0.0 # (Multa fixa é complexa em saldo global, vamos focar nos juros diários por enquanto)
    dias_carencia = config.crediario_dias_carencia or 0
    
    if juros_mensal <= 0:
        return {"status": "ignorado", "mensagem": "Juros configurado como 0%."}

    # Taxa diária simples (Juros Pro-rata die)
    # Ex: 3% ao mês = 0.1% ao dia
    taxa_diaria = (juros_mensal / 30.0) / 100.0 

    # 2. Data de Referência
    hoje = datetime.utcnow().date()
    dia_hoje = hoje.day
    
    # 3. Busca Clientes com Débito
    # (Otimização: só busca quem deve algo e está ativo ou atrasado)
    clientes_devedores = db.query(models.Cliente).filter(
        models.Cliente.saldo_devedor > 0.01,
        models.Cliente.status_conta.in_(['ativo', 'atrasado'])
    ).all()

    processados = 0
    total_juros_gerado = 0.0

    for cliente in clientes_devedores:
        dia_venc = cliente.dia_vencimento_fatura
        if not dia_venc:
            continue # Sem dia definido, não cobra

        # Lógica de Atraso:
        # Se hoje é dia 15, vencimento dia 10. Atraso = 5 dias.
        # Se hoje é dia 02, vencimento dia 10. Não venceu (no mês corrente).
        
        # Simplificação para MVP: Consideramos atraso se o dia atual > (dia_venc + carencia)
        # (Uma implementação Enterprise olharia para a data da última compra não paga, mas isso exige rastreio de fatura)
        
        if dia_hoje > (dia_venc + dias_carencia):
            # O cliente está em atraso neste mês corrente
            
            # 1. Atualiza Status (se ainda não estiver)
            if cliente.status_conta != 'atrasado':
                cliente.status_conta = 'atrasado'
                # (Aqui poderia disparar notificação de cobrança no futuro)

            # 2. Calcula Juros do Dia
            # Juros = Saldo * Taxa Diária
            valor_juros = round(cliente.saldo_devedor * taxa_diaria, 2)
            
            if valor_juros > 0:
                # 3. Aplica a Cobrança
                cliente.saldo_devedor += valor_juros
                
                # 4. Registra no Extrato (Auditoria)
                log = models.TransacaoCrediario(
                    cliente_id=cliente.id,
                    tipo='encargo', # Novo tipo!
                    valor=valor_juros,
                    descricao=f"Juros de Atraso ({juros_mensal}% a.m pro-rata) - Dia {hoje.strftime('%d/%m')}",
                    data_hora=datetime.utcnow()
                )
                db.add(log)
                
                total_juros_gerado += valor_juros
                processados += 1

    db.commit()
    
    return {
        "status": "sucesso",
        "clientes_processados": len(clientes_devedores),
        "cobrancas_geradas": processados,
        "total_juros_adicionado": total_juros_gerado
    }