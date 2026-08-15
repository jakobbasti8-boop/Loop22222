import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set(["node_modules", ".git", ".manus"]);
const sourceFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(fullPath);
  }
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

function resolves(sourceFile, specifier) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(sourceFile), specifier);
  else return true;

  const candidates = [];
  if (base.endsWith(".js")) {
    candidates.push(base.slice(0, -3) + ".ts", base.slice(0, -3) + ".tsx", base);
  } else {
    candidates.push(base, ...[".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".cjs"].map((extension) => base + extension));
  }
  if (candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) return true;
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    return ["index.ts", "index.tsx", "index.js", "index.jsx", "index.json"].some((name) => fs.existsSync(path.join(base, name)));
  }
  return false;
}

walk(root);
const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g;
const missing = [];
for (const sourceFile of sourceFiles) {
  const source = stripComments(fs.readFileSync(sourceFile, "utf8"));
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!resolves(sourceFile, specifier)) missing.push(`${path.relative(root, sourceFile)} -> ${specifier}`);
  }
}

if (missing.length) {
  console.error("LoopForge Source Integrity FEHLER");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`LoopForge Source Integrity OK (${sourceFiles.length} TS/TSX-Dateien, 0 ungelöste lokale Imports)`);
