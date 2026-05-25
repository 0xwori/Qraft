#!/usr/bin/env node
import { startMicroKeynoteRuntime } from "./runtime.js";

const runtime = await startMicroKeynoteRuntime({ launchBrowser: true });
console.log(`qraftPptx UI running at ${runtime.url}`);
