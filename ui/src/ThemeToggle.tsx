"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { temaInicial, salvarTema, TEMAS_META, type Tema } from "./tema";
import s from "./ThemeToggle.module.css";

// Lista de temas conhecidos, na ordem de exibição — derivada de TEMAS_META,
// nunca escrita à mão aqui. Um tema de marca novo (tokens.json > temas +
// entrada em TEMAS_META) aparece nas três variantes sem tocar neste arquivo.
const NOMES_TEMA = Object.keys(TEMAS_META) as Tema[];

/**
 * Alterna o tema do app entre os N temas definidos em tokens.json (hoje:
 * claro, escuro, OLED). Fica em sincronia com qualquer outra instância
 * montada (mesma origem) via evento `ingenix-tema`.
 *
 *  - variant="icon"    → botão redondo neutro, cicla entre os temas (default)
 *  - variant="sidebar" → botão redondo para uso dentro da sidebar escura
 *  - variant="segment" → controle rotulado, um botão por tema
 *  - variant="cards"   → um preview por tema, selecionável
 */
export default function ThemeToggle({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "sidebar" | "segment" | "cards";
  className?: string;
}) {
  const [tema, setTema] = useState<Tema>("light");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setTema(temaInicial());
    setMontado(true);
    const h = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener("ingenix-tema", h);
    return () => window.removeEventListener("ingenix-tema", h);
  }, []);

  function escolher(t: Tema) {
    setTema(t);
    salvarTema(t);
  }

  const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

  // Evita mismatch de hydration: só mostra o estado real depois de montar.
  if (!montado) {
    if (variant === "cards") {
      return <div className={cx(s.temaCards, className)} aria-hidden style={{ visibility: "hidden" }} />;
    }
    if (variant === "segment") {
      return <div className={cx(s.temaSeg, className)} aria-hidden style={{ visibility: "hidden" }} />;
    }
    const iconClass = variant === "sidebar" ? s.temaIconSidebar : s.temaIcon;
    return <button className={cx(iconClass, className)} aria-hidden style={{ visibility: "hidden" }} />;
  }

  if (variant === "cards") {
    return (
      <div className={cx(s.temaCards, className)} role="group" aria-label="Tema da interface">
        {NOMES_TEMA.map((t) => {
          const { rotulo, icone: Icone } = TEMAS_META[t];
          return (
            <button
              key={t}
              type="button"
              className={cx(s.temaCard, tema === t && s.on)}
              onClick={() => escolher(t)}
              aria-pressed={tema === t}
            >
              <div className={s.temaPrev} data-t={t}>
                <div className={s.temaPrevSide} />
                <div className={s.temaPrevMain}>
                  <div className={s.temaPrevBar} />
                  <div className={s.temaPrevLine} />
                  <div className={cx(s.temaPrevLine, s.short)} />
                </div>
              </div>
              <div className={s.temaCardFoot}>
                <Icone size={15} /> {rotulo}
                {tema === t && <Check size={15} className={s.temaCardCheck} />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "segment") {
    return (
      <div className={cx(s.temaSeg, className)} role="group" aria-label="Tema da interface">
        {NOMES_TEMA.map((t) => {
          const { rotulo, icone: Icone } = TEMAS_META[t];
          return (
            <button key={t} className={tema === t ? s.on : undefined} onClick={() => escolher(t)}>
              <Icone size={15} /> {rotulo}
            </button>
          );
        })}
      </div>
    );
  }

  const iconClass = variant === "sidebar" ? s.temaIconSidebar : s.temaIcon;
  const indiceAtual = NOMES_TEMA.indexOf(tema);
  const proximo = NOMES_TEMA[(indiceAtual + 1) % NOMES_TEMA.length];
  // Mostra o ícone do PRÓXIMO tema (affordance do que o clique faz), como o
  // botão de dois temas sempre fez — não o ícone do tema atual.
  const { icone: IconeProximo, rotulo: rotuloProximo } = TEMAS_META[proximo];
  return (
    <button
      className={cx(iconClass, className)}
      onClick={() => escolher(proximo)}
      title={`Mudar para tema ${rotuloProximo.toLowerCase()}`}
      aria-label={`Mudar para tema ${rotuloProximo.toLowerCase()}`}
    >
      <IconeProximo size={16} />
    </button>
  );
}
