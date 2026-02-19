/**
 * Cliente HTTP para a API do central_ms.
 * Base URL: VITE_API_URL ou fallback para desenvolvimento local.
 */

import type {
  Membro,
  ContatoTci,
  CriarMembroRequest,
  AtualizarMembroRequest,
  CriarContatoTciRequest,
  AtualizarContatoTciRequest,
  AtribuirResponsavelError,
} from './types'

const getBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  }
  return 'http://localhost:5000'
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as AtribuirResponsavelError
      throw new Error(body.mensagemErro ?? res.statusText)
    }
    if (res.status === 404) {
      throw new Error('Recurso não encontrado')
    }
    throw new Error(res.statusText || `Erro ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function getMembros(bairro?: string | null): Promise<Membro[]> {
  const base = getBaseUrl()
  const url = bairro ? `${base}/api/membros?bairro=${encodeURIComponent(bairro)}` : `${base}/api/membros`
  const res = await fetch(url)
  return handleResponse<Membro[]>(res)
}

export async function getMembro(id: string): Promise<Membro> {
  const res = await fetch(`${getBaseUrl()}/api/membros/${id}`)
  return handleResponse<Membro>(res)
}

export async function createMembro(body: CriarMembroRequest): Promise<Membro> {
  const res = await fetch(`${getBaseUrl()}/api/membros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Membro>(res)
}

export async function updateMembro(id: string, body: AtualizarMembroRequest): Promise<Membro> {
  const res = await fetch(`${getBaseUrl()}/api/membros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Membro>(res)
}

export async function getContatosTci(): Promise<ContatoTci[]> {
  const res = await fetch(`${getBaseUrl()}/api/contatos-tci`)
  return handleResponse<ContatoTci[]>(res)
}

export async function getContatoTci(id: string): Promise<ContatoTci> {
  const res = await fetch(`${getBaseUrl()}/api/contatos-tci/${id}`)
  return handleResponse<ContatoTci>(res)
}

export async function createContatoTci(body: CriarContatoTciRequest): Promise<ContatoTci> {
  const res = await fetch(`${getBaseUrl()}/api/contatos-tci`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      StatusVida: body.StatusVida ?? 0,
      ResponsavelId: body.ResponsavelId ?? null,
    }),
  })
  return handleResponse<ContatoTci>(res)
}

export async function updateContatoTci(id: string, body: AtualizarContatoTciRequest): Promise<ContatoTci> {
  const res = await fetch(`${getBaseUrl()}/api/contatos-tci/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<ContatoTci>(res)
}

export async function atribuirResponsavel(contatoId: string, membroId: string): Promise<ContatoTci> {
  const res = await fetch(
    `${getBaseUrl()}/api/contatos-tci/${contatoId}/atribuir-responsavel/${membroId}`,
    { method: 'POST' }
  )
  return handleResponse<ContatoTci>(res)
}
