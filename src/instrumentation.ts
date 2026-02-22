export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const log = (msg: string) => console.log(`[GOING] ${msg}`);

  log("=== Inicio del servidor ===");
  log(`NODE_ENV: ${process.env.NODE_ENV ?? "undefined"}`);
  log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(no definido)"}`);
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "definido" : "(no definido)"}`);
  log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "definido" : "(no definido)"}`);
  log("=== Servidor listo (MongoDB se conectará en la primera petición) ===");

  const port = process.env.PORT || "3000";
  const cronSecret = process.env.CRON_SECRET;
  const base =
    process.env.CRON_SELF_URL ||
    process.env.NEXTAUTH_URL ||
    `http://127.0.0.1:${port}`;
  const cronUrl = new URL("/api/cron/remind-pending-orders", base).href;

  setInterval(async () => {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
      const res = await fetch(cronUrl, { headers });
      const text = await res.text();
      const data = (() => {
        try {
          return JSON.parse(text) as { ok?: boolean; remindersSent?: number; checked?: number; message?: string };
        } catch {
          return {};
        }
      })();

      if (!res.ok) {
        console.error(
          `[GOING] Cron: ${res.status} ${res.statusText}`,
          res.status === 401 && !cronSecret
            ? "- Define CRON_SECRET en Easypanel para autorizar el cron"
            : res.status === 401
              ? "- CRON_SECRET incorrecto o no enviado"
              : "",
          "|",
          data.message || text.slice(0, 80)
        );
        return;
      }

      const sent = data.remindersSent ?? 0;
      const checked = data.checked ?? 0;
      if (sent > 0) {
        log(`Cron: ${sent} recordatorios enviados (${checked} pedidos revisados)`);
      }
    } catch (e) {
      console.error("[GOING] Cron remind-pending:", e);
    }
  }, 60 * 1000);
  log("Cron de recordatorios: cada 1 min");
}
