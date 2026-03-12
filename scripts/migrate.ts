import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Read and apply migration
    const migrationPath = join(
      __dirname,
      "..",
      "apps",
      "api",
      "src",
      "db",
      "migrations",
      "0001_initial.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    // Check if already applied
    const { rows } = await pool.query(
      "SELECT 1 FROM _migrations WHERE name = $1",
      ["0001_initial"],
    );

    if (rows.length > 0) {
      console.log("Migration 0001_initial already applied, skipping.");
    } else {
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [
        "0001_initial",
      ]);
      console.log("Applied migration: 0001_initial");
    }

    console.log("Migrations complete.");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
