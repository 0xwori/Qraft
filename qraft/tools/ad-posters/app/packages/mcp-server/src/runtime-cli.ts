#!/usr/bin/env node
import { startAdPostersRuntime } from "./runtime.js";

const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = portArg ? Number(portArg.split("=")[1]) : undefined;

const runtime = await startAdPostersRuntime({ port, launchBrowser: true });
console.log(`Ad Posters UI running at ${runtime.url}`);

process.on("SIGINT", async () => {
  await runtime.close();
  process.exit(0);
});
