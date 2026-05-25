#!/usr/bin/env node
import path from "node:path";
import { migrateAll } from "./index.js";

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const positional = args.filter((a) => !a.startsWith("--"));
  const target = positional[0];
  if (!target) {
    console.error("Usage: migrate-decks <decks-root> [--force]");
    process.exit(2);
  }
  const decksRoot = path.resolve(target);
  await migrateAll(decksRoot, { force });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
