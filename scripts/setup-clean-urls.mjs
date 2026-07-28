#!/usr/bin/env node
/** Live Server: serve /stack, /rooms, … from <route>/index.html */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["stack", "rooms", "launch", "scout", "legal"];

for (const page of pages) {
  const src = join(root, `${page}.html`);
  const dir = join(root, page);
  await mkdir(dir, { recursive: true });
  await copyFile(src, join(dir, "index.html"));
  console.log(`  /${page} → ${page}/index.html`);
}

console.log(`Clean URL folders ready (${pages.length} routes).`);
