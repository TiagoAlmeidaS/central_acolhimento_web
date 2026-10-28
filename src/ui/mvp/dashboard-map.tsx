"use client";

import { useEffect, useRef, useState } from "react";
import { buildMapPopupContent, type DashboardMapItem } from "@/ui/mvp/dashboard-map-utils";
import { Card, CardBody, CardHeader, cx } from "@/ui/atalaia";
import { LEAFLET_THEME_CSS } from "@/ui/coord/leaflet-theme";

interface DashboardMapProps {
  items: DashboardMapItem[];
  title?: string;
  description?: string;
  showLegend?: boolean;
  /** Altura do mapa em px (padrao 380). */
  height?: number;
  /** Sem moldura de card: para usar dentro de outra superficie. */
  bare?: boolean;
  /** Quando informado, clicar num ponto chama esta funcao em vez de abrir o balao. */
  onSelectItem?: (id: string) => void;
}

type MapTone = { color: string; label: string };

const DEFAULT_CENTER: [number, number] = [-7.1196, -34.845];

/** Cores via tokens do tema: o mapa acompanha o modo claro e escuro. */
const TONES: Record<string, MapTone> = {
  urgente: { color: "var(--danger)", label: "Urgente" },
  novo: { color: "var(--primary)", label: "Novo" },
  aguardando: { color: "var(--warning)", label: "Aguardando vinculação" },
  acompanhamento: { color: "var(--cold)", label: "Em acompanhamento" },
  inativo: { color: "var(--subtle)", label: "Inativo" },
  concluido: { color: "var(--success)", label: "Concluído" },
};

function toneFor(status: string): MapTone {
  return TONES[status] ?? TONES.concluido;
}

const LEGEND = [
  { label: "Urgente", color: TONES.urgente.color },
  { label: "Novo", color: TONES.novo.color },
  { label: "Aguardando", color: TONES.aguardando.color },
  { label: "Acompanhando", color: TONES.acompanhamento.color },
  { label: "Concluído", color: TONES.concluido.color },
];

export function DashboardMap({
  items,
  title = "Mapa de visitação e acolhimento",
  description = "Visão geográfica das casas abertas e do andamento pastoral no território.",
  showLegend = true,
  height = 380,
  bare = false,
  onSelectItem,
}: DashboardMapProps) {
   
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectItem);
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && Boolean((window as unknown as Record<string, unknown>).L),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelectItem;
  }, [onSelectItem]);

  useEffect(() => {
    if ((window as unknown as Record<string, unknown>).L) return;

    if (!document.querySelector("link[href*='leaflet']")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const onLoad = () => setLoaded(true);
    const onError = () => {
      console.warn("dashboard_map_unavailable", { title });
      setFailed(true);
    };

    let script = document.querySelector<HTMLScriptElement>("script[src*='leaflet']");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.body.appendChild(script);
    }
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    return () => {
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, [title]);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

     
    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const validItems = items.filter((item) => item.latitude !== null && item.longitude !== null);
    const center: [number, number] = validItems[0]
      ? [validItems[0].latitude!, validItems[0].longitude!]
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    validItems.forEach((item) => {
      const tone = toneFor(item.status);

      const icon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background-color:${tone.color};width:16px;height:16px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([item.latitude!, item.longitude!], { icon, title: item.name }).addTo(map);
      if (onSelectRef.current) {
        marker.on("click", () => onSelectRef.current?.(item.id));
      } else {
        marker.bindPopup(buildMapPopupContent(item, { color: tone.color, statusLabel: tone.label }));
      }
    });

    if (validItems.length > 1) {
      map.fitBounds(
        validItems.map((item) => [item.latitude!, item.longitude!]),
        { padding: [32, 32], maxZoom: 15 },
      );
    }

    return () => {
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [loaded, items]);

  const mapBox = failed ? (
    <div
      role="status"
      className="grid place-items-center rounded-card border border-border p-6 text-center text-muted"
      style={{ minHeight: 160 }}
    >
      Mapa indisponível. Os endereços continuam disponíveis na lista do relatório.
    </div>
  ) : (
    <div
      ref={containerRef}
      role="region"
      aria-label={title}
      className="atalaia-map z-0 w-full overflow-hidden rounded-card border border-border bg-sunken"
      style={{ height }}
    />
  );

  const legend = showLegend ? (
    <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted">
      {LEGEND.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: entry.color }} />
          {entry.label}
        </li>
      ))}
    </ul>
  ) : null;

  const body = (
    <>
      <style>{LEAFLET_THEME_CSS}</style>
      {mapBox}
    </>
  );

  if (bare) {
    return (
      <div className="grid gap-2.5">
        {body}
        {legend}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={title}
        level={2}
        action={legend ? <div className="hidden min-[900px]:block">{legend}</div> : undefined}
      />
      <CardBody className={cx("grid gap-3")}>
        <p className="-mt-1 text-[13px] text-muted">{description}</p>
        {body}
        {legend ? <div className="min-[900px]:hidden">{legend}</div> : null}
      </CardBody>
    </Card>
  );
}
