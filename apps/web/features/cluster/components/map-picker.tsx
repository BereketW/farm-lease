"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, PenLine, RotateCcw, Check, MapPin } from "lucide-react";
import type {
  Circle,
  CircleMarker,
  LatLng,
  LeafletMouseEvent,
  LeafletStatic,
  Map as LMap,
  Marker,
  Polygon,
  Polyline,
} from "leaflet";
import { cn } from "@farm-lease/ui/lib/utils";

// ============================================================
// Constants
// ============================================================

const DEFAULT_CENTER: [number, number] = [9.145, 40.4897]; // Ethiopia
const DEFAULT_ZOOM = 6;
const LEAFLET_CSS_HREF =
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

type Mode = "centroid" | "boundary";

export type BoundaryPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

// ============================================================
// Component
// ============================================================

export function MapPicker({
  centroid,
  boundary,
  areaHectares,
  onCentroidChange,
  onBoundaryChange,
  className,
}: {
  centroid: { lat: number; lng: number } | null;
  boundary: BoundaryPolygon | null;
  /** If provided, renders an equivalent-radius circle around the centroid. */
  areaHectares?: number | null;
  onCentroidChange: (lat: number, lng: number) => void;
  onBoundaryChange: (polygon: BoundaryPolygon | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const polygonRef = useRef<Polygon | null>(null);
  const radiusRef = useRef<Circle | null>(null);
  const drafts = useRef<{
    vertices: [number, number][];
    dots: CircleMarker[];
    line: Polyline | null;
  }>({ vertices: [], dots: [], line: null });
  const leafletRef = useRef<LeafletStatic | null>(null);

  const [mode, setMode] = useState<Mode>("centroid");
  const [vertexCount, setVertexCount] = useState(0);
  const [ready, setReady] = useState(false);

  // ---- Inject Leaflet CSS once ----
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector(`link[data-leaflet-css]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_HREF;
    link.setAttribute("data-leaflet-css", "true");
    document.head.appendChild(link);
  }, []);

  // ---- Lazy-init map ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const initial = centroid
        ? ([centroid.lat, centroid.lng] as [number, number])
        : DEFAULT_CENTER;

      const map = L.map(containerRef.current, {
        center: initial,
        zoom: centroid ? 13 : DEFAULT_ZOOM,
        scrollWheelZoom: true,
        attributionControl: true,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Restore existing centroid
      if (centroid) {
        placeMarker(L, map, centroid.lat, centroid.lng);
      }
      // Restore existing boundary
      if (boundary?.coordinates?.[0]?.length) {
        const latlngs = boundary.coordinates[0]
          .slice(0, -1) // drop closing vertex for display
          .map(([lng, lat]) => [lat, lng] as [number, number]);
        polygonRef.current = L.polygon(latlngs, {
          color: "#047857",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.15,
        }).addTo(map);
        try {
          map.fitBounds(latlngs, { padding: [20, 20] });
        } catch {
          /* ignore */
        }
      }

      setReady(true);
      // fix rendering glitches if container sized late
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Click handling (mode-aware) ----
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const handler = (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng as LatLng;
      if (mode === "centroid") {
        placeMarker(L, map, lat, lng);
        onCentroidChange(lat, lng);
      } else {
        addVertex(L, map, lat, lng);
      }
    };

    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready]);

  // ---- Sync equivalent-area radius circle ----
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    const radiusMeters =
      centroid && areaHectares && areaHectares > 0
        ? Math.sqrt((areaHectares * 10_000) / Math.PI)
        : 0;

    if (radiusMeters <= 0) {
      if (radiusRef.current) {
        radiusRef.current.remove();
        radiusRef.current = null;
      }
      return;
    }

    if (radiusRef.current) {
      radiusRef.current.setLatLng([centroid!.lat, centroid!.lng]);
      radiusRef.current.setRadius(radiusMeters);
    } else {
      radiusRef.current = L.circle([centroid!.lat, centroid!.lng], {
        radius: radiusMeters,
        color: "#047857",
        weight: 1.5,
        dashArray: "4 4",
        fillColor: "#10b981",
        fillOpacity: 0.08,
      }).addTo(map);
    }
  }, [centroid, areaHectares, ready]);

  // ---- Helpers ----

  function placeMarker(
    L: LeafletStatic,
    map: LMap,
    lat: number,
    lng: number
  ) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }
    const icon = L.divIcon({
      className: "farm-lease-pin",
      iconSize: [22, 28],
      iconAnchor: [11, 28],
      html: `<div style="width:22px;height:28px;position:relative">
        <div style="position:absolute;inset:0;display:grid;place-items:center">
          <svg viewBox="0 0 24 32" width="22" height="28">
            <path d="M12 0C5.5 0 0 5.2 0 11.6 0 20.4 12 32 12 32s12-11.6 12-20.4C24 5.2 18.5 0 12 0z" fill="#047857" stroke="#022c22" stroke-width="1.5"/>
            <circle cx="12" cy="11" r="4" fill="#f0fdf4"/>
          </svg>
        </div>
      </div>`,
    });
    markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
  }

  function addVertex(
    L: LeafletStatic,
    map: LMap,
    lat: number,
    lng: number
  ) {
    drafts.current.vertices.push([lat, lng]);

    const dot = L.circleMarker([lat, lng], {
      radius: 5,
      color: "#047857",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 1,
    }).addTo(map);
    drafts.current.dots.push(dot);

    if (drafts.current.line) {
      drafts.current.line.setLatLngs(drafts.current.vertices);
    } else {
      drafts.current.line = L.polyline(drafts.current.vertices, {
        color: "#047857",
        weight: 2,
        dashArray: "4 4",
      }).addTo(map);
    }

    setVertexCount(drafts.current.vertices.length);
  }

  function clearDraft() {
    drafts.current.dots.forEach((d) => d.remove());
    drafts.current.dots = [];
    if (drafts.current.line) {
      drafts.current.line.remove();
      drafts.current.line = null;
    }
    drafts.current.vertices = [];
    setVertexCount(0);
  }

  function finishBoundary() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (drafts.current.vertices.length < 3) return;

    // Remove previous finalized polygon if any
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    const latlngs = [...drafts.current.vertices];
    polygonRef.current = L.polygon(latlngs, {
      color: "#047857",
      weight: 2,
      fillColor: "#10b981",
      fillOpacity: 0.15,
    }).addTo(map);

    // GeoJSON: [lng, lat] tuples; polygon must be closed
    const ring = latlngs.map(([lat, lng]) => [lng, lat] as [number, number]);
    ring.push(ring[0]);
    onBoundaryChange({ type: "Polygon", coordinates: [ring] });

    clearDraft();
    // Auto-flip to centroid mode after finishing
    setMode("centroid");
  }

  function clearBoundary() {
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    clearDraft();
    onBoundaryChange(null);
  }

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    if (centroid) {
      map.setView([centroid.lat, centroid.lng], 13);
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }

  const hasBoundary = !!boundary;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-emerald-950/15 bg-white/80 px-3 py-2 text-[11px] dark:border-emerald-400/15 dark:bg-stone-900/60">
        <div
          role="tablist"
          aria-label="Map picker mode"
          className="inline-flex items-center overflow-hidden rounded-sm border border-emerald-950/15 dark:border-emerald-400/15"
        >
          <ModeButton
            active={mode === "centroid"}
            onClick={() => setMode("centroid")}
            icon={<Crosshair className="h-3 w-3" />}
            label="Centroid"
          />
          <ModeButton
            active={mode === "boundary"}
            onClick={() => setMode("boundary")}
            icon={<PenLine className="h-3 w-3" />}
            label="Boundary"
          />
        </div>

        <div className="flex items-center gap-1">
          {mode === "boundary" ? (
            <>
              <span
                className="mr-1 font-mono text-[10px] tabular-nums text-stone-500"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {vertexCount} vertex{vertexCount === 1 ? "" : "es"}
              </span>
              <ToolbarButton
                disabled={vertexCount === 0}
                onClick={clearDraft}
                icon={<RotateCcw className="h-3 w-3" />}
                label="Undo all"
              />
              <ToolbarButton
                disabled={vertexCount < 3}
                onClick={finishBoundary}
                icon={<Check className="h-3 w-3" />}
                label="Finish polygon"
                primary
              />
            </>
          ) : (
            <>
              <ToolbarButton
                onClick={recenter}
                icon={<MapPin className="h-3 w-3" />}
                label="Recenter"
              />
              {hasBoundary ? (
                <ToolbarButton
                  onClick={clearBoundary}
                  icon={<RotateCcw className="h-3 w-3" />}
                  label="Clear boundary"
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Map surface */}
      <div className="relative overflow-hidden rounded-sm border border-emerald-950/15 bg-stone-100 dark:border-emerald-400/15 dark:bg-stone-900">
        <div
          ref={containerRef}
          className="h-[340px] w-full"
          aria-label="Interactive map"
        />
        {!ready ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-stone-100/80 dark:bg-stone-900/80">
            <p
              className="font-serif text-xs italic text-stone-500"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Preparing map…
            </p>
          </div>
        ) : null}
        {/* Hint strip */}
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-600 shadow-sm dark:bg-stone-900/90 dark:text-stone-300">
          {mode === "centroid"
            ? "Click the map to set centroid"
            : vertexCount < 3
              ? "Click to add vertices · 3+ needed"
              : "Click to add more or Finish"}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Toolbar bits
// ============================================================

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] transition-colors",
        active
          ? "bg-emerald-900 text-stone-50 dark:bg-emerald-300 dark:text-emerald-950"
          : "text-stone-600 hover:bg-stone-100/70 dark:text-stone-400 dark:hover:bg-stone-800/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "border-emerald-900 bg-emerald-950 text-stone-50 hover:bg-emerald-900 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
          : "border-emerald-950/15 bg-white text-stone-700 hover:border-emerald-700/40 hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
