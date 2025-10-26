# app/schemas.py

from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

# --- SCHEMAS DE USUÁRIO ---
class UsuarioBase(BaseModel):
    nome: str
    funcao: Optional[str] = "operador"

class UsuarioCreate(UsuarioBase):
    senha_hash: str # No futuro, aqui virá a senha em texto plano

class Usuario(UsuarioBase):
    id: int
    class Config:
        from_attributes = True # Sintaxe correta do Pydantic V2

# --- SCHEMAS DE FORNECEDOR ---
class FornecedorBase(BaseModel):
    nome: str
    cnpj: Optional[str] = None

class FornecedorCreate(FornecedorBase):
    pass

class Fornecedor(FornecedorBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE CLIENTE ---
class ClienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    limite_credito: Optional[float] = 0.0

class ClienteCreate(ClienteBase):
    pass

class Cliente(ClienteBase):
    id: int
    saldo_devedor: float
    status_conta: str
    class Config:
        from_attributes = True

# --- SCHEMAS DE PRODUTO ---
class ProdutoBase(BaseModel):
    nome: str
    preco_venda: float
    quantidade_estoque: Optional[float] = 0
    codigo_barras: Optional[str] = None
    categoria: Optional[str] = None
    preco_custo: Optional[float] = 0.0
    unidade_medida: Optional[str] = "UN"
    vencimento: Optional[date] = None
    
class ProdutoCreate(ProdutoBase):
    pass

class Produto(ProdutoBase):
    id: int
    fornecedor: Optional[Fornecedor] = None
    criador: Optional[Usuario] = None

    class Config:
        from_attributes = True

# --- SCHEMAS DE VENDA ---
class VendaItemBase(BaseModel):
    produto_id: int
    quantidade: float

class VendaItemCreate(VendaItemBase):
    pass

class VendaItem(VendaItemBase):
    id: int
    preco_unitario_na_venda: float
    produto: Produto

    class Config:
        from_attributes = True

class VendaBase(BaseModel):
    cliente_id: Optional[int] = None
    operador_id: int
    pdv_id: int

class VendaCreate(VendaBase):
    itens: List[VendaItemCreate]

class NotaFiscalSaida(BaseModel):
    id: int
    chave_acesso: Optional[str] = None
    status_sefaz: Optional[str] = None
    data_hora_autorizacao: Optional[datetime] = None
    # venda_id: int # Você pode remover isso, não é necessário no frontend

    class Config:
        from_attributes = True # CORRIGIDO (era orm_mode = True)

class Venda(VendaBase):
    id: int
    valor_total: float
    data_hora: datetime
    status: str
    status_fiscal: str
    itens: List[VendaItem] = []
    
    # --- ESTA É A LINHA QUE FALTAVA ---
    # Ela diz ao Pydantic para incluir o objeto da nota, se ele existir
    nota_fiscal_saida: Optional[NotaFiscalSaida] = None 
    # --- FIM DA CORREÇÃO ---
    
    class Config:
        from_attributes = True

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    quantidade_estoque: Optional[float] = None
    preco_venda: Optional[float] = None
    preco_custo: Optional[float] = None
    categoria: Optional[str] = None
    vencimento: Optional[date] = None

class FaturamentoPorPdv(BaseModel):
    pdv_id: int
    pdv_nome: str
    total: float

class ResumoDiario(BaseModel):
    date: date
    faturamento_total_dia: float
    faturamento_por_pdv: List[FaturamentoPorPdv]

class ProdutoMaisVendido(BaseModel):
    name: str
    totalSales: float

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    expiring_soon_count: int
    expired_count: int
    low_stock_count: int

class PdvStatus(BaseModel):
    id: int
    nome: str
    status: str
    operador_atual: Optional[UsuarioBase] = None # Mostra o nome do operador
    # Adicionaremos o valor em caixa no futuro

    class Config:
        from_attributes = True

class FaturamentoPorPdvHora(BaseModel):
    pdv_id: int
    pdv_nome: str
    total: float

class ResumoPorHora(BaseModel):
    hour: str
    faturamento_total_hora: float
    faturamento_por_pdv: List[FaturamentoPorPdvHora]

class NotaFiscalEntrada(BaseModel):
    id: int
    numero_nota: str
    data_emissao: date
    valor_total: float
    
    class Config:
        from_attributes = True
        
class Configuracao(BaseModel):
    chave: str
    valor: str

    class Config:
        from_attributes = True

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

class FiscalSummary(BaseModel):
    total_comprado: float
    total_emitido: float
    notas_entrada: List[NotaFiscalEntrada] = []

    class Config:
        from_attributes = True

class PdvDashboardSummary(BaseModel):
    faturamento_total: float
    ticket_medio: float
    pdvs_operando: int
    pdvs_totais: int

class UsuarioPerformance(UsuarioBase):
    id: int
    status: str
    total_vendas: int
    faturamento_total: float
    ticket_medio: float
    horas_trabalhadas: str # Vamos usar um placeholder por enquanto

    class Config:
        from_attributes = True

class ChartDataPoint(BaseModel):
    key: str  # Pode ser a 'hora' (ex: "08:00") ou o 'dia' (ex: "25/10")
    revenue: float

class PdvStats(BaseModel):
    pdv_id: int
    ticket_medio: float
    inicio_turno: Optional[datetime] = None

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

class CrediarioSummary(BaseModel):
    total_a_receber: float
    total_inadimplente: float
    clientes_com_credito: int

class ClienteCrediario(ClienteBase):
    id: int
    saldo_devedor: float
    status_conta: str
    data_vencimento: int
    limite_credito: float
    limite_disponivel: float

    class Config:
        from_attributes = True

class ResumoEstoqueDiario(BaseModel):
    data: date
    valor_total_estoque: float
    itens_estoque_baixo: int
    itens_vencimento_proximo: int
    itens_sem_giro: int

    class Config:
        from_attributes = True