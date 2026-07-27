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
