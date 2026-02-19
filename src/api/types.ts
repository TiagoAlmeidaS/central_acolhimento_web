/**
 * Tipos e enums alinhados ao central_ms (backend).
 * Fonte: central_acolhimento_ms/docs/apis/use-cases-e-endpoints.md
 * A API retorna e aceita PascalCase (Id, Nome, PerfilServico, etc.).
 */

export enum PerfilServico {
  CasaAberta = 0,
  RedeOracao = 1,
  Coordenador = 2,
}

export enum StatusVida {
  Novo = 0,
  Visitado = 1,
  FrequentaReuniao = 2,
  Consolidado = 3,
}

export interface Membro {
  Id: string
  Nome: string
  Whatsapp: string
  Bairro: string
  PerfilServico: PerfilServico
  LimiteAcolhimento: number
  UserId: string | null
}

export interface ContatoTci {
  Id: string
  Nome: string
  Whatsapp: string
  StatusVida: StatusVida
  ResponsavelId: string | null
}

export interface CriarMembroRequest {
  Nome: string
  Whatsapp: string
  Bairro: string
  PerfilServico: PerfilServico
  LimiteAcolhimento: number
  UserId?: string | null
}

export interface AtualizarMembroRequest {
  Nome: string
  Whatsapp: string
  Bairro: string
  PerfilServico: PerfilServico
  LimiteAcolhimento: number
  UserId?: string | null
}

export interface CriarContatoTciRequest {
  Nome: string
  Whatsapp: string
  StatusVida?: StatusVida
  ResponsavelId?: string | null
}

export interface AtualizarContatoTciRequest {
  Nome: string
  Whatsapp: string
  StatusVida: StatusVida
  ResponsavelId?: string | null
}

export interface AtribuirResponsavelError {
  mensagemErro: string
}
