export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const log = (msg: string) => console.log(`[GOING] ${msg}`);

  log("=== Inicio del servidor ===");
  log(`NODE_ENV: ${process.env.NODE_ENV ?? "undefined"}`);
  log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(no definido)"}`);
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "definido" : "(no definido)"}`);
  log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "definido" : "(no definido)"}`);
  log("=== Servidor listo (MongoDB se conectará en la primera petición) ===");

  // Cron interno: recordatorios de pedidos pendientes cada 1 min
  const { runRemindPendingOrders } = await import("@/lib/cron-reminders");
  setInterval(async () => {
    try {
      const { remindersSent, checked } = await runRemindPendingOrders();
      if (remindersSent > 0) {
        log(`Cron: ${remindersSent} recordatorios enviados (${checked} pedidos revisados)`);
      }
    } catch (e) {
      console.error("[GOING] Cron remind-pending:", e);
    }
  }, 60 * 1000);
  log("Cron de recordatorios: cada 1 min");
}
