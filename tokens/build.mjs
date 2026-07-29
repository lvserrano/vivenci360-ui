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
  // "oled" também é esquema escuro para o navegador (scrollbar nativa, form
  // controls etc.) — só "light" pinta claro. Passo 35.
  return nome === "light" ? "light" : "dark";
}

// ─── Checagem de contraste WCAG AA (roda no build, falha o processo) ───
// Razão de contraste por luminância relativa (WCAG 2.x):
//   sRGB [0,255] → linear → L = .2126 R + .7152 G + .0722 B
//   ratio = (L1 + .05) / (L2 + .05), L1 = mais clara
// Só checa pares de cor sólida em hex — pula rgba()/gradiente, que não têm
// luminância fixa fora do contexto de composição.
function hexParaRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminanciaRelativa([r, g, b]) {
  const canal = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [canal(r), canal(g), canal(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function razaoContraste(hexA, hexB) {
  const rgbA = hexParaRgb(hexA);
  const rgbB = hexParaRgb(hexB);
  if (!rgbA || !rgbB) return null; // pula rgba/gradiente
  const lA = luminanciaRelativa(rgbA);
  const lB = luminanciaRelativa(rgbB);
  const [clara, escura] = lA >= lB ? [lA, lB] : [lB, lA];
  return (clara + 0.05) / (escura + 0.05);
}

const PARES_AA = [
  ["text", "bg", 4.5],
  ["text", "surface", 4.5],
  ["text-muted", "bg", 4.5],
  ["text-muted", "surface", 4.5],
  ["on-accent", "accent", 4.5],
  ["sidebar-text-active", "sidebar-bg", 4.5],
  ["text-subtle", "bg", 3.0], // decorativo/placeholder — limiar reduzido, não é texto de leitura
];

let falhouContraste = false;
for (const nome of nomesTemas) {
  const tema = tokens.temas[nome];
  for (const [chaveA, chaveB, minimo] of PARES_AA) {
    const valorA = chaveA === "on-accent" ? tokens.invariante[chaveA] : tema[chaveA];
    const valorB = chaveB === "on-accent" ? tokens.invariante[chaveB] : tema[chaveB];
    if (valorA === undefined || valorB === undefined) continue;
    const razao = razaoContraste(valorA, valorB);
    if (razao === null) continue; // par não é hex/hex (rgba/gradiente) — pulado
    if (razao < minimo) {
      falhouContraste = true;
      console.error(
        `[tokens] contraste insuficiente em tema "${nome}": --${chaveA} (${valorA}) / --${chaveB} (${valorB}) = ${razao.toFixed(2)}:1, mínimo ${minimo}:1`
      );
    }
  }
}
if (falhouContraste) {
  console.error("[tokens] build abortado: ajuste os valores em tokens.json (não o limiar).");
  process.exit(1);
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
