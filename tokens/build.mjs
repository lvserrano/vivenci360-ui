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

// Passo 34: N temas nomeados (tokens.temas), não mais dois campos chumbados.
// tokens._tema_padrao decide o tema aplicado em :root sem data-theme.
// tokens.temas.dark permanece um caso especial documentado no @media abaixo —
// é o único fallback que o SO conhece (prefers-color-scheme só tem light/dark),
// não é "mais um tema" participando da iteração genérica.
const nomesTemas = Object.keys(tokens.temas);
const temaPadrao = tokens._tema_padrao;

function colorScheme(nome) {
  return nome === "dark" ? "dark" : "light";
}

const blocosPorTema = nomesTemas
  .map((nome) => `:root[data-theme="${nome}"] {
  color-scheme: ${colorScheme(nome)};
${bloco(tokens.temas[nome])}
}`)
  .join("\n\n");

const css = `/* GERADO por packages/tokens/build.mjs a partir de tokens.json. Não editar à mão. */

:root {
  color-scheme: ${colorScheme(temaPadrao)};
${bloco(tokens.invariante)}
${bloco(tokens.temas[temaPadrao])}
}

${blocosPorTema}

/* Fallback anti-flash: pinta no tema do sistema operacional entre o HTML vindo do
   servidor (sem data-theme ainda) e o <script> inline que aplica a preferência
   salva. Some assim que data-theme é explícito, em qualquer dos dois valores.
   Caso especial fixo em "dark": é o único tema que o SO sabe pedir via
   prefers-color-scheme — não itera sobre tokens.temas. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${bloco(tokens.temas.dark)}
  }
}
`;

function objetoTs(vars, indent = "  ") {
  return Object.entries(vars)
    .map(([nome, valor]) => `${indent}"${nome}": ${JSON.stringify(valor)},`)
    .join("\n");
}

const temasTs = nomesTemas
  .map((nome) => `  ${JSON.stringify(nome)}: {
${objetoTs(tokens.temas[nome], "    ")}
  },`)
  .join("\n");

const ts = `// GERADO por packages/tokens/build.mjs a partir de tokens.json. Não editar à mão.

export const tokensInvariantes = {
${objetoTs(tokens.invariante)}
} as const;

// N temas nomeados (passo 34). Hoje só existem "light" e "dark" — adicionar um
// tema novo é acrescentar uma chave em tokens.json > temas e rodar o build,
// nada aqui precisa mudar à mão.
export const temas = {
${temasTs}
} as const;

export type Tema = keyof typeof temas;
export type NomeToken = keyof (typeof temas)[Tema];

/** Retrocompatibilidade: os dois temas de hoje continuam acessíveis por nome direto. */
export const tokensClaro = temas.light;
export const tokensEscuro = temas.dark;

export function tokensDoTema(tema: Tema) {
  return temas[tema];
}
`;

mkdirSync(path.join(dir, "dist"), { recursive: true });
writeFileSync(path.join(dir, "dist", "tokens.css"), css);
writeFileSync(path.join(dir, "dist", "tokens.ts"), ts);
console.log("tokens: dist/tokens.css e dist/tokens.ts gerados.");
