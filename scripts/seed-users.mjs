#!/usr/bin/env node
/**
 * Script para crear usuarios de prueba: 1 conductor y 1 negocio.
 * Uso: node scripts/seed-users.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env
for (const name of [".env.local", ".env"]) {
  const envPath = join(__dirname, "..", name);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    });
    break;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI no definida");
  process.exit(1);
}

const USERS = [
  {
    name: "Carlos Moto",
    email: "driver@going.com",
    password: "driver123",
    role: "DRIVER",
    city: "BOGOTA",
    driverDetails: { vehicleType: "Motorcycle", licensePlate: "ABC-456" },
  },
  {
    name: "Tienda El Buen Precio",
    email: "business@going.com",
    password: "business123",
    role: "BUSINESS",
    city: "BOGOTA",
    businessDetails: { companyName: "El Buen Precio S.A.S", taxId: "900.123.456-7" },
  },
];

async function main() {
  console.log("Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection("users");

  for (const u of USERS) {
    const existing = await col.findOne({ email: { $regex: new RegExp(`^${u.email}$`, "i") } });
    if (existing) {
      console.log(`⏭ ${u.email} ya existe`);
      continue;
    }
    await col.insertOne({
      ...u,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✓ Creado: ${u.email} (${u.role})`);
  }

  await mongoose.disconnect();
  console.log("\nListo. Credenciales:");
  console.log("  Conductor: driver@going.com / driver123");
  console.log("  Negocio:   business@going.com / business123");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
