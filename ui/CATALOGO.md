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

`import { ThemeToggle, TEMAS_META } from "@vivenci360/ui";`

Alterna entre os **N temas** definidos em `tokens.json` (passo 35: `light`,
`dark`, `oled` — deixou de ser um par claro/escuro fixo). Fica em sincronia
com qualquer outra instância montada na mesma origem via evento
`ingenix-tema`.

```tsx
<ThemeToggle />
<ThemeToggle variant="sidebar" />
<ThemeToggle variant="segment" />
<ThemeToggle variant="cards" />
```

Quatro variantes:

- `"icon"` (default) — botão redondo neutro que **cicla** pela lista de temas
  (próximo item, com wrap), mostrando o ícone do tema para o qual vai mudar
  (affordance do clique, não o tema atual). É o default porque é o único que
  não pressupõe o fundo em que está montado; funciona sobre qualquer app.
- `"sidebar"` — mesmo ciclo, botão redondo para uso **dentro da sidebar
  escura** (usa `--sidebar-hover` / `--sidebar-text-active`); fora desse
  contexto, use `"icon"`.
- `"segment"` — um botão rotulado por tema, lado a lado (hoje três: Claro,
  Escuro, OLED).
- `"cards"` — um preview por tema, selecionável (hoje três lado a lado), usado
  em telas de Configurações/Aparência.

`className?: string` concatena em todas as variantes.

A lista de temas e a ordem de exibição **nunca são escritas à mão** no
componente — vêm de `Object.keys(TEMAS_META)`, que por sua vez deriva de
`tokens.json > temas` via `keyof typeof temas`. Um tema de marca novo entra
adicionando a chave em `tokens.json` e uma entrada em `TEMAS_META` (rótulo
PT-BR + ícone lucide); nenhuma das quatro variantes do `ThemeToggle.tsx`
precisa ser tocada.

`tema.ts` viaja junto com o componente (`temaInicial`, `salvarTema`,
`aplicarTema`, `THEME_KEY`, `TEMAS_META`, tipo `Tema`, todos exportados pelo
barrel) porque é a lógica inteira do `ThemeToggle` — sem ela o primitivo
importaria do app que o consome, dependência invertida. `THEME_KEY`
(`"ingenix_theme"`) e o evento (`"ingenix-tema"`) são contrato de runtime
entre os apps (ver `docs/NOMES.md`) e não são renomeáveis. `TEMAS_META` é
`Record<Tema, { rotulo: string; icone: LucideIcon }>` — hoje `light` = Sun
"Claro", `dark` = Moon "Escuro", `oled` = MoonStar "OLED".

**Estilo:** `ThemeToggle.module.css`, autossuficiente, sem cor literal — as
cores fixas do preview de `variant="cards"` (que não reagem a `data-theme`,
porque cada card mostra um tema fixo independente do tema em que o app está)
vêm do bloco `invariante` de `tokens.json` (`--preview-light-*`,
`--preview-dark-*`, `--preview-oled-*`, `--on-accent`). O grid de `"cards"`
é `repeat(3, 1fr)` — adicionar um quarto tema exige checar o `max-width` do
`.temaCards`, que não é derivado automaticamente da contagem de temas.

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

## O que NÃO é primitivo (e por quê)

Anti-catálogo. Fonte única do que **deliberadamente** não vira componente
compartilhado — existe para que o passo 2 do Protocolo (CLAUDE.md) e o `/estilo`
gerado (passo 25) não tratem a ausência como lacuna a preencher. Se algo está
aqui, a decisão de não subir para `packages/ui` já foi tomada; não recrie.

- **`Button` / `Input`** — HTML nativo (`<button>`, `<input>`) mais os tokens já
  resolve; não há primitivo e não se cria um. Estilizar é aplicar token, não
  embrulhar em componente.
- **`Table`, `Toast`** — zero uso em produção; não existem no produto. Não se
  cria primitivo para caso hipotético (prop e componente nascem de call site
  real, nunca de previsão).
- **`chips`, `segmented`, `wizard`, `stepper`, `hub-cards`** — composição de
  domínio (Camada 3 da Seção 3.1 do PLANO-ARQUITETURA.md): fica no app, não sobe
  para `packages/ui` enquanto **dois** apps não usarem o mesmo. Vários deles são
  o que o passo 25 vai remover do `/estilo`, porque demonstram o que o produto
  não tem em vez de documentar o que ele tem.
- **`.modal*` e `.cal*` soltos em CSS de app** — são duplicatas já unificadas em
  `Modal` e `DatePicker` (passos 20/23). O que sobrou solto num `globals.css` é
  resíduo a remover, não fonte a recriar.

Regra geral: composição de domínio (ex.: `Sidebar` da plataforma, `Board` do
Kanban) fica no app. Só vira primitivo quando **dois** apps usam de fato — regra
anti-abstração-prematura, Seção 3.1 Camada 3 do PLANO-ARQUITETURA.md. Um app só
usando não justifica a subida; justifica manter no `components/` do próprio app.

