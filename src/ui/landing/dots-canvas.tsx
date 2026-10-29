"use client";

import { useEffect, useRef } from "react";
import type { MapKind, MapPoint } from "./data";
import { DOT_COLORS } from "./dot-colors";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const STEP = 7;
const CROSS = [
  [0, 0],
  [STEP, 0],
  [-STEP, 0],
  [0, STEP],
  [0, -STEP],
] as const;

type Placed = { x: number; y: number; kind: MapKind; urgent: boolean; open: boolean };

/**
 * Campo pontilhado: grade fraca e cada casa como uma cruz de pontos acesos; urgentes pulsam.
 * O pulso só roda enquanto o mapa está visível e não existe com movimento reduzido.
 */
export function DotsCanvas({ points, label }: Readonly<{ points: readonly MapPoint[]; label: string }>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext("2d");
    if (!cv || !g || !points.length) return;

    let raf = 0;
    let visible = true;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let place: Placed[] = [];

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      const a0 = Math.min(...lats);
      const a1 = Math.max(...lats);
      const o0 = Math.min(...lngs);
      const o1 = Math.max(...lngs);
      const padX = W * 0.1;
      const padY = H * 0.12;
      const snap = (v: number) => Math.round(v / STEP) * STEP;
      place = points.map(([lat, lng, kind, urgent, open]) => ({
        kind,
        urgent: urgent === 1,
        open: open === 1,
        x: snap(padX + ((lng - o0) / (o1 - o0 || 1)) * (W * 0.62 - padX)),
        y: snap(padY + ((a1 - lat) / (a1 - a0 || 1)) * (H - padY * 2)),
      }));
    };

    const frame = (t: number | null) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = "rgba(255,240,222,0.07)";
      for (let x = STEP; x < W; x += STEP) for (let y = STEP; y < H; y += STEP) g.fillRect(x - 0.5, y - 0.5, 1.2, 1.2);
      // derivado da referência: pulso de 2000ms, opacidade 1 → 0,5 → 1
      const pulse = t == null ? 1 : 0.75 + 0.25 * Math.cos((t / 2000) * Math.PI * 2);
      for (const p of place) {
        g.globalAlpha = p.urgent ? pulse : 0.95;
        g.fillStyle = p.urgent ? DOT_COLORS.urgent : DOT_COLORS[p.kind];
        for (const [dx, dy] of CROSS) g.fillRect(p.x + dx - 1.6, p.y + dy - 1.6, 3.2, 3.2);
        g.globalAlpha = 1;
        if (p.open) {
          g.strokeStyle = "#f2b24c";
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(p.x, p.y, STEP * 1.9, 0, Math.PI * 2);
          g.stroke();
        }
      }
    };

    const loop = (t: number) => {
      frame(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) frame(null);
      else if (visible) raf = requestAnimationFrame(loop);
    };

    layout();
    start();
    const resize = new ResizeObserver(() => {
      layout();
      start();
    });
    resize.observe(cv);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      start();
    });
    io.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
    };
  }, [points, reduced]);

  return <canvas ref={ref} role="img" aria-label={label} />;
}
