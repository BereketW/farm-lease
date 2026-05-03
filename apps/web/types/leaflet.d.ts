/**
 * Minimal Leaflet type shim (avoids requiring @types/leaflet).
 * Declares only the default export as a loose namespace object.
 */
declare module "leaflet" {
  export type LatLngExpression = [number, number] | { lat: number; lng: number };

  export interface LatLng {
    lat: number;
    lng: number;
  }

  export interface LeafletMouseEvent {
    latlng: LatLng;
  }

  export interface Map {
    setView(center: LatLngExpression, zoom?: number): this;
    on(event: string, fn: (e: LeafletMouseEvent) => void): this;
    off(event?: string, fn?: (e: LeafletMouseEvent) => void): this;
    remove(): this;
    invalidateSize(): this;
    fitBounds(bounds: LatLngExpression[], options?: { padding?: [number, number] }): this;
  }

  export interface Layer {
    addTo(map: Map): this;
    remove(): this;
  }

  export interface Marker extends Layer {
    setLatLng(latlng: LatLngExpression): this;
  }

  export interface Polygon extends Layer {
    setLatLngs(latlngs: LatLngExpression[]): this;
  }

  export interface Polyline extends Layer {
    setLatLngs(latlngs: LatLngExpression[]): this;
  }

  export interface CircleMarker extends Layer {
    setLatLng(latlng: LatLngExpression): this;
  }

  export interface PathOptions {
    color?: string;
    weight?: number;
    fillColor?: string;
    fillOpacity?: number;
    opacity?: number;
    dashArray?: string;
    radius?: number;
  }

  export interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }

  export interface LeafletStatic {
    map(
      id: string | HTMLElement,
      options?: {
        center?: LatLngExpression;
        zoom?: number;
        zoomControl?: boolean;
        attributionControl?: boolean;
        scrollWheelZoom?: boolean;
      }
    ): Map;
    tileLayer(
      urlTemplate: string,
      options?: { attribution?: string; maxZoom?: number }
    ): Layer;
    marker(
      latlng: LatLngExpression,
      options?: { icon?: unknown; draggable?: boolean }
    ): Marker;
    circleMarker(latlng: LatLngExpression, options?: PathOptions): CircleMarker;
    polygon(latlngs: LatLngExpression[], options?: PathOptions): Polygon;
    polyline(latlngs: LatLngExpression[], options?: PathOptions): Polyline;
    divIcon(options: DivIconOptions): unknown;
  }

  const L: LeafletStatic;
  export default L;
}
