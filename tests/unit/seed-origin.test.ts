import { describe, expect, it } from "vitest";
import {
  isSeedOriginChannel,
  parseSeedOriginChannel,
  seedOriginChannelLabel,
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
      expect(parseSeedOriginChannel(channel)).toBe(channel);
    }
  });

  it("falls back to other when the channel is absent", () => {
    expect(parseSeedOriginChannel(undefined)).toBe("other");
    expect(parseSeedOriginChannel(null)).toBe("other");
    expect(parseSeedOriginChannel("")).toBe("other");
  });

  it("rejects values outside the taxonomy", () => {
    expect(parseSeedOriginChannel("Outing")).toBeNull();
    expect(parseSeedOriginChannel("culto")).toBeNull();
    expect(parseSeedOriginChannel(42)).toBeNull();
    expect(parseSeedOriginChannel({ channel: "outing" })).toBeNull();
    expect(isSeedOriginChannel("indicacao")).toBe(false);
  });

  it("exposes a message in portuguese listing the accepted channels", () => {
    expect(SEED_ORIGIN_CHANNEL_INVALID_MESSAGE).toContain("Origem invalida");
    for (const channel of SEED_ORIGIN_CHANNELS) {
      expect(SEED_ORIGIN_CHANNEL_INVALID_MESSAGE).toContain(channel);
    }
  });

  it("labels channels in portuguese and falls back to Outro", () => {
    expect(seedOriginChannelLabel("outing")).toBe("Saída / Evangelismo");
    expect(seedOriginChannelLabel("referral")).toBe("Indicação");
    expect(seedOriginChannelLabel("valor-invalido")).toBe("Outro");
  });
});
