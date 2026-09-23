import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

if (process.env.NODE_ENV === "production" || process.env.CF_PAGES_BRANCH === "main")
  throw new Error("Demo fixtures are disabled in production.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const client = neon(process.env.DATABASE_URL);
const source = await readFile(fileURLToPath(new URL("./demo-data.sql", import.meta.url)), "utf8");
for (const statement of source
  .split("--> statement-breakpoint")
  .map((value) => value.trim())
  .filter(Boolean))
  await client.query(statement);
console.log("AsaseLink demonstration fixtures are ready. Re-running this command is safe.");
