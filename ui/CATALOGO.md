# Catálogo — packages/ui

Lista dos primitivos compartilhados entre `promo-robot-web` e `ingenix-marketing`.
Antes de criar qualquer componente novo, rode `./scripts/existe.sh "<nome>"` na raiz
do workspace — se o conceito já estiver aqui, estenda em vez de criar de novo.

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

**Estilo:** as classes `.ig-dd*` que o componente usa vivem no `globals.css`
de cada app consumidor, não aqui — o primitivo não traz CSS embutido.
Atenção: hoje há uma divergência conhecida entre os dois apps nessas classes
(`ingenix-marketing` tem estado `:disabled` e `min-width:0` em `.ig-dd-val`
que o `promo-robot-web` não tem) — não foi reconciliada na unificação deste
componente, ver PLANO-ARQUITETURA.md passo 20.
