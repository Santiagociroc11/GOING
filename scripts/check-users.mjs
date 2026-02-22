#!/usr/bin/env node
/**
 * Script para verificar usuarios en MongoDB.
 * Uso: node scripts/check-users.mjs
 * Carga .env.local automáticamente si existe.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local o .env
for (const name of [".env.local", ".env"]) {
  const envPath = join(__dirname, "..", name);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
    break;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI no definida. Usa .env.local o: MONGODB_URI=... node scripts/check-users.mjs");
  process.exit(1);
}

async function main() {
  console.log("Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Conectado\n");

  const users = await mongoose.connection.db
    .collection("users")
    .aggregate([
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          city: 1,
          active: 1,
          hasPassword: { $gt: [{ $strLenCP: { $ifNull: ["$password", ""] } }, 0] },
        },
      },
    ])
    .toArray();

  console.log(`Usuarios encontrados: ${users.length}\n`);
  if (users.length === 0) {
    console.log("No hay usuarios. Crea uno en /register o usa el seed-admin.");
    await mongoose.disconnect();
    return;
  }

  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email}`);
    console.log(`   nombre: ${u.name}`);
    console.log(`   rol: ${u.role}`);
    console.log(`   ciudad: ${u.city}`);
    console.log(`   activo: ${u.active}`);
    console.log(`   tiene contraseña: ${u.hasPassword ? "sí" : "no"}`);
    console.log("");
  });

  await mongoose.disconnect();
  console.log("Desconectado.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
