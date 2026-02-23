/**
 * Ejecuta crons internos llamando a API routes.
 * Añadir un cron = una línea en registerCrons().
 * En producción (Docker/Easypanel): 127.0.0.1 suele fallar → usar CRON_SELF_URL o NEXTAUTH_URL.
 */
function getCronBaseUrl(): string {
    if (process.env.CRON_SELF_URL) return process.env.CRON_SELF_URL.replace(/\/$/, "");
    const nextAuth = process.env.NEXTAUTH_URL;
    if (nextAuth && (nextAuth.startsWith("http://") || nextAuth.startsWith("https://"))) {
        return nextAuth.replace(/\/$/, "");
    }
    const port = process.env.PORT || "3000";
    return `http://127.0.0.1:${port}`;
}
const base = getCronBaseUrl();
const cronSecret = process.env.CRON_SECRET;

type CronJob = {
  path: string;
  intervalMs: number;
  name?: string;
};

async function runCron(job: CronJob): Promise<void> {
  const url = new URL(job.path, base).href;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[Cron] ${job.name || job.path}: ${res.status}`, text.slice(0, 100));
      return;
    }
    try {
      const data = JSON.parse(text) as { remindersSent?: number; checked?: number };
      if (data.remindersSent && data.remindersSent > 0) {
        console.log(`[GOING] ${job.name || job.path}: ${data.remindersSent} enviados`);
      }
    } catch {
      // respuesta no JSON, ignorar
    }
  } catch (e) {
    console.error(`[Cron] ${job.name || job.path}:`, e);
  }
}

export function registerCrons(jobs: CronJob[]): void {
  console.log(`[GOING] Cron base URL: ${base}`);
  for (const job of jobs) {
    setInterval(() => runCron(job), job.intervalMs);
    console.log(`[GOING] Cron: ${job.name || job.path} cada ${job.intervalMs / 1000}s`);
  }
}
