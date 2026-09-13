import { describe, expect, it } from "vitest";
import {
  isSeedOriginChannel,
  parseSeedOriginChannelForCreate,
  parseSeedOriginChannelForUpdate,
  seedOriginChannelLabel,
  seedOriginText,
  SEED_ORIGIN_CHANNEL_ABSENT,
  SEED_ORIGIN_CHANNELS,
  SEED_ORIGIN_CHANNEL_INVALID_MESSAGE,
  SEED_ORIGIN_CHANNEL_LABELS,
} from "@/lib/seed-origin";

describe("seed origin channel", () => {
  it("keeps the closed taxonomy with the eight channels", () => {
    expect([...SEED_ORIGIN_CHANNELS]).toEqual([
      "outing",
      "referral",
      "church_service",
      "public_link",
      "whatsapp",
      "manual",
      "import",
      "other",
    ]);
    expect(Object.keys(SEED_ORIGIN_CHANNEL_LABELS).sort()).toEqual([...SEED_ORIGIN_CHANNELS].sort());
  });

  it("accepts every channel of the taxonomy", () => {
    for (const channel of SEED_ORIGIN_CHANNELS) {
      expect(isSeedOriginChannel(channel)).toBe(true);
      expect(parseSeedOriginChannelForCreate(channel)).toBe(channel);
      expect(parseSeedOriginChannelForUpdate(channel)).toBe(channel);
    }
  });

  it("falls back to other when the channel is absent on create", () => {
    expect(parseSeedOriginChannelForCreate(undefined)).toBe("other");
    expect(parseSeedOriginChannelForCreate(null)).toBe("other");
    expect(parseSeedOriginChannelForCreate("")).toBe("other");
  });

  it("keeps the current channel when the field is absent on update", () => {
    expect(parseSeedOriginChannelForUpdate(undefined)).toBe(SEED_ORIGIN_CHANNEL_ABSENT);
    expect(parseSeedOriginChannelForUpdate(null)).toBe(SEED_ORIGIN_CHANNEL_ABSENT);
    expect(parseSeedOriginChannelForUpdate("")).toBe(SEED_ORIGIN_CHANNEL_ABSENT);
    // O sentinela nunca pode ser confundido com um canal da taxonomia.
    expect(SEED_ORIGIN_CHANNELS).not.toContain(SEED_ORIGIN_CHANNEL_ABSENT);
  });

  it("rejects values outside the taxonomy on create and on update", () => {
    for (const parse of [parseSeedOriginChannelForCreate, parseSeedOriginChannelForUpdate]) {
      expect(parse("Outing")).toBeNull();
      expect(parse("culto")).toBeNull();
      expect(parse(42)).toBeNull();
      expect(parse({ channel: "outing" })).toBeNull();
      expect(parse(SEED_ORIGIN_CHANNEL_ABSENT)).toBeNull();
    }
    expect(isSeedOriginChannel("indicacao")).toBe(false);
  });

  it("exposes a message in portuguese listing the accepted channels", () => {
    expect(SEED_ORIGIN_CHANNEL_INVALID_MESSAGE).toContain("Origem invalida");
    for (const channel of SEED_ORIGIN_CHANNELS) {
      expect(SEED_ORIGIN_CHANNEL_INVALID_MESSAGE).toContain(channel);
    }
  });

  it("builds the origin text from the taxonomy, with the detail when there is one", () => {
    expect(seedOriginText({ originChannel: "referral", originDetail: "Dona Maria", source: "Saida Centro" }))
      .toBe("Indicação — Dona Maria");
    expect(seedOriginText({ originChannel: "church_service", originDetail: "", source: "" }))
      .toBe("Culto / Reunião");
    expect(seedOriginText({ originChannel: "other", originDetail: "Vizinha do salao", source: "" }))
      .toBe("Outro — Vizinha do salao");
  });

  it("falls back to the legacy source only when there is no registered channel", () => {
    expect(seedOriginText({ originChannel: "other", originDetail: "", source: "Saida Centro" }))
      .toBe("Saida Centro");
    expect(seedOriginText({ originDetail: "", source: "Saida Centro" })).toBe("Saida Centro");
    expect(seedOriginText({ originChannel: "other", originDetail: "   ", source: "  " })).toBe("Outro");
    expect(seedOriginText({})).toBe("Outro");
  });

  it("labels channels in portuguese and falls back to Outro", () => {
    expect(seedOriginChannelLabel("outing")).toBe("Saída / Evangelismo");
    expect(seedOriginChannelLabel("referral")).toBe("Indicação");
    expect(seedOriginChannelLabel("valor-invalido")).toBe("Outro");
  });
});
