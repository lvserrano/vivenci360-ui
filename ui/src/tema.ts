// Tema (INGENIX). A preferência fica em localStorage (`ingenix_theme`) e é
// aplicada como atributo `data-theme` no <html> — os tokens de cor do
// globals.css reagem.
//
// Obs.: localStorage é por-origem, então a escolha feita num app (ex.: o hub
// em muapp.com.br) NÃO atravessa para outro subdomínio (ex.:
// kanban.muapp.com.br) — cada um guarda a própria preferência. Isso explica
// um comportamento que parece bug e não é.
//
// O "sem flash" no primeiro paint é feito por um <script> inline no layout de
// cada app; aqui ficam os helpers usados pelos controles (ThemeToggle,
// Configurações).
//
// Passo 34: generalizado de dois temas chumbados para N temas nomeados. `Tema`
// deriva do schema gerado em tokens.ts (hoje efetivamente "light" | "dark" —
// os únicos dois temas que existem), então um tema de marca novo (passo 35)
// não exige tocar neste arquivo, só em tokens.json.

import { temas } from "../../tokens/dist/tokens";

export const THEME_KEY = "ingenix_theme";
export type Tema = keyof typeof temas;

const NOMES_TEMA = Object.keys(temas) as Tema[];

function ehTemaConhecido(v: unknown): v is Tema {
  return typeof v === "string" && (NOMES_TEMA as string[]).includes(v);
}

/** Lê a preferência salva; sem preferência, segue o tema do sistema operacional. */
export function temaInicial(): Tema {
  if (typeof window === "undefined") return "light";
  try {
    const salvo = localStorage.getItem(THEME_KEY);
    if (ehTemaConhecido(salvo)) return salvo;
  } catch {
    /* localStorage indisponível */
  }
  // O SO só sabe pedir light/dark via prefers-color-scheme — caso especial,
  // não itera sobre NOMES_TEMA (um tema de marca não tem correspondente no SO).
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

/** Aplica no <html> sem persistir (usado pelo script de boot e internamente). */
export function aplicarTema(t: Tema): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", t);
  }
}

/** Persiste, aplica e avisa os outros controles montados. */
export function salvarTema(t: Tema): void {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* ignore */
  }
  aplicarTema(t);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ingenix-tema", { detail: t }));
  }
}
