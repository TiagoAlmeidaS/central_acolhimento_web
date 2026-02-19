import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker/locale/pt_BR'
import { getMembros, createMembro, getContatosTci, atribuirResponsavel } from './client'
import { PerfilServico, StatusVida } from './types'
import type { Membro, ContatoTci } from './types'

const baseUrl = 'http://localhost:5000'

function fakeMembro(overrides: Partial<Membro> = {}): Membro {
  return {
    Id: faker.string.uuid(),
    Nome: faker.person.fullName(),
    Whatsapp: faker.phone.number(),
    Bairro: faker.location.streetAddress(),
    PerfilServico: faker.helpers.arrayElement([PerfilServico.CasaAberta, PerfilServico.RedeOracao, PerfilServico.Coordenador]),
    LimiteAcolhimento: faker.number.int({ min: 1, max: 5 }),
    UserId: null,
    ...overrides,
  }
}

function fakeContatoTci(overrides: Partial<ContatoTci> = {}): ContatoTci {
  return {
    Id: faker.string.uuid(),
    Nome: faker.person.fullName(),
    Whatsapp: faker.phone.number(),
    StatusVida: faker.helpers.arrayElement([StatusVida.Novo, StatusVida.Visitado, StatusVida.FrequentaReuniao, StatusVida.Consolidado]),
    ResponsavelId: null,
    ...overrides,
  }
}

describe('api client', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('getMembros', () => {
    it('chama GET /api/membros e retorna lista', async () => {
      const lista = [fakeMembro(), fakeMembro()]
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lista),
      })

      const result = await getMembros()

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/membros`)
      expect(result).toEqual(lista)
      expect(result).toHaveLength(2)
    })

    it('com bairro chama GET /api/membros?bairro=...', async () => {
      const lista: Membro[] = []
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lista),
      })

      await getMembros('Sapé')

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/membros?bairro=${encodeURIComponent('Sapé')}`)
    })
  })

  describe('createMembro', () => {
    it('envia POST com body e retorna Membro', async () => {
      const body = {
        Nome: faker.person.fullName(),
        Whatsapp: faker.phone.number(),
        Bairro: faker.location.streetAddress(),
        PerfilServico: PerfilServico.CasaAberta,
        LimiteAcolhimento: 2,
        UserId: null as string | null,
      }
      const created = fakeMembro({ ...body })
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(created),
      })

      const result = await createMembro(body)

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/membros`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      )
      expect(result).toEqual(created)
    })
  })

  describe('atribuirResponsavel', () => {
    it('retorna ContatoTci em sucesso', async () => {
      const contatoId = faker.string.uuid()
      const membroId = faker.string.uuid()
      const updated = fakeContatoTci({ Id: contatoId, ResponsavelId: membroId })
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updated),
      })

      const result = await atribuirResponsavel(contatoId, membroId)

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/contatos-tci/${contatoId}/atribuir-responsavel/${membroId}`,
        { method: 'POST' }
      )
      expect(result.ResponsavelId).toBe(membroId)
    })

    it('lança com mensagem do backend em 400', async () => {
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ mensagemErro: 'Membro já atingiu o limite de acolhimento (2).' }),
      })

      await expect(atribuirResponsavel(faker.string.uuid(), faker.string.uuid())).rejects.toThrow(
        'Membro já atingiu o limite de acolhimento (2).'
      )
    })
  })

  describe('getContatosTci', () => {
    it('chama GET /api/contatos-tci e retorna lista', async () => {
      const lista = [fakeContatoTci(), fakeContatoTci()]
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lista),
      })

      const result = await getContatosTci()

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/contatos-tci`)
      expect(result).toEqual(lista)
    })
  })
})
