export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const log = (msg: string) => console.log(`[GOING] ${msg}`);

  log("=== Inicio del servidor ===");
  log(`NODE_ENV: ${process.env.NODE_ENV ?? "undefined"}`);
  log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(no definido)"}`);
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "definido" : "(no definido)"}`);
  log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "definido" : "(no definido)"}`);
  log("=== Servidor listo (MongoDB se conectará en la primera petición) ===");
}
