from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from .usuario import UsuarioBase, Usuario

class PdvVendaResponse(BaseModel):
    venda_id: int
    mensagem: str
    troco: float = 0.0

class PdvVendaItem(BaseModel):
    db_id: int
    quantity: int
    unitPrice: float

class PdvPagamento(BaseModel):
    tipo: str 
    valor: float

class AdminAuthRequest(BaseModel):
    admin_senha: Optional[str] = None

class PdvVendaRequest(BaseModel):
    pdv_db_id: int
    operador_db_id: int
    cliente_db_id: Optional[int] = None 
    itens: List[PdvVendaItem]
    pagamentos: List[PdvPagamento]
    total_calculado: float 
    override_auth: Optional[AdminAuthRequest] = None

class SolicitacaoBase(BaseModel):
    tipo: str
    detalhes: Optional[str] = None
    pdv_id: int
    operador_id: int

class SolicitacaoCreate(SolicitacaoBase):
    pass
    
class Solicitacao(SolicitacaoBase):
    id: int
    status: str
    data_hora_criacao: datetime

    class Config:
        from_attributes = True

class PdvStatusDetalhado(BaseModel):
    id: int
    nome: str
    status: str
    
    operador_atual: Optional[Usuario] = None
    alerta_pendente: Optional[Solicitacao] = None 
    
    valor_em_caixa: float = 0.0
    total_vendas_dia: int = 0
    hora_abertura: Optional[datetime] = None

    class Config:
        from_attributes = True

class PdvStatus(BaseModel):
    id: int
    nome: str
    status: str
    operador_atual: Optional[UsuarioBase] = None 
    
    class Config:
        from_attributes = True

class PdvDashboardSummary(BaseModel):
    faturamento_total: float
    ticket_medio: float
    pdvs_operando: int
    pdvs_totais: int

class OpenPdvRequest(BaseModel):
    admin_id: int   
    operador_id: int
    valor_abertura: float

class ClosePdvRequest(BaseModel):
    admin_id: int
    valor_fechamento: float

class PdvHistoryLogEntry(BaseModel):
    id: str       
    type: str     
    date: datetime
    value: float  
    user: str     
    details: Optional[str] = None 
    pdvName: Optional[str] = None

    class Config:
        from_attributes = True

class PdvStats(BaseModel):
    pdv_id: int
    ticket_medio: float
    inicio_turno: Optional[datetime] = None

class FaturamentoPorPdvHora(BaseModel):
    pdv_id: int
    pdv_nome: str
    total: float

class ResumoPorHora(BaseModel):
    hour: str
    faturamento_total_hora: float
    faturamento_por_pdv: List[FaturamentoPorPdvHora]

class FaturamentoPorPdv(BaseModel):
    pdv_id: int
    pdv_nome: str
    total: float

class HasActiveSalesResponse(BaseModel):
    has_active_sales: bool
    
class ActionResponse(BaseModel):
    message: str
    
class StatusUpdateRequest(BaseModel):
    novo_status: str 

class ManualItemRequest(BaseModel):
    """Dados necessários para lançar um item de serviço ou diverso."""
    descricao: str
    preco_unitario: float
    quantidade: int
    
    pdv_id: int
    operador_id: int 

class SolicitacaoUpdate(BaseModel):
    status: str
    autorizado_por_id: Optional[int] = None

class ImpressoraBase(BaseModel):
    nome: str
    tipo: str = "rede"
    caminho: Optional[str] = None

class ImpressoraCreate(ImpressoraBase):
    pass

class Impressora(ImpressoraBase):
    id: int
    class Config:
        from_attributes = True

# --- ATUALIZAÇÃO NO PDV ---
class PdvCreate(BaseModel): # Para criar novos PDVs
    nome: str
    impressora_id: Optional[int] = None

class PdvUpdate(BaseModel): # Para editar PDVs existentes
    nome: Optional[str] = None
    impressora_id: Optional[int] = None

class Pdv(BaseModel): # Schema de leitura
    id: int
    nome: str
    status: str
    impressora: Optional[Impressora] = None # Retorna o objeto completo
    # ... outros campos ...
    class Config:
        from_attributes = True