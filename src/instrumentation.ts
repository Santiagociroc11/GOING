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
  const cronUrl = `http://127.0.0.1:${port}/api/cron/remind-pending-orders`;

  setInterval(async () => {
    try {
      const res = await fetch(cronUrl, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      });
      const data = (await res.json().catch(() => ({}))) as { remindersSent?: number; checked?: number };
      if (data.remindersSent && data.remindersSent > 0) {
        log(`Cron: ${data.remindersSent} recordatorios enviados (${data.checked ?? 0} pedidos revisados)`);
      }
    } catch (e) {
      console.error("[GOING] Cron remind-pending:", e);
    }
  }, 60 * 1000);
  log("Cron de recordatorios: cada 1 min");
}