## Tokens

Os tokens **não** são reproduzidos em tabela aqui — tabela copiada à mão vira
documentação que apodrece e diverge da fonte. Ponteiro único:

- Fonte: `@vivenci360/tokens` — `packages/tokens/tokens.json` é a fonte, e
  `dist/tokens.css` / `dist/tokens.ts` são **gerados** por `node tokens/build.mjs`
  (nunca editados à mão).
- A tabela legível dos tokens é **renderizada a partir deles** na rota `/estilo`
  (passo 25), a partir do `dist` gerado — não daqui.
- Nome de token é semântico, nunca cromático (`--accent`, `--surface`, `--text`;
  jamais `--indigo`, `--verde`). Cor fixa por definição (previews de tema,
  gradiente de accent) mora no bloco `invariante` do `tokens.json`, não vira
  exceção à proibição de cor literal.
- Nenhum `#hex`, `rgb(`, `rgba(` ou `hsl(` fora de `tokens.json`.

**Schema é N-temas nomeados (passo 34).** `tokens.json` tem `invariante` (como
sempre) e `temas`, um objeto chaveado por nome de tema. Uma chave
`_tema_padrao` (`"light"`) diz qual tema é aplicado em `:root` sem
`data-theme`.

**Passo 35 — paleta de marca.** A paleta índigo/roxo placeholder (`#6366F1`)
saiu de `temas.light`/`temas.dark` e entrou a paleta oficial Vivenci
(vermelho `#B61615`, Pantone 187 — monocromática, ver
`docs/marca/fontes-da-marca.md`), com `temas.oled` **novo**. Não é mais "só
light e dark": são três temas, todos na paleta de marca. `build.mjs` passou a
rodar uma checagem de contraste WCAG AA no build (falha com `process.exit(1)`
listando o par culpado) — por causa dela, dois valores do preview aprovado em
`docs/marca/sistema-visual.html` foram levemente ajustados (não afrouxados):
`temas.dark`/`temas.oled` `--accent` é `#C94741` em vez do `#E86A67` do
preview (branco sobre `#E86A67` dava 3.14:1, abaixo do mínimo 4.5:1 exigido
para `--on-accent`/`--accent`), e `temas.light.text-subtle` é `#898993` em vez
de `#8E8E98` (2.98:1 contra `--bg`, abaixo do mínimo 3.0:1 do próprio token,
que é decorativo). Ver o comentário `_comentario_passo35` em `tokens.json`
para os números completos.

Tokens novos, todos por tema: `mv` / `mv-bg` / `mv-border` — o azul-fosco
"movido", único tom fora da paleta vermelho/preto/branco da marca, reservado a
**estado categórico de dado** (não é accent, não decora UI). Bloco
`invariante` ganhou `--preview-oled-bg` / `--preview-oled-panel` /
`--preview-oled-panel-border`, mesmo papel dos `--preview-light-*` /
`--preview-dark-*` já existentes — cor fixa por definição, não reage a
`data-theme`, consumida pelo `ThemeToggle` em `variant="cards"`.

Consequência em `dist/`:

- `dist/tokens.css` ganha um bloco `:root[data-theme="<nome>"]` **para cada**
  tema em `temas` (inclusive `"light"`, que antes só existia implícito no
  `:root` default — agora também tem bloco explícito, redundante de propósito:
  permite `data-theme="light"` funcionar mesmo quando `_tema_padrao` mudar no
  futuro). O `@media (prefers-color-scheme: dark)` do fallback anti-flash
  continua fixo em `temas.dark` — é um caso especial documentado, não participa
  da iteração genérica, porque o SO só sabe pedir `light`/`dark`, nunca um tema
  de marca.
- `dist/tokens.ts` exporta `temas` (record por nome) e `type Tema = keyof
  typeof temas`. `tokensClaro`/`tokensEscuro`/`tokensDoTema` continuam
  exportados e funcionando (agora como aliases de `temas.light` / `temas.dark`),
  para não quebrar `/estilo` e `login/page.tsx`.
- `ui/src/tema.ts` deriva `type Tema` de `dist/tokens.ts` (`keyof typeof
  temas`) em vez de `"light" | "dark"` hardcoded; `temaInicial` valida contra o
  conjunto de nomes conhecidos (`Object.keys(temas)`), não mais por comparação
  literal dupla. `THEME_KEY` (`"ingenix_theme"`) e o evento `"ingenix-tema"`
  **não mudam** — são identificadores de runtime legados intocáveis.

**Para adicionar um tema novo no futuro:** uma chave nova em `tokens.json` >
`temas` (com todas as chaves que `light`/`dark` têm hoje) + `node
tokens/build.mjs`. Nenhum outro arquivo precisa mudar para o tema aparecer em
`dist/tokens.css` e em `dist/tokens.ts`; só precisa mudar código de app se
aquele app quiser **oferecer** o tema novo como opção de UI (isso é passo 35,
fora do escopo daqui).
