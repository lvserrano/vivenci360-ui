# Catálogo — packages/ui

Lista dos primitivos compartilhados entre `promo-robot-web` e `ingenix-marketing`.
Antes de criar qualquer componente novo, rode `./scripts/existe.sh "<nome>"` na raiz
do workspace — se o conceito já estiver aqui, estenda em vez de criar de novo.

## Contrato com o app hospedeiro

`packages/ui` **não tem `package.json`**, por decisão — o submodule é montado
dentro do app (`packages/`), e um `package.json` ali criaria fronteira de pacote
e competiria com o alias `@vivenci360/ui`, que hoje vem de `tsconfig.json`
(`compilerOptions.paths`), não de resolução de módulo npm.

Por isso os primitivos assumem `react`, `react-dom` e `lucide-react` já
instalados no app hospedeiro — resolvidos por `node_modules` acima na árvore,
não por dependência declarada aqui. A paridade dessas versões entre
`promo-robot-web` e `ingenix-marketing` **não é verificada hoje** — isso é o
passo 24b do roadmap.

Reavaliar `peerDependencies` só se `packages/ui` passar a ser consumido fora
da árvore do app (ex.: publicado em registry) — hoje isso não se aplica e
declarar seria documentação sem enforcement real.

## Dropdown

`import { Dropdown } from "@vivenci360/ui";`

Seleção única no visual do design system — substitui `<select>` nativo por
botão + menu estilizado, theme-aware (usa os tokens de `packages/tokens`).
O menu renderiza num portal (`position: fixed`) para escapar de containers
com `overflow: hidden`; vira pra cima quando falta espaço abaixo.

```tsx
<Dropdown
  value={valor}
  options={[{ value: "a", label: "Opção A" }]}
  onChange={setValor}
/>
```

Tipo `DropdownOption` (`{ value, label, dot? }`) também exportado.

**Quando usar:** qualquer seleção única de uma lista curta/média (dezenas de
itens, não centenas — não pagina nem tem busca embutida).
**Quando não usar:** múltipla seleção, lista muito longa com busca, ou campo
de data (isso é o `DatePicker`, ainda não unificado).

**Estilo:** CSS próprio, autossuficiente (`Dropdown.module.css`, ao lado do
componente) — não depende de classe global de nenhum app consumidor, conforme
ADR 0003 ("Regra geral — autossuficiência"). O estado `:disabled` e o
`min-width: 0` em `.val` (necessário pro `text-overflow: ellipsis` funcionar
dentro do flex) vieram da versão do `ingenix-marketing`, que tinha os dois e
o `promo-robot-web` não; entraram na união, não são opcionais. Ver passo 20b
do PLANO-ARQUITETURA.md.

## ThemeToggle

`import { ThemeToggle } from "@vivenci360/ui";`

Alterna o tema claro/escuro do app. Fica em sincronia com qualquer outra
instância montada na mesma origem via evento `ingenix-tema`.

```tsx
<ThemeToggle />
<ThemeToggle variant="sidebar" />
<ThemeToggle variant="segment" />
<ThemeToggle variant="cards" />
```

Quatro variantes:

- `"icon"` (default) — botão redondo neutro. É o default porque é o único que
  não pressupõe o fundo em que está montado; funciona sobre qualquer app.
- `"sidebar"` — botão redondo para uso **dentro da sidebar escura** (usa
  `--sidebar-hover` / `--sidebar-text-active`); fora desse contexto, use
  `"icon"`.
- `"segment"` — controle Claro/Escuro rotulado, dois botões lado a lado.
- `"cards"` — dois previews de tema (claro/escuro) selecionáveis, usados em
  telas de Configurações/Aparência.

`className?: string` concatena em todas as variantes.

`tema.ts` viaja junto com o componente (`temaInicial`, `salvarTema`,
`aplicarTema`, `THEME_KEY`, tipo `Tema`, todos exportados pelo barrel) porque é
a lógica inteira do `ThemeToggle` — sem ela o primitivo importaria do app que
o consome, dependência invertida. `THEME_KEY` (`"ingenix_theme"`) e o evento
(`"ingenix-tema"`) são contrato de runtime entre os apps (ver `docs/NOMES.md`)
e não são renomeáveis.

