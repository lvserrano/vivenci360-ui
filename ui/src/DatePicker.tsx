"use client";

/**
 * DatePicker — calendário próprio no padrão /estilo (substitui o <input type="date">
 * nativo, que não pode ser estilizado). Valor no formato ISO "YYYY-MM-DD".
 *
 * O popup vai num portal com position:fixed para escapar de containers com
 * overflow:hidden (ex.: .wizard-card), senão o calendário é cortado.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./DatePicker.module.css";

const MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];
const POP_W = 288;
const POP_H = 340; // altura aprox. do popup (cabeçalho + grade + rodapé) p/ decidir abrir ↑/↓

function pad(n: number) { return String(n).padStart(2, "0"); }

// "YYYY-MM-DD" → { y, m (0-based), d }; nulo se vazio/inválido. Sem passar por
// new Date(iso) pra não cair no fuso UTC.
function parseISO(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function buildDays(y: number, m: number) {
  const first = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const prevDim = new Date(y, m, 0).getDate();
  const cells: { d: number; cur: boolean }[] = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ d: prevDim - i, cur: false });
  for (let d = 1; d <= dim; d++) cells.push({ d, cur: true });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ d: nd++, cur: false });
  return cells;
}

interface Props {
  value: string;                    // "YYYY-MM-DD" | ""
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa" }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const trigRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const sel = parseISO(value);
  const hoje = new Date();
  const today = { y: hoje.getFullYear(), m: hoje.getMonth(), d: hoje.getDate() };

  // mês em exibição — parte do valor selecionado ou de hoje.
  const [view, setView] = useState(() => sel ? { y: sel.y, m: sel.m } : { y: today.y, m: today.m });

  // posiciona o popup pelo retângulo do botão, com clamp pra não sair da tela.
  function reposition() {
    const t = trigRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    let left = r.left;
    if (left + POP_W > window.innerWidth - 8) left = window.innerWidth - POP_W - 8;
    if (left < 8) left = 8;
    // Abre pra baixo; se não couber até o fim da janela (campo perto do rodapé), abre pra cima.
    // Assim o calendário não fica cortado pela borda inferior da tela.
    const alturaPop = popRef.current?.offsetHeight || POP_H;
    let top = r.bottom + 6;
    if (top + alturaPop > window.innerHeight - 8) {
      const acima = r.top - alturaPop - 6;
      top = acima >= 8 ? acima : Math.max(8, window.innerHeight - alturaPop - 8);
    }
    setCoords({ top, left });
  }

  // ao abrir: sincroniza a visão com o valor e posiciona.
  useLayoutEffect(() => {
    if (!open) return;
    if (sel) setView({ y: sel.y, m: sel.m });
    reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // acompanha scroll/resize enquanto aberto; fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const onMove = () => reposition();
    function onDoc(e: MouseEvent) {
      const tgt = e.target as Node;
      if (trigRef.current?.contains(tgt)) return;
      if (popRef.current?.contains(tgt)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  function shiftMonth(delta: number) {
    setView((c) => {
      let m = c.m + delta, y = c.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  }

  function pick(d: number) {
    onChange(`${view.y}-${pad(view.m + 1)}-${pad(d)}`);
    setOpen(false);
  }

  const dias = buildDays(view.y, view.m);

  return (
    <div className={styles.dp}>
      <button ref={trigRef} type="button" className={`${styles.dpInput}${open ? ` ${styles.open}` : ""}`} onClick={() => setOpen((o) => !o)}>
        <span className={value ? undefined : styles.dpPh}>
          {sel ? `${pad(sel.d)}/${pad(sel.m + 1)}/${sel.y}` : placeholder}
        </span>
        <Calendar size={15} className={styles.dpIc} />
      </button>

      {open && createPortal(
        <div ref={popRef} className={styles.dpPop} style={{ top: coords.top, left: coords.left }}>
          <div className={styles.dpHead}>
            <span className={styles.dpMonth}>{MES[view.m]} {view.y}</span>
            <div className={styles.dpNav}>
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className={styles.dpGrid}>
            {DOW.map((d, i) => <span key={i} className={styles.dpDow}>{d}</span>)}
            {dias.map((c, i) => {
              const isSel = c.cur && sel?.y === view.y && sel?.m === view.m && sel?.d === c.d;
              const isToday = c.cur && today.y === view.y && today.m === view.m && today.d === c.d;
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dpDay}${!c.cur ? ` ${styles.muted}` : ""}${isSel ? ` ${styles.sel}` : ""}${isToday && !isSel ? ` ${styles.today}` : ""}`}
                  onClick={() => c.cur && pick(c.d)}
                  disabled={!c.cur}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
          <div className={styles.dpFoot}>
            <button type="button" className={styles.dpLink} onClick={() => { onChange(""); setOpen(false); }}>Limpar</button>
            <button type="button" className={styles.dpLink} onClick={() => { onChange(`${today.y}-${pad(today.m + 1)}-${pad(today.d)}`); setOpen(false); }}>Hoje</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
