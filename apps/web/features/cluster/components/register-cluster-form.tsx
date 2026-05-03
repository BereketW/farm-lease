"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  Sprout,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { BoundaryPolygon } from "@/features/cluster/components/map-picker";

// Client-only map picker (Leaflet accesses `window`).
const MapPicker = dynamic(
  () =>
    import("@/features/cluster/components/map-picker").then(
      (mod) => mod.MapPicker
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[340px] w-full place-items-center rounded-sm border border-emerald-950/15 bg-stone-100 dark:border-emerald-400/15 dark:bg-stone-900">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
      </div>
    ),
  }
);
import { cn } from "@farm-lease/ui/lib/utils";
import {
  EditorialButton,
  EditorialField,
  EditorialInput,
  EditorialTextarea,
  HorizonRule,
  NameAvatar,
  Ornament,
  SectionHeader,
} from "@/components/editorial";
import {
  listAvailableFarmers,
  registerCluster,
  type AvailableFarmer,
} from "@/features/cluster/datasource/clusters";

// ============================================================
// Constants
// ============================================================

const REGIONS = [
  "Oromia",
  "Amhara",
  "SNNPR",
  "Tigray",
  "Sidama",
  "Afar",
  "Somali",
  "Benishangul-Gumuz",
  "Gambela",
  "Harari",
  "Dire Dawa",
  "Addis Ababa",
] as const;

const CROP_PRESETS = [
  "Teff",
  "Maize",
  "Wheat",
  "Barley",
  "Sorghum",
  "Coffee",
  "Sesame",
  "Pulses",
  "Vegetables",
  "Fruits",
  "Cotton",
  "Sugar Cane",
] as const;

const MAX_DOCS = 5;
const MAX_DOC_SIZE = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_DOCS = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";

// ============================================================
// Types
// ============================================================

type FarmerEntry = { userId: string; landShare: string };

type StepKey = "identity" | "geo" | "farmers" | "documents" | "review";

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: "identity", label: "Identity", icon: <Sprout className="h-3 w-3" /> },
  { key: "geo", label: "Geography", icon: <MapPin className="h-3 w-3" /> },
  { key: "farmers", label: "Membership", icon: <Users className="h-3 w-3" /> },
  { key: "documents", label: "Documents", icon: <FileText className="h-3 w-3" /> },
  { key: "review", label: "Review", icon: <Check className="h-3 w-3" /> },
];

// ============================================================
// Utilities
// ============================================================

/**
 * Approximate a circular boundary (centered on `lat`/`lng`) that encloses
 * `areaHa` hectares as a 32-sided GeoJSON Polygon. Used as a fallback when
 * the representative does not explicitly draw a polygon.
 */
function circlePolygon(lat: number, lng: number, areaHa: number): BoundaryPolygon {
  const N = 32;
  const EARTH_R = 6_371_000; // meters
  const radiusM = Math.sqrt((areaHa * 10_000) / Math.PI);
  const dLatPerM = (1 / EARTH_R) * (180 / Math.PI);
  const dLngPerM = dLatPerM / Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * 2 * Math.PI;
    const dLat = radiusM * Math.cos(angle) * dLatPerM;
    const dLng = radiusM * Math.sin(angle) * dLngPerM;
    ring.push([lng + dLng, lat + dLat]);
  }
  ring.push(ring[0]);
  return { type: "Polygon", coordinates: [ring] };
}

// ============================================================
// Form
// ============================================================

