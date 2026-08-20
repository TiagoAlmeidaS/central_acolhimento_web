"use client";

import { useEffect, useRef, useState } from "react";

export type LocationAddressFill = {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  onAddressFill?: (data: LocationAddressFill) => void;
};

const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];
const DEFAULT_ZOOM = 16;
const OVERVIEW_ZOOM = 4;

async function reverseGeocode(lat: number, lng: number): Promise<LocationAddressFill> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "pt-BR" } },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    return {
      street: a.road ?? a.pedestrian ?? a.footway ?? "",
      neighborhood: a.suburb ?? a.neighbourhood ?? a.quarter ?? "",
      city: a.city ?? a.town ?? a.village ?? a.municipality ?? "",
      state: a.state_code ?? "",
      postalCode: (a.postcode ?? "").replace(/\D/g, "").slice(0, 8),
    };
  } catch {
    return {};
  }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    const win = window as unknown as Record<string, unknown>;
    if (win.L) { resolve(); return; }

    if (!document.querySelector("link[href*='leaflet']")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.querySelector("script[src*='leaflet']") as HTMLScriptElement | null;
    if (existing) {
      if (win.L) { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getL(): any {
  return (window as unknown as Record<string, unknown>).L;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePinIcon(L: any) {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:#185FA5;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

export function LocationPicker({ latitude, longitude, onChange, onAddressFill }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState(false);

  const onChangeRef = useRef(onChange);
  const onAddressFillRef = useRef(onAddressFill);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onAddressFillRef.current = onAddressFill; }, [onAddressFill]);

  useEffect(() => {
    loadLeaflet().then(() => setReady(true));
  }, []);

  // Initialize map once Leaflet is ready
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L = getL();
    const center: [number, number] = latitude !== null && longitude !== null ? [latitude, longitude] : BRAZIL_CENTER;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, latitude !== null ? DEFAULT_ZOOM : OVERVIEW_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);
    if (latitude !== null && longitude !== null) {
      const marker = L.marker([latitude, longitude], { icon: makePinIcon(L), draggable: true }).addTo(map);
      marker.on("dragend", (e: { target: { getLatLng(): { lat: number; lng: number } } }) => {
        const pos = e.target.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
        if (onAddressFillRef.current) void reverseGeocode(pos.lat, pos.lng).then(onAddressFillRef.current);
      });
      markerRef.current = marker;
    }
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // only re-run when Leaflet becomes ready; lat/lng sync handled below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Handle map clicks (pick mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handle = (e: { latlng: { lat: number; lng: number } }) => {
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
      if (onAddressFillRef.current) void reverseGeocode(e.latlng.lat, e.latlng.lng).then(onAddressFillRef.current);
      setPickMode(false);
    };
    map.on("click", handle);
    if (map.getContainer) (map.getContainer() as HTMLElement).style.cursor = pickMode ? "crosshair" : "";
    return () => { map.off("click", handle); };
  }, [pickMode, ready]);

  // Sync external coordinate changes (from geocoding) to the marker
  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const L = getL();
    const map = mapRef.current;
    if (latitude === null || longitude === null) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      return;
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], { icon: makePinIcon(L), draggable: true }).addTo(map);
      marker.on("dragend", (e: { target: { getLatLng(): { lat: number; lng: number } } }) => {
        const pos = e.target.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
        if (onAddressFillRef.current) void reverseGeocode(pos.lat, pos.lng).then(onAddressFillRef.current);
      });
      markerRef.current = marker;
    }
    map.setView([latitude, longitude], DEFAULT_ZOOM);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, ready]);

  function handleGPS() {
    if (!navigator.geolocation) { setGpsError("Geolocalização não é suportada neste dispositivo."); return; }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onChangeRef.current(lat, lng);
        if (onAddressFillRef.current) {
          const addr = await reverseGeocode(lat, lng);
          onAddressFillRef.current(addr);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`Não foi possível obter GPS: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  const hasCoords = latitude !== null && longitude !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px",
            border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)",
            color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: gpsLoading ? "wait" : "pointer",
            opacity: gpsLoading ? 0.7 : 1, fontFamily: "inherit",
          }}
        >
          {gpsLoading ? "Obtendo localização..." : "📡 Usar minha localização"}
        </button>
        <button
          type="button"
          onClick={() => setPickMode((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px",
            border: pickMode ? "1px solid var(--accent)" : "1px solid var(--border)",
            borderRadius: 10, background: pickMode ? "var(--accent)" : "var(--surface)",
            color: pickMode ? "#fff" : "var(--text-2)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {pickMode ? "Cancelar seleção" : "🗺️ Escolher no mapa"}
        </button>
      </div>

      {gpsError && <div style={{ fontSize: 12.5, color: "#B91C1C" }}>{gpsError}</div>}
      {pickMode && (
        <div style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 600 }}>
          Clique em qualquer ponto do mapa para definir a localização
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          height: 210, borderRadius: 10, border: "1px solid var(--border)",
          overflow: "hidden", background: "#e8f4f0",
        }}
      />

      {hasCoords ? (
        <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 12.5, color: "#15803D" }}>
          📍 {latitude!.toFixed(6)}, {longitude!.toFixed(6)} · Arraste o pin para ajustar
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          Use o GPS, escolha no mapa ou preencha o endereço para obter as coordenadas.
        </div>
      )}
    </div>
  );
}
