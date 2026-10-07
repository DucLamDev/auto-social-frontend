import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
const source = process.env.OPENAPI_SCHEMA_URL || `${baseUrl}/api/docs-json`;
const output = path.resolve("src/generated/api/schema.ts");

async function loadDocument(location) {
  const url = new URL(location);
  if (url.protocol === "file:") return JSON.parse(await fs.readFile(fileURLToPath(url), "utf8"));
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Schema request returned HTTP ${response.status}`);
  return response.json();
}

function ensureUniqueOperationIds(document) {
  const seen = new Set();
  let normalized = 0;
  for (const [route, pathItem] of Object.entries(document.paths || {})) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== "object" || !operation.operationId) continue;
      const original = String(operation.operationId);
      if (!seen.has(original)) { seen.add(original); continue; }
      const suffix = `${method}_${route}`.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
      let candidate = `${original}_${suffix}`;
      let sequence = 2;
      while (seen.has(candidate)) candidate = `${original}_${suffix}_${sequence++}`;
      operation.operationId = candidate;
      seen.add(candidate);
      normalized += 1;
    }
  }
  if (normalized) process.stderr.write(`Warning: normalized ${normalized} duplicate operationId values from the source schema.\n`);
  return document;
}

try {
  const document = ensureUniqueOperationIds(await loadDocument(source));
  const ast = await openapiTS(document);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${astToString(ast)}\n`, "utf8");
  process.stdout.write(`Generated ${output} from ${source}\n`);
} catch (error) {
  process.stderr.write(`OpenAPI generation failed for ${source}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
