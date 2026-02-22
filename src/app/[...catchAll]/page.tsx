import { notFound } from "next/navigation";

/**
 * Catch-all para rutas no definidas.
 * Fuerza que cualquier path desconocido muestre la página 404 de la app
 * en lugar de caer en el handler por defecto del proxy (Easypanel, etc.).
 */
export default function CatchAllPage() {
    notFound();
}
