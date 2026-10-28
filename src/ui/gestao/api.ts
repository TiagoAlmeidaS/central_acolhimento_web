/** Extrai a mensagem de erro de uma resposta da API, com texto padrão. */
export async function readApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  return payload.error ?? fallback;
}
