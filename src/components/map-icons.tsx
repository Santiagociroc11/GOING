/**
 * Iconos para marcadores del mapa - estilo Rappi (limpio, reconocible).
 * Pins circulares con iconos minimalistas.
 */

const PIN_STYLE = "display:flex;align-items:center;justify-content:center;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)";

/** Tienda/negocio - recogida (estilo Rappi) */
export const PICKUP_ICON_HTML = `<div style="width:36px;height:36px;background:#f97316;${PIN_STYLE};font-size:20px;line-height:1">🏪</div>`;

/** Casa/destino - entrega */
export const DROPOFF_ICON_HTML = `<div style="width:36px;height:36px;background:#22c55e;${PIN_STYLE};font-size:20px;line-height:1">🏠</div>`;

/** Persona en moto - domiciliario (estilo Rappi) */
export const DRIVER_ICON_HTML = `<div style="width:40px;height:40px;background:#3b82f6;${PIN_STYLE};box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:24px;line-height:1">🛵</div>`;