export function RegisterClusterForm() {
  const router = useRouter();

  // ---- State ----
  const [step, setStep] = useState<StepKey>("identity");
  const [touched, setTouched] = useState<Record<StepKey, boolean>>({
    identity: false,
    geo: false,
    farmers: false,
    documents: false,
    review: false,
  });

  // identity
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number] | "">("");
  const [location, setLocation] = useState("");

  // geography (kept simple: numeric coords + optional GeoJSON paste)
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [boundariesJson, setBoundariesJson] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [cropDraft, setCropDraft] = useState("");

  // farmers
  const [search, setSearch] = useState("");
  const [farmers, setFarmers] = useState<FarmerEntry[]>([]);

  // documents
  const [docs, setDocs] = useState<File[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ---- Derived ----
  const coordinates = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude || !longitude || Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return { type: "Point" as const, coordinates: [lng, lat] };
  }, [latitude, longitude]);

  /**
   * Explicit polygon the user drew / pasted — for UI display only.
   * Returns "INVALID" when user provided text but it's not valid JSON.
   */
  const drawnPolygon = useMemo(() => {
    if (!boundariesJson.trim()) return null;
    try {
      const parsed = JSON.parse(boundariesJson);
      if (parsed?.type === "Polygon" && Array.isArray(parsed.coordinates)) {
        return parsed as BoundaryPolygon;
      }
      return "INVALID" as const;
    } catch {
      return "INVALID" as const;
    }
  }, [boundariesJson]);

  /**
   * Geodata payload sent to the server. Falls back to a 32-sided
   * circle-polygon derived from the centroid + total area when the
   * representative does not draw a boundary explicitly.
   */
  const submissionGeodata = useMemo(() => {
    if (drawnPolygon === "INVALID") return "INVALID" as const;
    if (drawnPolygon) return drawnPolygon;
    if (coordinates && Number(totalArea) > 0) {
      const [lng, lat] = coordinates.coordinates as [number, number];
      return circlePolygon(lat, lng, Number(totalArea));
    }
    return null;
  }, [drawnPolygon, coordinates, totalArea]);

  const totalShare = useMemo(
    () =>
      farmers.reduce(
        (sum, f) => sum + (Number.isFinite(Number(f.landShare)) ? Number(f.landShare) : 0),
        0
      ),
    [farmers]
  );

  // ---- Validation ----
  const errors = useMemo(() => {
    const e: Partial<Record<StepKey, string>> = {};
    if (name.trim().length < 3) e.identity = "Cluster needs a name (≥ 3 chars)";
    else if (location.trim().length < 3) e.identity = "Add a human-readable location";
    else if (!region) e.identity = "Select a region";

    if (!coordinates) e.geo = "Provide centroid coordinates";
    else if (drawnPolygon === "INVALID") e.geo = "Boundary GeoJSON is malformed";
    else if (!totalArea || Number(totalArea) <= 0) e.geo = "Set the total area in hectares";
    else if (!submissionGeodata || submissionGeodata === "INVALID")
      e.geo = "Provide a boundary or total area to derive one";
    else if (cropTypes.length === 0) e.geo = "Pick at least one crop type";

    if (farmers.length === 0) e.farmers = "Add at least one farmer";
    else if (farmers.some((f) => !f.landShare || Number(f.landShare) <= 0))
      e.farmers = "Each farmer needs a land share";

    if (docs.length === 0) e.documents = "Upload land documentation";

    return e;
  }, [
    name,
    location,
    region,
    coordinates,
    drawnPolygon,
    submissionGeodata,
    totalArea,
    cropTypes,
    farmers,
    docs,
  ]);

  const isStepValid = (k: StepKey) => !errors[k];
  const allValid = STEPS.slice(0, -1).every((s) => isStepValid(s.key));

  // ---- Mutation ----
  const submit = useMutation({
    mutationFn: () => {
      if (
        !coordinates ||
        !submissionGeodata ||
        submissionGeodata === "INVALID"
      ) {
        throw new Error("Geo data missing");
      }
      return registerCluster({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        region,
        totalArea: Number(totalArea),
        cropTypes,
        coordinates: JSON.stringify(coordinates),
        geodata: JSON.stringify(submissionGeodata),
        farmers: farmers.map((f) => ({
          userId: f.userId,
          landShare: Number(f.landShare),
        })),
        documents: docs,
      });
    },
    onSuccess: ({ cluster }) => {
      toast.success("Cluster submitted for verification");
      router.push(`/clusters/${cluster.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ---- Step navigation ----
  function goNext() {
    setTouched((t) => ({ ...t, [step]: true }));
    if (!isStepValid(step)) return;
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }
  function goBack() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <Stepper current={step} onJump={setStep} errors={errors} touched={touched} />

      {/* Active section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step !== "review") {
            goNext();
            return;
          }
          if (!allValid) {
            toast.error("Please complete all required sections");
            return;
          }
          submit.mutate();
        }}
        className="space-y-8"
      >
        {step === "identity" ? (
          <IdentitySection
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            region={region}
            setRegion={setRegion}
            location={location}
            setLocation={setLocation}
            error={touched.identity ? errors.identity : undefined}
          />
        ) : null}

        {step === "geo" ? (
          <GeographySection
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            boundariesJson={boundariesJson}
            setBoundariesJson={setBoundariesJson}
            geodataValid={drawnPolygon !== "INVALID"}
            totalArea={totalArea}
            setTotalArea={setTotalArea}
            cropTypes={cropTypes}
            setCropTypes={setCropTypes}
            cropDraft={cropDraft}
            setCropDraft={setCropDraft}
            error={touched.geo ? errors.geo : undefined}
          />
        ) : null}

        {step === "farmers" ? (
          <FarmersSection
            search={search}
            setSearch={setSearch}
            farmers={farmers}
            setFarmers={setFarmers}
            totalShare={totalShare}
            error={touched.farmers ? errors.farmers : undefined}
          />
        ) : null}

        {step === "documents" ? (
          <DocumentsSection
            docs={docs}
            setDocs={setDocs}
            inputRef={docInputRef}
            error={touched.documents ? errors.documents : undefined}
          />
        ) : null}

        {step === "review" ? (
          <ReviewSection
            data={{
              name,
              description,
              region,
              location,
              latitude,
              longitude,
              totalArea,
              cropTypes,
              farmers,
              docs,
              hasBoundary: !!boundariesJson.trim(),
            }}
            errors={errors}
            onJump={(k) => {
              setTouched((t) => ({ ...t, [k]: true }));
              setStep(k);
            }}
          />
        ) : null}

        {/* Footer nav */}
        <div className="flex items-center justify-between border-t border-emerald-950/10 pt-5 dark:border-emerald-400/10">
          <button
            type="button"
            onClick={goBack}
            disabled={step === "identity"}
            className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-950/15 bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-700 transition-colors hover:border-emerald-700/40 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-300"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>

          {step === "review" ? (
            <EditorialButton
              type="submit"
              variant="primary"
              size="md"
              shimmer
              disabled={submit.isPending || !allValid}
            >
              {submit.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit for verification
                </>
              )}
            </EditorialButton>
          ) : (
            <EditorialButton
              type="submit"
              variant="primary"
              size="md"
              disabled={!isStepValid(step)}
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </EditorialButton>
          )}
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Stepper
// ============================================================

function Stepper({
  current,
  onJump,
  errors,
  touched,
}: {
  current: StepKey;
  onJump: (k: StepKey) => void;
  errors: Partial<Record<StepKey, string>>;
  touched: Record<StepKey, boolean>;
}) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol
      role="tablist"
      aria-label="Registration sections"
      className="grid grid-cols-5 gap-2"
    >
      {STEPS.map((s, i) => {
        const active = s.key === current;
        const done = i < idx;
        const hasError = touched[s.key] && !!errors[s.key];
        return (
          <li key={s.key}>
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onJump(s.key)}
              className={cn(
                "group flex w-full flex-col items-start gap-1 border-t-2 pt-2 text-left transition-colors",
                active
                  ? "border-emerald-800 dark:border-emerald-300"
                  : done
                    ? "border-emerald-700/50"
                    : hasError
                      ? "border-rose-500"
                      : "border-emerald-950/10 hover:border-emerald-800/30 dark:border-emerald-400/10"
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">
                <span
                  className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {hasError ? (
                  <AlertCircle className="h-3 w-3 text-rose-600" />
                ) : done ? (
                  <Check className="h-3 w-3 text-emerald-700" />
                ) : (
                  s.icon
                )}
              </span>
              <span
                className={cn(
                  "font-serif text-[15px] italic",
                  active
                    ? "text-emerald-950 dark:text-emerald-50"
                    : "text-stone-600 dark:text-stone-400"
                )}
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================
// Section: Identity
// ============================================================

function IdentitySection({
  name,
  setName,
  description,
  setDescription,
  region,
  setRegion,
  location,
  setLocation,
  error,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  region: (typeof REGIONS)[number] | "";
  setRegion: (v: (typeof REGIONS)[number] | "") => void;
  location: string;
  setLocation: (v: string) => void;
  error?: string;
}) {
  return (
    <SectionShell
      eyebrow="Section i"
      title="The cluster's identity"
      lede="A name, a description, and the place it calls home."
      error={error}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EditorialField id="cl-name" label="Cluster name" hint="As registered with the kebele">
          <EditorialInput
            id="cl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bishoftu Highland Coffee Cluster"
            invalid={!!error && name.trim().length < 3}
          />
        </EditorialField>
        <EditorialField id="cl-region" label="Region">
          <select
            id="cl-region"
            value={region}
            onChange={(e) => setRegion(e.target.value as (typeof REGIONS)[number])}
            className="w-full border-0 border-b-2 border-emerald-950/15 bg-transparent px-0 py-2 text-[15px] text-emerald-950 focus:border-emerald-800 focus:outline-none dark:border-emerald-400/20 dark:text-emerald-50 dark:focus:border-emerald-300"
          >
            <option value="" className="bg-white dark:bg-stone-900">
              Select a region…
            </option>
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-white dark:bg-stone-900">
                {r}
              </option>
            ))}
          </select>
        </EditorialField>
        <EditorialField
          id="cl-location"
          label="Location"
          hint="Woreda, kebele, or landmark"
          className="sm:col-span-2"
        >
          <EditorialInput
            id="cl-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Adama Woreda, Sirba Kebele"
          />
        </EditorialField>
        <EditorialField
          id="cl-desc"
          label="Description"
          optional
          hint="A short paragraph for investors discovering your cluster."
          className="sm:col-span-2"
        >
          <EditorialTextarea
            id="cl-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Soils, history, what you grow, how the farmers cooperate…"
          />
        </EditorialField>
      </div>
    </SectionShell>
  );
}

// ============================================================
// Section: Geography
// ============================================================

function GeographySection({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  boundariesJson,
  setBoundariesJson,
  geodataValid,
  totalArea,
  setTotalArea,
  cropTypes,
  setCropTypes,
  cropDraft,
  setCropDraft,
  error,
}: {
  latitude: string;
  setLatitude: (v: string) => void;
  longitude: string;
  setLongitude: (v: string) => void;
  boundariesJson: string;
  setBoundariesJson: (v: string) => void;
  geodataValid: boolean;
  totalArea: string;
  setTotalArea: (v: string) => void;
  cropTypes: string[];
  setCropTypes: (v: string[]) => void;
  cropDraft: string;
  setCropDraft: (v: string) => void;
  error?: string;
}) {
  const [inputMode, setInputMode] = useState<"map" | "manual">("map");

  const addCrop = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (cropTypes.includes(v)) return;
    setCropTypes([...cropTypes, v]);
    setCropDraft("");
  };

  // Parse current lat/lng into a centroid for the map
  const centroid = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude || !longitude || Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [latitude, longitude]);

  // Parse current boundary JSON into a polygon for the map
  const boundary: BoundaryPolygon | null = useMemo(() => {
    if (!boundariesJson.trim()) return null;
    try {
      const parsed = JSON.parse(boundariesJson);
      if (parsed?.type === "Polygon" && Array.isArray(parsed.coordinates)) {
        return parsed as BoundaryPolygon;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, [boundariesJson]);

  return (
    <SectionShell
      eyebrow="Section ii"
      title="Geography & holdings"
      lede="Coordinates, boundaries, and the land you steward."
      error={error}
    >
      {/* Input mode toggle */}
      <div
        role="tablist"
        aria-label="Coordinate input mode"
        className="inline-flex items-center overflow-hidden rounded-sm border border-emerald-950/15 bg-stone-50/60 dark:border-emerald-400/15 dark:bg-stone-900/40"
      >
        <InputModeButton
          active={inputMode === "map"}
          onClick={() => setInputMode("map")}
          icon={<MapIcon className="h-3 w-3" />}
          label="Map picker"
        />
        <InputModeButton
          active={inputMode === "manual"}
          onClick={() => setInputMode("manual")}
          icon={<Pencil className="h-3 w-3" />}
          label="Manual entry"
        />
      </div>

      {inputMode === "map" ? (
        <div className="space-y-3">
          <MapPicker
            centroid={centroid}
            boundary={boundary}
            areaHectares={Number(totalArea) > 0 ? Number(totalArea) : null}
            onCentroidChange={(lat, lng) => {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
            }}
            onBoundaryChange={(polygon) => {
              setBoundariesJson(polygon ? JSON.stringify(polygon) : "");
            }}
          />
          {/* Read-only readouts */}
          <div className="grid grid-cols-2 gap-4 rounded-sm border border-emerald-950/10 bg-white/60 px-4 py-3 text-[11px] dark:border-emerald-400/10 dark:bg-stone-900/40 sm:grid-cols-5">
            <Readout label="Latitude" value={latitude || "—"} mono />
            <Readout label="Longitude" value={longitude || "—"} mono />
            <Readout
              label="Boundary"
              value={boundary ? `${boundary.coordinates[0].length - 1} pts` : "—"}
            />
            <Readout
              label="Radius"
              value={
                Number(totalArea) > 0
                  ? `${Math.sqrt((Number(totalArea) * 10_000) / Math.PI).toFixed(0)} m`
                  : "—"
              }
              mono
            />
            <Readout
              label="Status"
              value={centroid ? "Ready" : "Set centroid"}
              tone={centroid ? "emerald" : "stone"}
            />
          </div>
          <EditorialField
            id="cl-area-map"
            label="Total area (ha)"
            hint="Hectares under cultivation"
          >
            <EditorialInput
              id="cl-area-map"
              type="number"
              min={0}
              step="0.01"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              placeholder="120.5"
            />
          </EditorialField>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <EditorialField id="cl-lat" label="Latitude" hint="Decimal degrees, e.g. 8.9806">
              <EditorialInput
                id="cl-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="8.9806"
              />
            </EditorialField>
            <EditorialField id="cl-lng" label="Longitude" hint="Decimal degrees, e.g. 38.7578">
              <EditorialInput
                id="cl-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="38.7578"
              />
            </EditorialField>
            <EditorialField id="cl-area" label="Total area (ha)" hint="Hectares under cultivation">
              <EditorialInput
                id="cl-area"
                type="number"
                min={0}
                step="0.01"
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
                placeholder="120.5"
              />
            </EditorialField>
          </div>

          <EditorialField
            id="cl-geojson"
            label="Boundary (GeoJSON)"
            optional
            hint={
              boundariesJson && !geodataValid
                ? "JSON parse failed — paste a valid GeoJSON Polygon."
                : "Optional. If omitted, a circular boundary is derived from the centroid and total area."
            }
            error={boundariesJson && !geodataValid ? "Invalid GeoJSON" : undefined}
          >
            <EditorialTextarea
              id="cl-geojson"
              rows={4}
              value={boundariesJson}
              onChange={(e) => setBoundariesJson(e.target.value)}
              placeholder={`{ "type": "Polygon", "coordinates": [[[38.75, 8.98], …]] }`}
              invalid={!!boundariesJson && !geodataValid}
              className="font-mono text-[12px]"
            />
          </EditorialField>
        </>
      )}

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 dark:text-stone-400">
          Crop Types
        </p>
        <div className="flex flex-wrap gap-2">
          {CROP_PRESETS.map((c) => {
            const active = cropTypes.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setCropTypes(
                    active ? cropTypes.filter((x) => x !== c) : [...cropTypes, c]
                  )
                }
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-emerald-950/15 bg-white text-stone-700 hover:border-emerald-700/40 hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-300"
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={cropDraft}
            onChange={(e) => setCropDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCrop(cropDraft);
              }
            }}
            placeholder="Add a custom crop…"
            className="flex-1 border-0 border-b-2 border-emerald-950/15 bg-transparent px-0 py-1.5 text-[13px] focus:border-emerald-800 focus:outline-none dark:border-emerald-400/20"
          />
          <button
            type="button"
            onClick={() => addCrop(cropDraft)}
            disabled={!cropDraft.trim()}
            className="inline-flex items-center gap-1 rounded-sm border border-emerald-950/15 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-emerald-300"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        {cropTypes.filter((c) => !CROP_PRESETS.includes(c as never)).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cropTypes
              .filter((c) => !CROP_PRESETS.includes(c as never))
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-sm border border-emerald-700 bg-emerald-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => setCropTypes(cropTypes.filter((x) => x !== c))}
                    className="hover:text-rose-200"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

// ============================================================
// Section: Farmers
// ============================================================

function FarmersSection({
  search,
  setSearch,
  farmers,
  setFarmers,
  totalShare,
  error,
}: {
  search: string;
  setSearch: (v: string) => void;
  farmers: FarmerEntry[];
  setFarmers: (v: FarmerEntry[]) => void;
  totalShare: number;
  error?: string;
}) {
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["available-farmers", debounced],
    queryFn: () => listAvailableFarmers(debounced || undefined),
  });

  const selectedIds = useMemo(
    () => new Set(farmers.map((f) => f.userId)),
    [farmers]
  );

  const candidates: AvailableFarmer[] = data?.farmers ?? [];

  const addFarmer = (f: AvailableFarmer) => {
    if (selectedIds.has(f.id)) return;
    setFarmers([...farmers, { userId: f.id, landShare: "" }]);
  };

  const farmerById = useMemo(() => {
    const m = new Map<string, AvailableFarmer>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);

  return (
    <SectionShell
      eyebrow="Section iii"
      title="Membership ledger"
      lede="The farmers who belong to this cluster and their share of the land."
      error={error}
    >
      {/* Search */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 dark:text-stone-400">
            Available farmers
          </p>
          <label className="group flex items-center gap-2 border-b-2 border-emerald-950/15 bg-transparent py-1.5 transition-colors focus-within:border-emerald-800 dark:border-emerald-400/20">
            <Search className="h-3.5 w-3.5 text-emerald-800/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 bg-transparent text-[13px] focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-stone-400 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </label>

          <div className="max-h-80 overflow-y-auto rounded-sm border border-emerald-950/10 bg-white/60 dark:border-emerald-400/10 dark:bg-stone-900/40">
            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-8 text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : candidates.length === 0 ? (
              <p
                className="px-4 py-8 text-center font-serif text-[13px] italic text-stone-500"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                No farmers match this search.
              </p>
            ) : (
              <ul className="divide-y divide-emerald-950/10 dark:divide-emerald-400/10">
                {candidates.map((f) => {
                  const isSelected = selectedIds.has(f.id);
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => addFarmer(f)}
                        disabled={isSelected}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                          isSelected
                            ? "cursor-not-allowed bg-emerald-50/60 opacity-70 dark:bg-emerald-950/20"
                            : "hover:bg-stone-50/80 dark:hover:bg-stone-900/40"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <NameAvatar id={f.id} name={f.name} email={f.email} size="sm" />
                          <div className="min-w-0">
                            <p
                              className="truncate font-serif text-[13px] text-emerald-950 dark:text-emerald-50"
                              style={{ fontFamily: "var(--font-fraunces)" }}
                            >
                              {f.name ?? "Unnamed"}
                            </p>
                            <p className="truncate text-[10px] text-stone-500">{f.email}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Selected list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 dark:text-stone-400">
              Selected ({farmers.length})
            </p>
            <span
              className="font-mono text-[10px] tabular-nums text-stone-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Σ share: {totalShare.toFixed(2)}
            </span>
          </div>

          {farmers.length === 0 ? (
            <div className="rounded-sm border border-dashed border-emerald-950/15 bg-white/40 px-4 py-10 text-center dark:border-emerald-400/15 dark:bg-stone-900/30">
              <Users className="mx-auto h-5 w-5 text-stone-400" />
              <p
                className="mt-2 font-serif text-[12px] italic text-stone-500"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Pick farmers from the list to begin the membership ledger.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {farmers.map((f, i) => {
                const meta = farmerById.get(f.userId);
                return (
                  <li
                    key={f.userId}
                    className="flex items-center gap-3 rounded-sm border border-emerald-950/10 bg-white/70 px-3 py-2 dark:border-emerald-400/10 dark:bg-stone-900/40"
                  >
                    <span
                      className="select-none font-serif text-base italic text-emerald-900/40"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <NameAvatar
                      id={f.userId}
                      name={meta?.name}
                      email={meta?.email}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-serif text-[13px] text-emerald-950 dark:text-emerald-50"
                        style={{ fontFamily: "var(--font-fraunces)" }}
                      >
                        {meta?.name ?? "Unnamed"}
                      </p>
                      <p className="truncate text-[10px] text-stone-500">
                        {meta?.email ?? f.userId}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={f.landShare}
                      onChange={(e) => {
                        const next = [...farmers];
                        next[i] = { ...next[i], landShare: e.target.value };
                        setFarmers(next);
                      }}
                      placeholder="ha"
                      className="w-20 border-0 border-b border-emerald-950/15 bg-transparent py-1 text-right text-[12px] tabular-nums focus:border-emerald-800 focus:outline-none dark:border-emerald-400/20"
                      aria-label="Land share in hectares"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFarmers(farmers.filter((_, j) => j !== i))
                      }
                      className="text-stone-400 hover:text-rose-600"
                      aria-label="Remove farmer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

// ============================================================
// Section: Documents
// ============================================================

function DocumentsSection({
  docs,
  setDocs,
  inputRef,
  error,
}: {
  docs: File[];
  setDocs: (v: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  error?: string;
}) {
  const [dragOver, setDragOver] = useState(false);

  const ingest = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_DOC_SIZE) {
        toast.error(`${f.name} exceeds 8 MB`);
        continue;
      }
      valid.push(f);
    }
    setDocs([...docs, ...valid].slice(0, MAX_DOCS));
  };

  return (
    <SectionShell
      eyebrow="Section iv"
      title="Land documentation"
      lede="Title deeds, kebele certificates, or any proof of land ownership."
      error={error}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          ingest(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-sm border-2 border-dashed bg-stone-50/40 px-6 py-10 text-center transition-colors dark:bg-stone-900/30",
          dragOver
            ? "border-emerald-700 bg-emerald-50/40"
            : "border-emerald-950/15 dark:border-emerald-400/15"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_DOCS}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) ingest(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="mx-auto h-6 w-6 text-emerald-700 dark:text-emerald-300" />
        <p
          className="mt-3 font-serif text-lg italic text-emerald-950 dark:text-emerald-50"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Deposit your documents
        </p>
        <p
          className="mt-1 font-serif text-[12px] italic text-stone-500"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          PDF, image, or Word. Up to {MAX_DOCS} files, 8 MB each.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-emerald-900 bg-emerald-950 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-stone-50 shadow-[0_1px_0_rgba(0,0,0,0.3)] transition-colors hover:bg-emerald-900 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
        >
          Browse files
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {docs.length > 0 ? (
        <ul className="mt-5 divide-y divide-emerald-950/10 overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 dark:divide-emerald-400/10 dark:border-emerald-400/10 dark:bg-stone-900/40">
          {docs.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span
                className="select-none font-serif text-base italic text-emerald-900/40"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <FileText className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-serif text-[13px] text-emerald-950 dark:text-emerald-50"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {f.name}
                </p>
                <p
                  className="font-mono text-[10px] tabular-nums text-stone-500"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {(f.size / 1024).toFixed(1)} KB · {f.type || "unknown"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDocs(docs.filter((_, j) => j !== i))}
                className="text-stone-400 hover:text-rose-600"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionShell>
  );
}

// ============================================================
// Section: Review
// ============================================================

function ReviewSection({
  data,
  errors,
  onJump,
}: {
  data: {
    name: string;
    description: string;
    region: string;
    location: string;
    latitude: string;
    longitude: string;
    totalArea: string;
    cropTypes: string[];
    farmers: FarmerEntry[];
    docs: File[];
    hasBoundary: boolean;
  };
  errors: Partial<Record<StepKey, string>>;
  onJump: (k: StepKey) => void;
}) {
  return (
    <SectionShell
      eyebrow="Section v"
      title="Final review"
      lede="One last look before the registry receives your submission."
    >
      <ReviewBlock
        title="Identity"
        stepKey="identity"
        error={errors.identity}
        onEdit={onJump}
        rows={[
          { k: "Cluster name", v: data.name || "—" },
          { k: "Region", v: data.region || "—" },
          { k: "Location", v: data.location || "—" },
          {
            k: "Description",
            v: data.description ? data.description : "—",
            italic: true,
          },
        ]}
      />
      <ReviewBlock
        title="Geography"
        stepKey="geo"
        error={errors.geo}
        onEdit={onJump}
        rows={[
          {
            k: "Centroid",
            v:
              data.latitude && data.longitude
                ? `${data.latitude}, ${data.longitude}`
                : "—",
            mono: true,
          },
          { k: "Total area", v: data.totalArea ? `${data.totalArea} ha` : "—" },
          { k: "Boundary", v: data.hasBoundary ? "GeoJSON provided" : "—" },
          {
            k: "Crop types",
            v: data.cropTypes.length ? data.cropTypes.join(" · ") : "—",
          },
        ]}
      />
      <ReviewBlock
        title="Membership"
        stepKey="farmers"
        error={errors.farmers}
        onEdit={onJump}
        rows={[
          { k: "Farmers", v: `${data.farmers.length} farmer(s)` },
          {
            k: "Total share",
            v: `${data.farmers
              .reduce((s, f) => s + (Number(f.landShare) || 0), 0)
              .toFixed(2)} ha`,
            mono: true,
          },
        ]}
      />
      <ReviewBlock
        title="Documents"
        stepKey="documents"
        error={errors.documents}
        onEdit={onJump}
        rows={[{ k: "Files", v: `${data.docs.length} attached` }]}
      />
    </SectionShell>
  );
}

function ReviewBlock({
  title,
  stepKey,
  error,
  onEdit,
  rows,
}: {
  title: string;
  stepKey: StepKey;
  error?: string;
  onEdit: (k: StepKey) => void;
  rows: { k: string; v: string; italic?: boolean; mono?: boolean }[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-emerald-950/10 bg-white/60 dark:border-emerald-400/10 dark:bg-stone-900/40">
      <header className="flex items-center justify-between border-b border-emerald-950/10 bg-stone-50/60 px-4 py-2 dark:border-emerald-400/10 dark:bg-stone-900/40">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            {title}
          </p>
          {error ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-rose-700">
              <AlertCircle className="h-3 w-3" />
              {error}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
              <Check className="h-3 w-3" />
              Ready
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepKey)}
          className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 underline-offset-4 hover:text-emerald-800 hover:underline dark:text-stone-400"
        >
          Edit
        </button>
      </header>
      <dl className="divide-y divide-emerald-950/5 dark:divide-emerald-400/5">
        {rows.map((r) => (
          <div
            key={r.k}
            className="grid grid-cols-[140px_minmax(0,1fr)] items-baseline gap-3 px-4 py-2"
          >
            <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
              {r.k}
            </dt>
            <dd
              className={cn(
                "text-[13px] text-emerald-950 dark:text-emerald-50",
                r.italic && "font-serif italic",
                r.mono && "font-mono text-[11px] tabular-nums"
              )}
              style={
                r.italic
                  ? { fontFamily: "var(--font-fraunces)" }
                  : r.mono
                    ? { fontFamily: "var(--font-geist-mono)" }
                    : undefined
              }
            >
              {r.v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ============================================================
// Geography helpers
// ============================================================

function InputModeButton({
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
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] transition-colors",
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

function Readout({
  label,
  value,
  mono,
  tone = "stone",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "stone" | "emerald";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-stone-500">
        {label}
      </span>
      <span
        className={cn(
          "text-[12px]",
          mono && "font-mono tabular-nums",
          tone === "emerald"
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-stone-800 dark:text-stone-200"
        )}
        style={mono ? { fontFamily: "var(--font-geist-mono)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// Section shell
// ============================================================

function SectionShell({
  eyebrow,
  title,
  lede,
  error,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header>
        <SectionHeader title={title} eyebrow={eyebrow} meta={error ? "Needs attention" : undefined} />
        <p
          className="mt-1 max-w-2xl font-serif text-sm italic text-stone-600 dark:text-stone-400"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {lede}
        </p>
        <Ornament className="mt-3" />
      </header>
      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-rose-300/60 bg-rose-50/60 px-3 py-2 text-[12px] text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="space-y-6">{children}</div>
      <HorizonRule />
    </section>
  );
}
