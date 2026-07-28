// Contrato do modo manutenção (ver `robot/core/manutencao.py` e
// `api/routers/manutencao.py` no repo `promo-robot`) — corta o contato com o
// Avanço (SSH + CIFS) sem derrubar a plataforma.
//
// Fonte da verdade real é o Pydantic `ManutencaoOut`/`ManutencaoIn` do backend;
// este tipo TS existe para o front não redeclarar o shape à mão. Mudou um lado,
// muda os dois no mesmo commit — ver `docs/arquitetura/contratos/manutencao.md`.

/** GET /manutencao e retorno de PUT /manutencao — espelha `ManutencaoOut`. */
export interface EstadoManutencao {
  ativo: boolean;
  motivo: string;
  por: string;
  iniciado_em: string | null;
  ate: string | null;
}

/** Corpo de PUT /manutencao — espelha `ManutencaoIn`. */
export interface DefinirManutencaoInput {
  ativo: boolean;
  motivo?: string;
  /** ISO ("2026-07-21T18:00:00"); omitido ou null = só sai na mão. */
  ate?: string | null;
}
