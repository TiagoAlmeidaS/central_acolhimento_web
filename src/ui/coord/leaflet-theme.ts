/** Ajusta tiles e baloes do Leaflet ao tema Atalaia (tiles escurecidos no modo escuro). */
export const LEAFLET_THEME_CSS = `
:root:not([data-theme="light"]) .atalaia-map .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.82) contrast(0.92) saturate(0.55); }
.atalaia-map { font-family: var(--font-sans), sans-serif; }
.atalaia-map .leaflet-popup-content-wrapper, .atalaia-map .leaflet-popup-tip { background: var(--raised); color: var(--fg); border: 1px solid var(--border); box-shadow: none; }
.atalaia-map .leaflet-popup-content-wrapper { border-radius: 5px; }
.atalaia-map .leaflet-popup-content { margin: 10px 12px; }
.atalaia-map .leaflet-popup-close-button { color: var(--muted) !important; }
.atalaia-map .leaflet-bar a { background: var(--surface); color: var(--fg); border-bottom-color: var(--border); }
.atalaia-map .leaflet-bar a:hover { background: var(--sunken); }
.atalaia-map .leaflet-control-attribution { background: color-mix(in srgb, var(--surface) 80%, transparent); color: var(--muted); }
.atalaia-map .leaflet-control-attribution a { color: var(--muted); }
`;
