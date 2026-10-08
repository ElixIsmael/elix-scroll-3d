# elix-scroll-3d

An installable AI skill for scroll-driven 3D websites that stay fast, indexable,
and genuinely usable on mid-range phones.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Claude Code](https://img.shields.io/badge/Claude_Code-skill-D97757)
![AGENTS.md](https://img.shields.io/badge/AGENTS.md-Cursor_·_Codex_·_Copilot_·_Gemini-555)

**English** · [Português](#português)

---

## The thesis

There are a lot of beautiful, badly built 3D websites. They stutter on mid-range
hardware, ship tens of megabytes, fail Core Web Vitals, and hand Google an empty
canvas. The effect is real, and so is the bill.

This skill exists to get the effect without the bill. And when 3D is not
justified, it says so: it recommends video or an image and explains the trade.

## What it looks like in practice

**Prompt:** "I want a 3D hero with our logo spinning as the visitor scrolls."

**Response with the skill loaded:**

> Before technique: what does 3D add here that an image would not?
> A spinning logo is the classic case that fails all three tests. The visitor
> learns nothing from the back of the logo, the space is not the product, and
> the transformation is not the content.
>
> Recommendation: a static logo, or a short looping video if the motion matters.
> You save the model, the decoder, the tier logic, the fallback path, and the
> memory cleanup, and you get a page that loads instantly.
>
> If the goal is to impress in the hero, there is an alternative that pays for
> itself: a mechanic that demonstrates what you do. Tell me the service and I
> will propose one.

That is the intended behavior. A skill that can only say yes to 3D is a skill
that produces slow websites.

## What it does

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

Reference stack is Three.js plus GSAP ScrollTrigger. The budget, degradation,
and fallback principles are written to survive a change of library.

## Install

```bash
git clone https://github.com/ElixIsmael/elix-scroll-3d.git
cd elix-scroll-3d && ./install.sh
```

Reopen your Claude Code session. The skill loads on its own when the topic comes
up: scroll animation, a Three.js scene, a GLB model on a page, scrollytelling, or
a 3D page that is slow on mobile.

| Command | What it does |
|---|---|
| `./install.sh` | installs into `~/.claude`, applies to every project |
| `./install.sh --here` | installs into `./.claude`, this project only |
| `./install.sh --copy` | copies instead of symlinking, freezing the version |
| `./install.sh --remove` | undoes it, removing only what this repo installed |

**Other agents** (Cursor, Codex, Copilot, Gemini CLI): nothing to install, just
point the agent at [AGENTS.md](AGENTS.md).

**Not for:** games, VR or AR, scientific data visualization, or a brochure site
that does not need 3D at all.

## Presets by mechanic

Organized by scene mechanic, not by client industry. The mechanic determines the
pipeline, the cost, and the traps. The industry determines nothing.

| Mechanic | Pipeline | Good at demonstrating | Main trap |
|---|---|---|---|
| Mask reveal | Procedural | Before and after, surface transformation | A perfect edge announces the effect |
| Curve travelling | Either | A journey, a process with stages | Arc length sampling |
| Orbited object | Asset | Craft, physical detail | Model weight, lighting cost |
| Assembly explosion | Asset, hierarchy required | Internal engineering | A merged mesh cannot be fixed in code |
| Explorable scene | Hybrid | Space as the product | Scope, and visitors getting lost |
| State transformation | Either | Configurability | Morph targets are expensive, intermediate states must hold up |

## What is inside

```
skills/elix-scroll-3d/
├── SKILL.md                the skill, loaded on demand
└── references/
    ├── decision.md         when 3D earns its place, and what the mechanic proves
    ├── pipelines.md        procedural scene vs. asset-based scene
    ├── budget.md           performance budget and device tiers
    ├── asset-audit.md      how to evaluate a model before downloading it
    ├── assets.md           export, compression, and format
    ├── choreography.md     scroll animation and camera patterns
    ├── mobile.md           gesture, touch, and degradation
    ├── fallback-seo.md     real content, reduced motion, and indexing
    ├── presets.md          presets by mechanic
    └── checklist.md        delivery checklist
```

## Works on its own

This skill is specialized: it covers only what is specific to 3D and scroll
animation, and it works without depending on anything else. General SEO,
accessibility, and delivery standards are handled by its companion skill,
[elix-front](https://github.com/ElixIsmael/elix-front). The two are designed to
be installed together.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Technical corrections and traps found on
real projects are especially welcome. Measured numbers are worth more than
estimates: if you measured it, send the measurement and the device.

## License

MIT. See [LICENSE](LICENSE).

---

## Português

Skill instalável de IA para construir sites com ambiente 3D animado por scroll que
sejam rápidos, indexáveis e realmente bons no celular.

### A tese

Existe muito site 3D bonito e mal construído. Ele trava em aparelho médio, pesa
dezenas de megabytes, vai mal em Core Web Vitals e entrega um canvas vazio para o
Google. O efeito é real, mas a conta também.

Esta skill existe para provar que dá para ter o efeito **sem** pagar esse preço.
E, quando o 3D não se justifica, ela diz isso na cara: recomenda vídeo ou imagem
e explica a troca.

### Na prática

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
As opções `--here`, `--copy` e `--remove` estão na [tabela acima](#install).

**Outros agentes** (Cursor, Codex, Copilot, Gemini CLI): aponte para o
[AGENTS.md](AGENTS.md), sem instalar nada.

**Não serve para:** jogos, VR ou AR, visualização de dados científicos, ou site
institucional que não precisa de 3D.

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

A estrutura dos arquivos está na [seção em inglês](#what-is-inside).

### Funciona sozinha

Esta skill é especializada: cuida só do que é específico de 3D e animação por
scroll, e funciona sem depender de nada. SEO geral, acessibilidade e padrão de
entrega ficam com a skill parceira,
[elix-front](https://github.com/ElixIsmael/elix-front). As duas foram pensadas
para serem instaladas juntas.

### Contribuir e licença

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Correção de erro técnico e armadilha
encontrada em projeto real são especialmente bem-vindas. Número medido vale mais
que número estimado: se você mediu, mande a medição e o aparelho.

MIT. Veja [LICENSE](LICENSE).

---

<sub>Built by [Elix Sites](https://elixsites.com.br).</sub>
