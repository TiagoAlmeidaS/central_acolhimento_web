import React from "react";
import { Card } from "@/ui/v2-components/ui";

export interface KpiCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  bg: string;
  /** Marca o cartao como retrato do momento (fila em aberto), nao do periodo filtrado. */
  snapshot?: boolean;
}

export function KpiCard({ icon, label, value, sub, accent, bg, snapshot }: KpiCardProps) {
  return (
    <Card padding={16} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", letterSpacing: "-0.01em" }}>
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: bg,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</span> : null}
      {snapshot ? (
        <span style={{ fontSize: 11, color: "var(--text-3)", opacity: 0.85 }}>Retrato de agora · nao segue o periodo</span>
      ) : null}
    </Card>
  );
}
