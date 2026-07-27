"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Check } from "lucide-react";
import { temaInicial, salvarTema, type Tema } from "./tema";
import s from "./ThemeToggle.module.css";

/**
 * Alterna o tema claro/escuro do app. Fica em sincronia com qualquer outra
 * instância montada (mesma origem) via evento `ingenix-tema`.
 *
 *  - variant="icon"    → botão redondo neutro, funciona sobre qualquer fundo (default)
 *  - variant="sidebar" → botão redondo para uso dentro da sidebar escura
 *  - variant="segment" → controle Claro/Escuro rotulado
 *  - variant="cards"   → dois previews de tema selecionáveis
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
        {(["light", "dark"] as Tema[]).map((t) => (
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
              {t === "light" ? <Sun size={15} /> : <Moon size={15} />} {t === "light" ? "Claro" : "Escuro"}
              {tema === t && <Check size={15} className={s.temaCardCheck} />}
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "segment") {
    return (
      <div className={cx(s.temaSeg, className)} role="group" aria-label="Tema da interface">
        <button className={tema === "light" ? s.on : undefined} onClick={() => escolher("light")}>
          <Sun size={15} /> Claro
        </button>
        <button className={tema === "dark" ? s.on : undefined} onClick={() => escolher("dark")}>
          <Moon size={15} /> Escuro
        </button>
      </div>
    );
  }

  const iconClass = variant === "sidebar" ? s.temaIconSidebar : s.temaIcon;
  return (
    <button
      className={cx(iconClass, className)}
      onClick={() => escolher(tema === "dark" ? "light" : "dark")}
      title={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
