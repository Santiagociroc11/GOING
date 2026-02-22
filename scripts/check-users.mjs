#!/usr/bin/env node
/**
 * Script para explorar toda la base de datos MongoDB.
 * Uso: node scripts/check-users.mjs
 * Carga .env.local o .env automáticamente.
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

// Ocultar credenciales en el log
const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log("URI (oculta):", safeUri);

async function main() {
  console.log("\nConectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const client = mongoose.connection.getClient();
  console.log("✓ Conectado\n");

  // 1. Listar todas las bases de datos
  const adminDb = client.db().admin();
  const { databases } = await adminDb.listDatabases();
  console.log("=== BASES DE DATOS EN EL SERVIDOR ===");
  databases.forEach((db) => {
    console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024).toFixed(1)} KB)`);
  });

  // 2. Base de datos actual (de la URI)
  const dbName = mongoose.connection.db.databaseName;
  console.log(`\n=== BASE DE DATOS ACTUAL (de la URI): "${dbName}" ===\n`);

  // 3. Listar todas las colecciones
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("=== COLECCIONES EN", dbName, "===");
  if (collections.length === 0) {
    console.log("  (vacía - no hay colecciones)\n");
  } else {
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documentos`);
    }
  }

  // 4. Buscar colecciones que puedan ser de usuarios
  const userCollectionNames = ["users", "user", "Users", "User"];
  console.log("\n=== BÚSQUEDA DE USUARIOS ===");
  for (const colName of userCollectionNames) {
    try {
      const col = mongoose.connection.db.collection(colName);
      const count = await col.countDocuments();
      if (count > 0) {
        console.log(`\n--- Colección "${colName}" (${count} docs) ---`);
        const docs = await col.find({}).limit(10).toArray();
        docs.forEach((doc, i) => {
          const safe = { ...doc };
          if (safe.password) safe.password = `[${safe.password.length} chars]`;
          delete safe.__v;
          console.log(JSON.stringify(safe, null, 2));
        });
        if (count > 10) console.log(`... y ${count - 10} más`);
      }
    } catch {
      // Colección no existe
    }
  }

  // 5. Si no hay users, listar TODOS los documentos de TODAS las colecciones (muestra)
  if (collections.length > 0) {
    console.log("\n=== MUESTRA DE DOCUMENTOS (todas las colecciones) ===");
    for (const col of collections) {
      const docs = await mongoose.connection.db.collection(col.name).find({}).limit(2).toArray();
      if (docs.length > 0) {
        console.log(`\n[${col.name}]`);
        docs.forEach((doc) => {
          const safe = { ...doc };
          if (safe.password) safe.password = "[oculto]";
          delete safe.__v;
          console.log(JSON.stringify(safe, null, 2));
        });
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nDesconectado.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
