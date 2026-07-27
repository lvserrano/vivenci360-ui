// Tema claro/escuro (INGENIX). A preferência fica em localStorage
// (`ingenix_theme`) e é aplicada como atributo `data-theme` no <html> — os
// tokens de cor do globals.css reagem.
//
// Obs.: localStorage é por-origem, então a escolha feita num app (ex.: o hub
// em muapp.com.br) NÃO atravessa para outro subdomínio (ex.:
// kanban.muapp.com.br) — cada um guarda a própria preferência. Isso explica
// um comportamento que parece bug e não é.
//
// O "sem flash" no primeiro paint é feito por um <script> inline no layout de
// cada app; aqui ficam os helpers usados pelos controles (ThemeToggle,
// Configurações).

export const THEME_KEY = "ingenix_theme";
export type Tema = "light" | "dark";

/** Lê a preferência salva; sem preferência, segue o tema do sistema operacional. */
export function temaInicial(): Tema {
  if (typeof window === "undefined") return "light";
  try {
    const salvo = localStorage.getItem(THEME_KEY);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    /* localStorage indisponível */
  }
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
