"use client";

/**
 * components/Modal.tsx — modal da plataforma (padrão /estilo): overlay com blur,
 * animação de entrada, cabeçalho com ícone, corpo e rodapé. Substitui os window.prompt
 * do navegador. `PromptModal` = modal de UM campo (texto/textarea) com confirmar/cancelar.
 */
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import s from "./Modal.module.css";

export function Modal({
  titulo, icone, tone = "brand", onClose, children, footer,
}: {
  titulo: string;
  icone?: React.ReactNode;
  tone?: "brand" | "danger";
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className={s.overlay}>
      <div className={s.modal} role="dialog" aria-modal="true">
        <div className={s.head}>
          {icone && <div className={`${s.ico} ${tone === "danger" ? s.icoDanger : s.icoBrand}`}>{icone}</div>}
          <strong className={s.titulo}>{titulo}</strong>
          <button className={s.x} onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>
        <div className={s.body}>{children}</div>
        {footer && <div className={s.foot}>{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Botão de rodapé de modal. O ConfirmModal/PromptModal já montam o seu, mas quem precisa de um
 * corpo próprio (ex.: o "Repassar", que tem um <Dropdown> dentro) monta o `footer` à mão — e aí
 * repetia as classes de cor na mão, saindo do padrão. Este é o rodapé oficial: use sempre ele.
 */
export function BotaoModal({
  variante = "primary", children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primary" | "danger" | "ghost" }) {
  const cls = variante === "danger" ? s.btnDanger : variante === "ghost" ? s.btnGhost : s.btnPrimary;
  return <button className={`${s.btn} ${cls}`} {...props}>{children}</button>;
}

export function PromptModal({
  titulo, icone, tone = "brand", label, placeholder, inicial = "", multiline = false,
  type = "text", obrigatorio = false, confirmarLabel = "Confirmar", onConfirm, onClose,
}: {
  titulo: string;
  icone?: React.ReactNode;
  tone?: "brand" | "danger";
  label?: string;
  placeholder?: string;
  inicial?: string;
  multiline?: boolean;
  type?: string;            // tipo do input (ex.: "datetime-local" p/ agendar publicação)
  obrigatorio?: boolean;
  confirmarLabel?: string;
  onConfirm: (valor: string) => void;
  onClose: () => void;
}) {
  const [valor, setValor] = useState(inicial);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const invalido = obrigatorio && !valor.trim();
  const confirmar = () => { if (!invalido) onConfirm(valor.trim()); };

  return (
    <Modal titulo={titulo} icone={icone} tone={tone} onClose={onClose} footer={
      <>
        <button className={`${s.btn} ${s.btnGhost}`} onClick={onClose}>Cancelar</button>
        <button className={`${s.btn} ${tone === "danger" ? s.btnDanger : s.btnPrimary}`} onClick={confirmar} disabled={invalido}>{confirmarLabel}</button>
      </>
    }>
      {label && <label className={s.campoLabel}>{label}</label>}
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>} className={s.campo} rows={3}
          value={valor} placeholder={placeholder} onChange={(e) => setValor(e.target.value)}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>} className={s.campo} type={type}
          value={valor} placeholder={placeholder} onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
        />
      )}
    </Modal>
  );
}

/**
 * ConfirmModal — confirmação de UMA ação (substitui o window.confirm nativo do browser).
 * Rodapé com Cancelar + botão de confirmar (danger p/ exclusões, brand p/ o resto).
 */
export function ConfirmModal({
  titulo, mensagem, icone, tone = "danger", confirmarLabel = "Confirmar", onConfirm, onClose,
}: {
  titulo: string;
  mensagem?: React.ReactNode;
  icone?: React.ReactNode;
  tone?: "brand" | "danger";
  confirmarLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal titulo={titulo} icone={icone} tone={tone} onClose={onClose} footer={
      <>
        <button className={`${s.btn} ${s.btnGhost}`} onClick={onClose}>Cancelar</button>
        <button className={`${s.btn} ${tone === "danger" ? s.btnDanger : s.btnPrimary}`} onClick={onConfirm}>{confirmarLabel}</button>
      </>
    }>
      {/* Um único bloco: sem isto o `.body` (display:grid) joga cada trecho de texto/<b> numa linha. */}
      <p className={s.mensagem}>{mensagem}</p>
    </Modal>
  );
}