**Estilo:** `ThemeToggle.module.css`, autossuficiente, sem cor literal — as
cores fixas do preview de `variant="cards"` (que não reagem a `data-theme`,
porque mostram os dois temas ao mesmo tempo) vêm do bloco `invariante` de
`tokens.json` (`--preview-light-*`, `--preview-dark-*`, `--on-accent`).

## DatePicker

`import { DatePicker } from "@vivenci360/ui";`

Calendário próprio (substitui `<input type="date">` nativo, que não pode ser
estilizado). Valor sempre ISO `"YYYY-MM-DD"`.

```tsx
<DatePicker value={data} onChange={setData} placeholder="dd/mm/aaaa" />
```

Assinatura: `{ value, onChange, placeholder? }` — sem `className`, sem props
extras. Nenhum call site (20, nos dois apps) precisa de mais que isso.

O popup abre num portal (`position: fixed`, escapa de containers com
`overflow: hidden`) e faz **clamp vertical automático**: abre para baixo por
padrão e, se não couber até o fim da janela, abre para cima. Isso é
comportamento padrão do componente, não uma prop — quem precisar de "sempre
abre pra baixo" está pedindo de volta o bug que a versão antiga do
`promo-robot-web` tinha (calendário cortado perto do rodapé da tela).

**Estilo:** `DatePicker.module.css`, autossuficiente, sem cor literal. O
destaque do dia selecionado (`--accent-grad` + `var(--on-accent)`) usa sombra
fixa `--shadow-accent` (bloco `invariante` de `tokens.json`) — não confundir
com `--shadow-glow`, que varia por tema e serve a outro propósito. A fonte do
`dp-input` é `inherit` (o primitivo não fixa família de fonte; os apps
hospedeiros já usam Inter no `body`).

## Modal

`import { Modal, BotaoModal, PromptModal, ConfirmModal } from "@vivenci360/ui";`

Quatro exports, não um componente só. Substitui overlay nativo — base é a
implementação que já existia no `ingenix-marketing` (ver ADR 0003, seção
Modal, e a emenda de 2026-07-27 com as cinco correções do passo 23).

```tsx
<Modal titulo="Excluir item" icone={<Trash2 size={16} />} tone="danger" onClose={fechar}>
  conteúdo…
</Modal>

<ConfirmModal titulo="Excluir setor" mensagem="Esta ação não pode ser desfeita." onConfirm={excluir} onClose={fechar} />
<PromptModal titulo="Renomear" label="Novo nome" onConfirm={renomear} onClose={fechar} />
<BotaoModal variante="danger" onClick={excluir}>Excluir</BotaoModal>
```

Assinatura: `Modal({ titulo, icone?, tone?, onClose, children, footer? })`.
Sem `largura` (só existe uma largura, 440px — nenhum dos 18 call sites pedia
outra) e sem `scrollável?` (o corpo rolável com cabeçalho/rodapé fixos é
comportamento padrão, sempre ligado — não é opcional porque uma opção
desligada por engano reintroduz o modal que estoura a viewport).

**Não fecha ao clicar no fundo — só por `Esc` e pelo `×`.** Decisão
deliberada, não herança acidental: pelo menos quatro modais da plataforma têm
campo de senha (exclusão, remoção de item, deploy, super-admin) e outros têm
formulário preenchido à mão; um clique errado no overlay descartaria o que
foi digitado, sem confirmação. Ver ADR 0003, emenda do passo 23, item 3.

**Estilo:** `Modal.module.css`, autossuficiente — os `@keyframes` de entrada
(`modalFadeIn`, `modalCardIn`) vivem dentro do módulo, não em `globals.css` de
app nenhum. Cores via tokens do bloco `invariante` (`--overlay`,
`--shadow-modal`, `--shadow-accent-lg`, `--on-accent`). Largura fixa em 440px.
