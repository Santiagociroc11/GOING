import { registerCrons } from "@/lib/cron-runner";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const log = (msg: string) => console.log(`[GOING] ${msg}`);
  log("=== Inicio del servidor ===");
  log(`NODE_ENV: ${process.env.NODE_ENV ?? "undefined"}`);
  log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(no definido)"}`);
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "definido" : "(no definido)"}`);
  log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "definido" : "(no definido)"}`);
  log("=== Servidor listo (MongoDB se conectará en la primera petición) ===");

  // Si usas cron externo (Easypanel, cron-job.org), pon DISABLE_INTERNAL_CRON=true
  if (!process.env.DISABLE_INTERNAL_CRON) {
    registerCrons([
      { path: "/api/cron/remind-pending-orders", intervalMs: 60_000, name: "recordatorios" },
      // Añadir más: { path: "/api/cron/otro", intervalMs: 300_000, name: "otro" },
    ]);
  }
}
