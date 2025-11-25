from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from .fornecedor import FornecedorBase

class NotaFiscalEntradaBase(BaseModel):
    numero_nota: Optional[str] = None
    chave_acesso: Optional[str] = None
    data_emissao: date
    valor_total: float

class NotaFiscalEntrada(NotaFiscalEntradaBase):
    id: int
    fornecedor: Optional[FornecedorBase] = None

    class Config:
        from_attributes = True

class NotaFiscalSaida(BaseModel):
    id: int
    chave_acesso: Optional[str] = None
    status_sefaz: Optional[str] = None
    data_hora_autorizacao: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotaFiscalEntrada(BaseModel):
    id: int
    numero_nota: str
    data_emissao: date
    valor_total: float
    
    class Config:
        from_attributes = True

class FiscalConfigResponse(BaseModel):
    strategy: str = 'coeficiente'
    goal_value: float = 2.1
    autopilot_enabled: bool = False

class FiscalConfigUpdateRequest(BaseModel):
    strategy: str
    goal_value: float
    autopilot_enabled: bool

class FiscalSummary(BaseModel):
    total_comprado: float
    total_emitido: float
    notas_entrada: List[NotaFiscalEntrada] = []

    class Config:
        from_attributes = True

class EmitirLoteRequest(BaseModel):
    venda_ids: List[int]
    
class CertificadoUpload(BaseModel):
    senha: str

class CertificadoInfo(BaseModel):
    id: int
    nome_arquivo: str
    titular: Optional[str] = None
    emissor: Optional[str] = None
    data_validade: Optional[datetime] = None
    ativo: bool
    
    class Config:
        from_attributes = True

class PerfilAberturaBase(BaseModel):
    nome: str
    horario_sugerido: Optional[str] = "08:00"
    valor_padrao: float = 0.0

class PerfilAbertura(PerfilAberturaBase):
    """Usado para ler um perfil existente (GET)"""
    id: int
    empresa_id: Optional[int] = None # Relacionamento com a empresa

    class Config:
        from_attributes = True

class EmpresaConfig(BaseModel):
    # --- Identidade ---
    nome_fantasia: str
    cnpj: Optional[str] = None
    logo_data: Optional[str] = None
    tipo_logo: Optional[str] = "url"
    
    # --- Aparência ---
    tema_preferido: str = "system"
    cor_destaque: str = "#3b82f6"
    fuso_horario: str = "America/Sao_Paulo"
    
    # --- Operacional ---
    permitir_estoque_negativo: bool = False
    perfis_abertura: List[PerfilAbertura] = [] 

    # --- Financeiro ---
    pix_chave_padrao: Optional[str] = None
    pix_tipo_chave: Optional[str] = "cnpj"
    crediario_multa: float = 0.0
    crediario_juros_mensal: float = 0.0
    crediario_dias_carencia: int = 0
    
    # --- Billing (Leitura) ---
    plano_atual: Optional[str] = "Plano Gratuito"
    status_assinatura: Optional[str] = "ativo"

    # ✅ FISCAL - Identificação
    regime_tributario: str = "simples"
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    csc_id: Optional[str] = None
    csc_token: Optional[str] = None
    
    # ✅ FISCAL - Padrões
    padrao_ncm: Optional[str] = None
    padrao_cfop_dentro: str = "5.102"
    padrao_cfop_fora: str = "6.102"
    padrao_csosn: str = "102"
    
    # ✅ FISCAL - Estratégia de Envio
    ambiente_sefaz: str = "homologacao"
    modo_emissao: str = "automatico"
    contingencia_automatica: bool = True
    timeout_sefaz: int = 8
    tempo_rejeicao: int = 5

    # Relacionamento (Lista de certificados instalados)
    certificados: List[CertificadoInfo] = []
    tentativas_envio_automatico: bool = True
    intervalo_tentativas_minutos: int = 15

    api_produtos_ativo: bool = True
    api_produtos_provider: str = "Cosmos Bluesoft"
    api_produtos_token: Optional[str] = None

    ecommerce_ativo: bool = False
    ecommerce_plataforma: str = "woocommerce"
    ecommerce_url: Optional[str] = None
    ecommerce_key: Optional[str] = None
    ecommerce_secret: Optional[str] = None

    ifood_ativo: bool = False
    ifood_merchant_id: Optional[str] = None
    ifood_auto_aceitar: bool = True

    whatsapp_ativo: bool = False
    whatsapp_sessao: str = "loja_principal"

    contabilidade_email: Optional[str] = None
    contabilidade_sistema: str = "dominio"
    contabilidade_auto_envio: bool = True

    class Config:
        from_attributes = True