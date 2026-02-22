export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const log = (msg: string) => console.log(`[GOING] ${msg}`);

  log("=== Inicio del servidor ===");
  log(`NODE_ENV: ${process.env.NODE_ENV ?? "undefined"}`);
  log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ?? "(no definido)"}`);
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "definido" : "(no definido)"}`);
  log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "definido" : "(no definido)"}`);

  try {
    const dbConnect = (await import("@/lib/mongodb")).default;
    await dbConnect();
    log("MongoDB: conexión establecida");
  } catch (e) {
    log(`MongoDB: error al conectar - ${e instanceof Error ? e.message : String(e)}`);
  }

  log("=== Servidor listo ===");
}
