#!/usr/bin/env node
/**
 * Live Server (and other static hosts without rewrites) need a real file at
 * u/<address>/index.html for each /u/<address> URL. Production uses u/[address].html + rewrites.
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "u", "_template-base.html");
const indexer = "https://indexer.dahood.fun";

/** Sample address baked into the production HTML template. */
const TEMPLATE_ADDRESS = "0xcddc4794f4d310603c326ab231f9e21799b88359";
const TEMPLATE_SHORT = `${TEMPLATE_ADDRESS.slice(0, 6)}…${TEMPLATE_ADDRESS.slice(-4)}`;

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Replace flight-data + SSR placeholders so Next.js receives a valid address param. */
function customizeProfileHtml(html, address) {
  const subject = address.toLowerCase();
  const subjectShort = shortAddress(subject);
  return html
    .replaceAll(TEMPLATE_ADDRESS, subject)
    .replaceAll(TEMPLATE_SHORT, subjectShort);
}

const template = await readFile(templatePath, "utf8");

let subjects = [];
try {
  const res = await fetch(`${indexer}/markets`, { cache: "no-store" });
  if (res.ok) {
    const markets = await res.json();
    subjects = [...new Set(markets.map((m) => m.subject.toLowerCase()))];
  }
} catch {
  console.warn("indexer unreachable — keeping existing u/ pages only");
}

// Drop previously generated address folders (keep u/[address].html, u/_template-base.html).
for (const name of await readdir(join(root, "u")).catch(() => [])) {
  if (name.startsWith("0x")) {
    await rm(join(root, "u", name), { recursive: true, force: true });
  }
}

let written = 0;
for (const subject of subjects) {
  const dir = join(root, "u", subject);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "index.html"),
    customizeProfileHtml(template, subject),
    "utf8",
  );
  written++;
}

console.log(`Generated ${written} profile pages under u/<address>/index.html`);
