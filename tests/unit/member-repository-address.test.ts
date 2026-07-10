import { beforeEach, describe, expect, it } from "vitest";
import {
  createMember,
  updateMember,
  listMembers,
  resetLocalMvpStore,
} from "@/server/repositories/mvp-repository";

// Força modo in-memory (sem banco real)
beforeEach(() => {
  delete process.env.POSTGRES_URL_NON_POOLING;
  delete process.env.POSTGRES_URL;
  delete process.env.DATABASE_URL;
  resetLocalMvpStore();
});

describe("createMember — campos de endereço estruturado", () => {
  it("persiste todos os campos de endereço no store in-memory", async () => {
    const member = await createMember({
      tenantId: "1",
      name: "Ana Lima",
      phone: "83988880001",
      address: "Rua das Flores, 10 · Centro · João Pessoa · PB · CEP 58000-123",
      postalCode: "58000123",
      street: "Rua das Flores",
      neighborhood: "Centro",
      addressNumber: "10",
      state: "PB",
      city: "João Pessoa",
      latitude: -7.1195,
      longitude: -34.845,
    });

    expect(member.postalCode).toBe("58000123");
    expect(member.street).toBe("Rua das Flores");
    expect(member.neighborhood).toBe("Centro");
    expect(member.addressNumber).toBe("10");
    expect(member.state).toBe("PB");
    expect(member.city).toBe("João Pessoa");
    expect(member.latitude).toBeCloseTo(-7.1195);
    expect(member.longitude).toBeCloseTo(-34.845);
    expect(member.address).toBe("Rua das Flores, 10 · Centro · João Pessoa · PB · CEP 58000-123");
  });

  it("usa defaults vazios quando campos de endereço não são fornecidos", async () => {
    const member = await createMember({
      tenantId: "1",
      name: "Carlos Sem Endereço",
    });

    expect(member.postalCode).toBe("");
    expect(member.street).toBe("");
    expect(member.neighborhood).toBe("");
    expect(member.addressNumber).toBe("");
    expect(member.state).toBe("");
    expect(member.latitude).toBeNull();
    expect(member.longitude).toBeNull();
  });

  it("membro criado aparece no listMembers com os campos de endereço", async () => {
    await createMember({
      tenantId: "1",
      name: "Beatriz Costa",
      postalCode: "58100000",
      street: "Rua Nova",
      neighborhood: "Jardim",
      addressNumber: "55",
      state: "PB",
      city: "Sapé",
    });

    const members = await listMembers({ tenantId: "1" });
    const beatriz = members.find((m) => m.name === "Beatriz Costa");

    expect(beatriz).toBeDefined();
    expect(beatriz?.postalCode).toBe("58100000");
    expect(beatriz?.street).toBe("Rua Nova");
    expect(beatriz?.neighborhood).toBe("Jardim");
    expect(beatriz?.addressNumber).toBe("55");
    expect(beatriz?.state).toBe("PB");
  });
});

describe("updateMember — campos de endereço estruturado", () => {
  it("atualiza todos os campos de endereço no store in-memory", async () => {
    // Cria sem endereço
    const created = await createMember({
      tenantId: "1",
      name: "Daniel Ferreira",
    });

    expect(created.postalCode).toBe("");

    // Atualiza adicionando endereço completo
    const updated = await updateMember(created.id, {
      tenantId: "1",
      name: "Daniel Ferreira",
      postalCode: "58200000",
      street: "Av. Epitácio Pessoa",
      neighborhood: "Tambaú",
      addressNumber: "1000",
      state: "PB",
      city: "João Pessoa",
      latitude: -7.12,
      longitude: -34.85,
    });

    expect(updated.postalCode).toBe("58200000");
    expect(updated.street).toBe("Av. Epitácio Pessoa");
    expect(updated.neighborhood).toBe("Tambaú");
    expect(updated.addressNumber).toBe("1000");
    expect(updated.state).toBe("PB");
    expect(updated.latitude).toBeCloseTo(-7.12);
    expect(updated.longitude).toBeCloseTo(-34.85);
  });

  it("pode limpar campos de endereço ao passar strings vazias", async () => {
    const created = await createMember({
      tenantId: "1",
      name: "Elena Martins",
      postalCode: "58000123",
      street: "Rua das Flores",
      neighborhood: "Centro",
      addressNumber: "10",
      state: "PB",
      city: "João Pessoa",
    });

    const updated = await updateMember(created.id, {
      tenantId: "1",
      name: "Elena Martins",
      postalCode: "",
      street: "",
      neighborhood: "",
      addressNumber: "",
      state: "",
      city: "João Pessoa",
    });

    expect(updated.postalCode).toBe("");
    expect(updated.street).toBe("");
    expect(updated.neighborhood).toBe("");
    expect(updated.addressNumber).toBe("");
    expect(updated.state).toBe("");
  });
});
