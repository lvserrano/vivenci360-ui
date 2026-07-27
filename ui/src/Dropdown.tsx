"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
  dot?: string; // cor opcional de um marcador à esquerda
}

/**
 * Dropdown de seleção única no visual do design system (/estilo). Reutilizável;
 * substitui o <select> nativo por um botão + menu estilizado, theme-aware.
 *
 * O menu vai num portal com position:fixed para escapar de containers com
 * overflow:hidden (ex.: cards) — senão é cortado. Vira para cima quando falta
 * espaço abaixo.
 */
export default function Dropdown({
  value, options, onChange, ariaLabel, placeholder, style, disabled,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number }>({ left: 0, width: 0, maxH: 320 });
  const trigRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sel = options.find((o) => o.value === value);

  function reposition() {
    const t = trigRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 12;
    const spaceAbove = r.top - 12;
    const up = spaceBelow < 200 && spaceAbove > spaceBelow;
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      maxH: Math.min(320, up ? spaceAbove : spaceBelow),
    });
  }

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => reposition();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    function onDoc(e: MouseEvent) {
      const tgt = e.target as Node;
      if (trigRef.current?.contains(tgt)) return;
      if (menuRef.current?.contains(tgt)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <div className={styles.dd} style={style}>
      <button
        ref={trigRef}
        type="button"
        className={`${styles.btn}${open ? ` ${styles.open}` : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {sel?.dot && <span className={styles.dot} style={{ background: sel.dot }} />}
        <span className={styles.val}>{sel?.label ?? placeholder ?? "Selecione…"}</span>
        <ChevronDown size={16} className={styles.chev} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className={styles.menu}
          role="listbox"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`${styles.opt}${o.value === value ? ` ${styles.on}` : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.dot && <span className={styles.dot} style={{ background: o.dot }} />}
              <span className={styles.val}>{o.label}</span>
              {o.value === value && <Check size={15} className={styles.ok} />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
