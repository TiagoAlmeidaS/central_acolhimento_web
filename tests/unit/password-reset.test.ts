import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
  updateAppUserPassword,
  resetLocalAuthStore,
  resetLocalPasswordResetTokens,
  authenticateAppUser,
} from "@/server/repositories/auth-repository";

// Garante modo in-memory
beforeEach(() => {
  delete process.env.POSTGRES_URL_NON_POOLING;
  delete process.env.POSTGRES_URL;
  delete process.env.DATABASE_URL;
  resetLocalAuthStore();
  resetLocalPasswordResetTokens();
});

// ID do usuário "tiago@igreja.org" — seeded no localAuthStore
const TIAGO_ID = "local-app-user-tiago";

// ---------------------------------------------------------------------------
// createPasswordResetToken
// ---------------------------------------------------------------------------
describe("createPasswordResetToken", () => {
  it("retorna um token bruto de 64 caracteres hex", async () => {
    const token = await createPasswordResetToken(TIAGO_ID);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("tokens diferentes a cada chamada", async () => {
    const t1 = await createPasswordResetToken(TIAGO_ID);
    const t2 = await createPasswordResetToken(TIAGO_ID);
    expect(t1).not.toBe(t2);
  });

  it("invalida token anterior ao gerar novo token para o mesmo usuário", async () => {
    const tokenA = await createPasswordResetToken(TIAGO_ID);
    // Gera novo token — deve invalidar o anterior
    await createPasswordResetToken(TIAGO_ID);

    await expect(consumePasswordResetToken(tokenA)).rejects.toThrow(
      /inválido ou expirado/i
    );
  });
});

// ---------------------------------------------------------------------------
// consumePasswordResetToken
// ---------------------------------------------------------------------------
describe("consumePasswordResetToken", () => {
  it("retorna o appUserId para token válido", async () => {
    const token = await createPasswordResetToken(TIAGO_ID);
    const appUserId = await consumePasswordResetToken(token);
    expect(appUserId).toBe(TIAGO_ID);
  });

  it("é single-use — não pode ser consumido duas vezes", async () => {
    const token = await createPasswordResetToken(TIAGO_ID);
    await consumePasswordResetToken(token);
    await expect(consumePasswordResetToken(token)).rejects.toThrow(/inválido ou expirado/i);
  });

  it("rejeita token completamente aleatório (inexistente)", async () => {
    await expect(consumePasswordResetToken("a".repeat(64))).rejects.toThrow(
      /inválido ou expirado/i
    );
  });

  it("rejeita token expirado (avança relógio em 31 minutos)", async () => {
    vi.useFakeTimers();
    const token = await createPasswordResetToken(TIAGO_ID);

    // Avança o relógio em 31 minutos
    vi.advanceTimersByTime(31 * 60 * 1000);

    await expect(consumePasswordResetToken(token)).rejects.toThrow(/inválido ou expirado/i);

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// updateAppUserPassword
// ---------------------------------------------------------------------------
describe("updateAppUserPassword", () => {
  it("permite login com nova senha após atualização", async () => {
    await updateAppUserPassword(TIAGO_ID, "novaSenha123");

    // Deve logar com nova senha
    const user = await authenticateAppUser({ email: "tiago@igreja.org", password: "novaSenha123" });
    expect(user).not.toBeNull();
    expect(user?.id).toBe(TIAGO_ID);
  });

  it("bloqueia login com senha antiga após atualização", async () => {
    await updateAppUserPassword(TIAGO_ID, "novaSenha123");

    const user = await authenticateAppUser({ email: "tiago@igreja.org", password: "12345678" });
    expect(user).toBeNull();
  });

  it("lança erro para usuário inexistente", async () => {
    await expect(updateAppUserPassword("id-inexistente", "novaSenha123")).rejects.toThrow();
  });
});
