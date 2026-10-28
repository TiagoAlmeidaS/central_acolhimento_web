"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/ui/atalaia";
import { LEAFLET_THEME_CSS } from "@/ui/coord/leaflet-theme";

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

 
function getL(): any {
  return (window as unknown as Record<string, unknown>).L;
}

 
function makePinIcon(L: any) {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:var(--primary);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

export function LocationPicker({ latitude, longitude, onChange, onAddressFill }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
   
  const mapRef = useRef<any>(null);
   
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
    <div className="grid gap-2.5">
      <style>{LEAFLET_THEME_CSS}</style>
      <div className="flex flex-wrap gap-2">
        <Button icon="pin" onClick={handleGPS} loading={gpsLoading}>
          {gpsLoading ? "Obtendo localização..." : "Usar minha localização"}
        </Button>
        <Button
          icon="map"
          variant={pickMode ? "primary" : "neutral"}
          aria-pressed={pickMode}
          onClick={() => setPickMode((v) => !v)}
        >
          {pickMode ? "Cancelar seleção" : "Escolher no mapa"}
        </Button>
      </div>

      {gpsError && (
        <div role="alert" className="text-[13px] text-danger">
          {gpsError}
        </div>
      )}
      {pickMode && (
        <div role="status" className="text-[13px] font-medium text-primary">
          Clique em qualquer ponto do mapa para definir a localização.
        </div>
      )}

      <div
        ref={containerRef}
        role="region"
        aria-label="Mapa para escolher a localização"
        className="atalaia-map z-0 h-[210px] overflow-hidden rounded-card border border-border bg-sunken"
      />

      {hasCoords ? (
        <div className="flex items-center gap-1.5 rounded-control bg-success-soft px-3 py-2 text-[13px] text-success">
          <Icon name="pin" size={14} />
          <span className="font-mono">
            {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
          </span>
          <span className="text-muted">· arraste o pin para ajustar</span>
        </div>
      ) : (
        <div className="text-xs text-muted">
          Use o GPS, escolha no mapa ou preencha o endereço para obter as coordenadas.
        </div>
      )}
    </div>
  );
}
