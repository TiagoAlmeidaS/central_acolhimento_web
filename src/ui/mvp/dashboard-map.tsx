"use client";

import { useEffect, useRef, useState } from "react";
import { buildMapPopupContent, type DashboardMapItem } from "@/ui/mvp/dashboard-map-utils";
import { Card } from "@/ui/v2-components/ui";

interface DashboardMapProps {
  items: DashboardMapItem[];
}

export function DashboardMap({ items }: DashboardMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      try {
        document.head.removeChild(link);
      } catch {}
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const validItems = items.filter((item) => item.latitude !== null && item.longitude !== null);
    const defaultCenter = [-7.1196, -34.845];
    const center = validItems[0] ? [validItems[0].latitude!, validItems[0].longitude!] : defaultCenter;

    const map = L.map(containerRef.current, {
      zoomControl: true,
    }).setView(center, 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    validItems.forEach((item) => {
      const color =
        item.status === "urgente"
          ? "#E11D48"
          : item.status === "novo"
            ? "#EA580C"
          : item.status === "aguardando"
            ? "#EA580C"
            : item.status === "acompanhamento"
              ? "#2563EB"
              : item.status === "inativo"
                ? "#64748B"
                : "#16A34A";

      const statusLabel =
        item.status === "urgente"
          ? "Urgente"
          : item.status === "novo"
            ? "Novo"
          : item.status === "aguardando"
            ? "Aguardando vinculacao"
            : item.status === "acompanhamento"
              ? "Em acompanhamento"
              : item.status === "inativo"
                ? "Inativo"
                : "Concluido";

      const icon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: ${color};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const popupContent = buildMapPopupContent(item, { color, statusLabel });

      L.marker([item.latitude!, item.longitude!], { icon }).addTo(map).bindPopup(popupContent);
    });
  }, [loaded, items]);

  return (
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.015em" }}>
            Mapa de visitacao e acolhimento
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
            Visao geografica das casas abertas e do andamento pastoral no territorio.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 700 }}>
          {[
            { label: "Urgente", color: "#E11D48" },
            { label: "Aguardando", color: "#EA580C" },
            { label: "Acompanhando", color: "#2563EB" },
            { label: "Concluido", color: "#16A34A" },
          ].map((legendItem) => (
            <div key={legendItem.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: legendItem.color }} />
              <span style={{ color: "var(--text-2)" }}>{legendItem.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 380,
          borderRadius: 12,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "var(--surface-2)",
          zIndex: 10,
        }}
      />
    </Card>
  );
}
