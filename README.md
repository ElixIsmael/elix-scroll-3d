# elix-scroll-3d

Skill instalável de IA para construir sites com ambiente 3D animado por scroll que
sejam rápidos, indexáveis e realmente bons no celular.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Português

### A tese

Existe muito site 3D bonito e mal construído. Ele trava em aparelho médio, pesa
dezenas de megabytes, vai mal em Core Web Vitals e entrega um canvas vazio para o
Google. O efeito é real, mas a conta também.

Esta skill existe para provar que dá para ter o efeito **sem** pagar esse preço.
E, quando o 3D não se justifica, ela diz isso na cara: recomenda vídeo ou imagem
e explica a troca.

### O que ela faz

- **Desaconselha 3D quando não faz sentido.** Primeiro passo da skill, levado a
  sério. Se a resposta para "o que o 3D acrescenta?" é "fica bonito", a
  recomendação honesta é vídeo otimizado.
- **Exige que a mecânica demonstre o serviço.** Animação que só decora é peso
  morto. A skill cobra que o clímax da animação coincida com a chamada para ação.
- **Separa as duas famílias de cena** (procedural e com asset), que têm problemas
  completamente diferentes, e prefere procedural sempre que o resultado empata.
- **Impõe auditoria de modelo antes do download**: hierarquia nomeada, densidade
  contra tamanho na tela, escala, pivô e licença.
- **Define orçamento de performance antes da primeira linha de código**, com
  tiers de dispositivo e a regra de que o canvas nunca é o LCP.
- **Trata o celular como cenário principal**, não como adaptação final.
- **Cobre fallback, reduced motion e indexação**, porque canvas sem HTML
  equivalente é site invisível para o Google.

### Instalar

```bash
git clone https://github.com/ElixIsmael/elix-scroll-3d.git
cd elix-scroll-3d && ./install.sh
```

Reabra a sessão do Claude Code. A skill carrega sozinha quando o assunto aparece.

| Comando | O que faz |
|---|---|
| `./install.sh` | instala em `~/.claude`, vale para todos os projetos |
| `./install.sh --here` | instala em `./.claude`, só o projeto atual |
| `./install.sh --copy` | copia em vez de criar symlink, congela a versão |
| `./install.sh --remove` | desfaz, removendo só o que veio deste repositório |

**Outros agentes** (Cursor, Codex, Copilot, Gemini CLI): aponte para o
[AGENTS.md](AGENTS.md), sem instalar nada.

### Exemplo de uso

**Pergunta:** "Quero um hero 3D com nosso logo girando enquanto a pessoa rola."

**Resposta com a skill carregada:**

> Antes da técnica: o que o 3D acrescenta aqui que uma imagem não acrescentaria?
> Um logo girando é o caso clássico que falha nos três critérios. O visitante não
> aprende nada com o verso do logo, o espaço não é o produto, e a transformação
> não é o conteúdo.
>
> Recomendação: logo estático, ou um vídeo curto em loop se o movimento importa.
> Você economiza o modelo, o decoder, a lógica de tier, o caminho de fallback e
> o descarte de memória, e ganha uma página que carrega instantaneamente.
>
> Se o objetivo é impressionar no hero, existe uma alternativa que se paga:
> uma mecânica que demonstre o que vocês fazem. Me diz qual é o serviço e eu
> proponho uma.

Esse é o comportamento pretendido. Uma skill que só sabe dizer sim para 3D é uma
skill que produz sites lentos.

### Predefinições por mecânica

Organizadas por mecânica de cena, não por ramo do cliente. A mecânica determina o
pipeline, o custo e as armadilhas. O ramo não determina nada.

| Mecânica | Pipeline | Boa em demonstrar | Armadilha principal |
|---|---|---|---|
| Revelação por máscara | Procedural | Antes e depois, transformação de superfície | Borda perfeita denuncia o efeito |
| Travelling por curva | Qualquer | Jornada, processo com etapas | Amostragem por comprimento de arco |
| Objeto orbitado | Com asset | Acabamento, detalhe físico | Peso do modelo, custo de luz |
| Explosão de montagem | Com asset, hierarquia obrigatória | Engenharia interna | Malha mesclada não tem conserto em código |
| Cena explorável | Híbrido | O espaço como produto | Escopo, e o visitante se perder |
| Transformação de estado | Qualquer | Configurabilidade | Morph target é caro, estados intermediários precisam fechar |

