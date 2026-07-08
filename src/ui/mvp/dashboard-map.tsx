"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/ui/v2-components/ui";

interface MapItem {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  caregiver: string | null;
  lastContact: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface DashboardMapProps {
  items: MapItem[];
}

export function DashboardMap({ items }: DashboardMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1. Add Leaflet stylesheet
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // 2. Add Leaflet script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      try {
        document.head.removeChild(link);
      } catch (e) {}
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Clean up existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const validItems = items.filter(
      (item) => item.latitude !== null && item.longitude !== null
    );

    // João Pessoa, PB default coordinates
    const defaultCenter = [-7.1196, -34.8450];
    const center = validItems[0]
      ? [validItems[0].latitude!, validItems[0].longitude!]
      : defaultCenter;

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
          : item.status === "aguardando"
          ? "#EA580C"
          : item.status === "acompanhamento"
          ? "#2563EB"
          : "#16A34A";

      const statusLabel =
        item.status === "urgente"
          ? "Urgente"
          : item.status === "aguardando"
          ? "Aguardando Vinculação"
          : item.status === "acompanhamento"
          ? "Em Acompanhamento"
          : "Concluído";

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
            justifyContent: center;
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const popupContent = `
        <div style="
          font-family: var(--font-sans), sans-serif;
          font-size: 13px;
          color: #0F172A;
          line-height: 1.4;
          padding: 2px;
          min-width: 180px;
        ">
          <div style="font-weight: 800; font-size: 14.5px; color: #1E293B; margin-bottom: 4px;">
            ${item.name}
          </div>
          <div style="
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: ${color};
            margin-bottom: 8px;
          ">
            ● ${statusLabel}
          </div>
          <div style="margin-bottom: 2px;">
            <strong style="color: #64748B;">Endereço:</strong> ${item.address || "Sem endereço"}
          </div>
          <div style="margin-bottom: 2px;">
            <strong style="color: #64748B;">Cuidador:</strong> ${item.caregiver || "Não atribuído"}
          </div>
          <div>
            <strong style="color: #64748B;">Último contato:</strong> ${item.lastContact || "Nenhum registrado"}
          </div>
        </div>
      `;

      L.marker([item.latitude!, item.longitude!], { icon })
        .addTo(map)
        .bindPopup(popupContent);
    });

  }, [loaded, items]);

  return (
    <Card padding={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.015em" }}>
            Mapa de Visitação e Acolhimento
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-3)" }}>
            Visão geográfica das casas abertas e do andamento pastoral no território.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 700 }}>
          {[
            { label: "Urgente", color: "#E11D48" },
            { label: "Aguardando", color: "#EA580C" },
            { label: "Acompanhando", color: "#2563EB" },
            { label: "Concluído", color: "#16A34A" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ color: "var(--text-2)" }}>{l.label}</span>
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
