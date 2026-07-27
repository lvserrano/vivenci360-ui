#!/usr/bin/env node
// Gera dist/tokens.css e dist/tokens.ts a partir de tokens.json.
// Não editar os arquivos de dist/ à mão — eles são sobrescritos a cada build.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(path.join(dir, "tokens.json"), "utf8"));

function bloco(vars) {
  return Object.entries(vars)
    .map(([nome, valor]) => `  --${nome}: ${valor};`)
    .join("\n");
}

const css = `/* GERADO por packages/tokens/build.mjs a partir de tokens.json. Não editar à mão. */

:root {
  color-scheme: light;
${bloco(tokens.invariante)}
${bloco(tokens.light)}
}

:root[data-theme="dark"] {
  color-scheme: dark;
${bloco(tokens.dark)}
}

/* Fallback anti-flash: pinta no tema do sistema operacional entre o HTML vindo do
   servidor (sem data-theme ainda) e o <script> inline que aplica a preferência
   salva. Some assim que data-theme é explícito, em qualquer dos dois valores. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${bloco(tokens.dark)}
  }
}
`;

function objetoTs(vars) {
  return Object.entries(vars)
    .map(([nome, valor]) => `  "${nome}": ${JSON.stringify(valor)},`)
    .join("\n");
}

const ts = `// GERADO por packages/tokens/build.mjs a partir de tokens.json. Não editar à mão.

export const tokensInvariantes = {
${objetoTs(tokens.invariante)}
} as const;

export const tokensClaro = {
${objetoTs(tokens.light)}
} as const;

export const tokensEscuro = {
${objetoTs(tokens.dark)}
} as const;

export type NomeToken = keyof typeof tokensClaro;
export type Tema = "light" | "dark";

export function tokensDoTema(tema: Tema) {
  return tema === "dark" ? tokensEscuro : tokensClaro;
}
`;

mkdirSync(path.join(dir, "dist"), { recursive: true });
writeFileSync(path.join(dir, "dist", "tokens.css"), css);
writeFileSync(path.join(dir, "dist", "tokens.ts"), ts);
console.log("tokens: dist/tokens.css e dist/tokens.ts gerados.");