### Estrutura

```
.
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── AGENTS.md
├── install.sh
└── skills/elix-scroll-3d/
    ├── SKILL.md
    └── references/
        ├── decision.md         quando 3D vale a pena, e o que a mecânica prova
        ├── pipelines.md        cena procedural x cena com asset
        ├── budget.md           orçamento e tiers de dispositivo
        ├── asset-audit.md      como avaliar um modelo antes de baixar
        ├── assets.md           exportação, compressão e formato
        ├── choreography.md     padrões de animação por scroll e câmera
        ├── mobile.md           gesto, toque e degradação
        ├── fallback-seo.md     conteúdo real, reduced motion e indexação
        ├── presets.md          predefinições por mecânica
        └── checklist.md        checklist de entrega
```

### Funciona sozinha

Esta skill é especializada: cuida só do que é específico de 3D e animação por
scroll. Ela assume que o cuidado geral com SEO, acessibilidade e identidade
visual é tratado em outro lugar, e funciona sem depender disso.

Foi pensada para acompanhar uma skill base de frontend e SEO, o `elix-front`,
ainda não publicada. O link entra aqui quando ela sair.

### Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Correção de erro técnico e armadilha
encontrada em projeto real são especialmente bem-vindas. Número medido vale mais
que número estimado: se você mediu, mande a medição e o aparelho.

### Licença

MIT. Veja [LICENSE](LICENSE).

---

## English

### The thesis

There are a lot of beautiful, badly built 3D websites. They stutter on mid-range
hardware, ship tens of megabytes, fail Core Web Vitals, and hand Google an empty
canvas. The effect is real, and so is the bill.

This skill exists to get the effect without the bill. And when 3D is not
justified, it says so: it recommends video or an image and explains the trade.

### What it does

- **Advises against 3D when it does not belong.** First step of the skill, taken
  seriously. If the answer to "what does 3D add" is "it looks impressive", the
  honest recommendation is an optimized video.
- **Requires the mechanic to demonstrate the service.** Decorative animation is
  dead weight. The skill requires the climax to coincide with the call to action.
- **Separates the two scene families** (procedural and asset-based), which have
  completely different failure modes, and prefers procedural whenever the result
  is equivalent.
- **Imposes a model audit before download**: named hierarchy, density against
  on-screen size, scale, pivot, and license.
- **Sets a performance budget before the first line of code**, with device tiers
  and the rule that the canvas is never the LCP.
- **Treats mobile as the main setting**, not as a final adaptation.
- **Covers fallback, reduced motion, and indexing**, because a canvas without
  equivalent HTML is a site that is invisible to Google.

### Install

```bash
git clone https://github.com/ElixIsmael/elix-scroll-3d.git
cd elix-scroll-3d && ./install.sh
```

Reopen your Claude Code session. The skill loads on its own when the topic comes
up. Use `--here` to install into the current project only, `--copy` to freeze the
version instead of symlinking, and `--remove` to undo.

Other agents (Cursor, Codex, Copilot, Gemini CLI): point them at
[AGENTS.md](AGENTS.md), no installation required.

### Presets by mechanic

Organized by scene mechanic, not by client industry. The mechanic determines the
pipeline, the cost, and the traps. The industry determines nothing.

| Mechanic | Pipeline | Good at demonstrating | Main trap |
|---|---|---|---|
| Mask reveal | Procedural | Before and after, surface transformation | A perfect edge announces the effect |
| Curve travelling | Either | A journey, a process with stages | Arc length sampling |
| Orbited object | Asset | Craft, physical detail | Model weight, lighting cost |
| Assembly explosion | Asset, hierarchy required | Internal engineering | A merged mesh cannot be fixed in code |
| Explorable scene | Hybrid | Space as the product | Scope, and visitors getting lost |
| State transformation | Either | Configurability | Morph targets are expensive |

### It works on its own

This skill is specialized: it covers only what is specific to 3D and scroll
animation. It assumes general SEO, accessibility, and visual identity are handled
elsewhere, and it works without depending on that.

It was designed to sit alongside a base frontend and SEO skill, `elix-front`,
which is not published yet. The link goes here when it is.

### Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT, see [LICENSE](LICENSE). Measured
numbers are worth more than estimates: if you measured it, send the measurement
and the device.

---

<sub>Built by [Elix Sites](https://elixsites.com.br).</sub>
