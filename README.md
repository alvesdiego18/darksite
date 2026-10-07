<div align="center">

  <img src="icons/icon128.png" alt="Smart Dark Mode Logo" width="96" height="96" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);" />

  # Smart Dark Mode & Reader

  <p align="center">
    <strong>Motor inteligente de Dark Mode e leitor noturno adaptativo para Google Chrome (Manifest V3).</strong>
  </p>

  <p align="center">
    Preserva fotos e vídeos com cores naturais, elimina flashes brancos na pintura inicial e garante conformidade de contraste WCAG.
  </p>

  <p align="center">
    <a href="https://github.com/alvesdiego18/darksite/actions/workflows/build.yml"><img src="https://github.com/alvesdiego18/darksite/actions/workflows/build.yml/badge.svg" alt="Build & Package Extension" /></a>
    <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/Versão-1.2.1-8b5cf6?style=for-the-badge" alt="Version 1.2.1" />
    <img src="https://img.shields.io/badge/Dependências-Zero-06b6d4?style=for-the-badge" alt="Zero Dependencies" />
    <img src="https://img.shields.io/badge/Tamanho-<35KB-f59e0b?style=for-the-badge" alt="Lightweight" />
  </p>

  <p align="center">
    <a href="#-instalação-no-google-chrome">Instalação Rápida</a> •
    <a href="#-build--empacotamento-automatizado">Build & Pacote</a> •
    <a href="#-integração-contínua-github-actions">GitHub Actions</a> •
    <a href="#-recursos-principais">Recursos</a> •
    <a href="#-arquitetura--como-funciona">Arquitetura Técnica</a> •
    <a href="docs/index.html">Site Oficial & Demonstração</a> •
    <a href="#-contribuindo">Contribuir</a>
  </p>

  <br />

</div>

---

## 🌟 Visão Geral

A maioria das extensões de modo escuro tradicionais utiliza filtros globais agressivos (`invert(100%) hue-rotate(180deg)`), o que arruina fotografias, torna vídeos ilegíveis e quebra botões de interfaces modernas. Pior ainda: muitas delas causam um **flash of unstyled content (FOUC)** — um relance branco ofuscante antes de escurecer a tela.

O **Smart Dark Mode & Reader** resolve isso na raiz:
1. **Pintura imediata em `document_start`:** Folha de estilo base injetada antes da primeira pintura do navegador.
2. **Heurística de luminância WCAG:** Textos e fundos são calculados matematicamente para manter proporção de contraste mínima de 4.5:1.
3. **Mídias blindadas:** Elementos como `<img>`, `<video>`, `<picture>`, `<canvas>`, `<svg>` e `<iframe>` mantêm suas cores autênticas e originais.
4. **Isolamento e privacidade totais:** Zero dependências externas, zero telemetria e operação 100% local através da API `chrome.storage.local`.

---

## ✨ Recursos Principais

| Recurso | Descrição |
| :--- | :--- |
| ⚡ **Zero Flash de Branco** | Injeção no estágio `document_start` via Service Worker (`chrome.scripting.registerContentScripts`), eliminando o flash branco inicial. |
| 🖼️ **Preservação de Mídia** | Imagens, vídeos, gráficos canvas, SVGs e iframes são blindados contra inversão destrutiva de cores. |
| 👁️ **Contraste Dinâmico WCAG** | Algoritmo baseado na fórmula oficial da W3C de luminância relativa, garantindo alta legibilidade e descanso visual. |
| 🔮 **Shadow DOM & Web Components** | Interceptação em tempo real no protótipo nativo `Element.prototype.attachShadow` para atingir componentes modernos encapsulados. |
| 🎛️ **Controles Manuais em Tempo Real** | Ajuste fino de contraste (70%–130%), brilho (60%–110%) e filtro sépia (0%–40%) para ambientes com baixa iluminação. |
| 🚫 **Lista de Exclusão (Blacklist)** | Botão de 1 clique no popup para desativar a extensão em domínios específicos (ex: YouTube, GitHub Dark), com busca instantânea. |
| 🔄 **Suporte a SPAs e Mutações** | `MutationObserver` otimizado para acompanhar páginas que atualizam conteúdo dinamicamente sem recarregar. |
| 🪶 **Ultraleve e Econômico** | Menos de 35 KB de código minificado, sem frameworks externos, garantindo zero impacto no consumo de bateria. |

---

## 🌐 Site Oficial & Demonstração Interativa

O projeto acompanha um **website moderno e minimalista** com comparador interativo antes/depois, simulador de popup e documentação técnica.

- **Localização:** Pasta [`docs/`](file:///Volumes/Projetos/Diego/darksite/docs)
- **Compatibilidade:** Pronto para publicação direta via **GitHub Pages** (configurando a pasta `/docs` na aba *Pages* do repositório).
- **Como testar localmente:**
  ```bash
  # Você pode abrir diretamente no navegador:
  open docs/index.html
  
  # Ou servir localmente via Python / Node:
  npx serve docs
  # ou
  python3 -m http.server 8080 --directory docs
  ```

---

## 🚀 Instalação no Google Chrome

Como a extensão segue o padrão moderno **Manifest V3** e código limpo Vanilla JS, ela pode ser instalada diretamente no Chrome sem necessidade de etapas de compilação:

### Passo a Passo:

1. **Clone ou baixe o repositório:**
   ```bash
   git clone https://github.com/alvesdiego18/darksite.git
   ```

2. **Acesse as extensões do Chrome:**
   - Digite `chrome://extensions/` na barra de endereços do Google Chrome e pressione `Enter`.

3. **Ative o Modo do Desenvolvedor:**
   - No canto superior direito da página, marque a chave **Modo do desenvolvedor** (*Developer mode*).

4. **Carregue a extensão:**
   - Clique no botão **Carregar sem compactação** (*Load unpacked*) no canto superior esquerdo.
   - Selecione a pasta raiz deste repositório (`darksite`) ou a pasta gerada [`dist/unpacked/`](#-build--empacotamento-automatizado).

5. **Pronto para uso:**
   - A extensão será carregada imediatamente!
   - Clique no ícone de quebra-cabeça (Extensões) na barra de ferramentas do Chrome e fixe o **Smart Dark Mode** para acesso rápido.

> 💡 **Dica:** Você também pode baixar o arquivo ZIP da extensão já buildado diretamente na aba [**Actions**](https://github.com/alvesdiego18/darksite/actions) (artefatos gerados a cada commit) ou na seção de **Releases** do repositório!

---

## 📦 Build & Empacotamento Automatizado

O projeto inclui um script de automação [`build.sh`](file:///Volumes/Projetos/Diego/darksite/build.sh) que valida os arquivos da extensão, cria a distribuição pronta para produção e compacta o arquivo `.zip` para envio à Chrome Web Store ou distribuição externa.

### O que o script de build faz:
1. **Validação Estrita:** Valida a sintaxe JSON do `manifest.json` e confere a integridade de todos os arquivos e ícones obrigatórios.
2. **Extração de Versão:** Detecta dinamicamente a versão atual definida no manifesto.
3. **Isolamento de Produção:** Limpa artefatos antigos e copia apenas os arquivos estritamente necessários para `dist/unpacked/`, removendo arquivos ocultos do sistema (`.DS_Store`, `Thumbs.db`).
4. **Compactação Otimizada:** Gera o pacote ZIP `dist/smart-dark-mode-v{VERSAO}.zip` (e link `dist/smart-dark-mode.zip`) sem arquivos desnecessários.
5. **Checksum de Integridade:** Gera automaticamente a soma de verificação SHA-256 (`dist/checksums.txt` e `dist/*.sha256`).

### Como executar localmente:

```bash
# 1. Dê permissão de execução (se necessário):
chmod +x build.sh

# 2. Execute o build:
./build.sh
```

#### Opções do script:
```bash
./build.sh --help       # Exibe ajuda com todas as opções disponíveis
./build.sh --clean      # Limpa o diretório dist/
./build.sh --no-zip     # Prepara apenas a pasta dist/unpacked/ sem gerar o ZIP
```

#### Estrutura gerada na pasta `dist/`:
```
dist/
├── unpacked/                     # Extensão descompactada pronta para o Chrome
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── main-world.js
│   ├── dark-theme.css
│   ├── popup.html
│   ├── popup.js
│   ├── LICENSE
│   └── icons/
├── smart-dark-mode-v1.2.1.zip     # Pacote pronto para Chrome Web Store / Release
├── smart-dark-mode.zip            # Cópia para referências diretas
├── smart-dark-mode-v1.2.1.zip.sha256
└── checksums.txt                  # Verificação de integridade SHA-256
```

---

## 🔄 Integração Contínua (GitHub Actions)

O repositório possui uma pipeline automatizada de CI/CD configurada em [`.github/workflows/build.yml`](file:///Volumes/Projetos/Diego/darksite/.github/workflows/build.yml):

- **Build Automático:** Disparado em todo `push` ou `pull_request` nas branches `main` e `master`, além de acionamento manual via botão *Run workflow* (`workflow_dispatch`).
- **Geração de Artefatos:** A cada execução bem-sucedida, o workflow empacota a extensão e disponibiliza o artefato `smart-dark-mode-extension` para download direto na aba **Actions** do GitHub.
- **Publicação Automática de Releases:** Ao criar e enviar uma tag de versão (ex: `git tag v1.2.1 && git push origin v1.2.1`), o GitHub Actions cria automaticamente uma nova **GitHub Release** com as notas de lançamento e os arquivos `.zip` e checksums anexados para download imediato.

---

## 💻 Como Usar

### 1. Ativação Global
Abra o popup da extensão e use o botão liga/desliga principal no topo para ativar ou desativar o tema escuro em todas as abas.

### 2. Controle por Domínio (Whitelist / Blacklist)
- Se você estiver em um site que já possui um modo escuro excelente (como YouTube ou Spotify), clique no botão **"🚫 Não aplicar neste site"**.
- Para gerenciar sites adicionados à lista, expanda a seção **"🚫 Sites ignorados"** no popup. Você pode adicionar domínios manualmente ou pesquisar entre os já cadastrados.

### 3. Ajustes Manuais de Leitura
Expanda a aba **"Ajustes manuais"** no popup para calibrar:
- **Contraste:** Aumente para realçar textos ou diminua para uma visualização mais suave.
- **Brilho:** Reduza para proteger a visão em quartos escuros.
- **Tom Séphia:** Aplique um filtro quente para reduzir a luz azul no período noturno.
- **Desfoque no carregamento:** Suaviza a transição visual enquanto o motor processa o conteúdo dinâmico.
- **Restaurar Padrão:** Volta todas as configurações para os valores ideais de fábrica com 1 clique.

---

## 🏗️ Arquitetura & Como Funciona

A extensão foi projetada seguindo as boas práticas recomendadas pela documentação oficial do Chrome Extensions Manifest V3:

```
┌─────────────────────────────────────────────────────────────┐
│                       GOOGLE CHROME                         │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 background.js                       │   │
│   │               (Service Worker)                      │   │
│   │  • Sincroniza configurações e lista de exclusão     │   │
│   │  • Registra dark-theme.css em 'document_start'      │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │ registra CSS e escuta storage   │
│                           ▼                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Aba do Navegador                    │   │
│   │                                                     │   │
│   │  ┌───────────────────┐    ┌──────────────────────┐  │   │
│   │  │   main-world.js   │    │      content.js      │  │   │
│   │  │   (Contexto MAIN) │    │  (Contexto Isolado)  │  │   │
│   │  │ • Hook em         │    │ • Motor WCAG         │  │   │
│   │  │   attachShadow    │───▶│ • MutationObserver   │  │   │
│   │  │ • Marca hosts     │    │ • Adaptação de cores │  │   │
│   │  └───────────────────┘    └──────────────────────┘  │   │
│   └─────────────────────────────────────────────────────┘   │
│                           ▲                                 │
│                           │ lê e escreve configurações      │
│   ┌───────────────────────┴─────────────────────────────┐   │
│   │                 popup.html & popup.js               │   │
│   │                  (Interface Gráfica)                │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Detalhamento dos Componentes:

1. **[`background.js`](file:///Volumes/Projetos/Diego/darksite/background.js) (Service Worker):**
   - Utiliza a API `chrome.scripting.registerContentScripts` para registrar o arquivo [`dark-theme.css`](file:///Volumes/Projetos/Diego/darksite/dark-theme.css) apenas em páginas elegíveis.
   - Isso garante que a cor de fundo seja `#121316` no exato momento da primeira renderização da aba, sem depender do download completo do HTML.

2. **[`main-world.js`](file:///Volumes/Projetos/Diego/darksite/main-world.js) (Script do Mundo Principal):**
   - Executa no contexto da própria página (`world: "MAIN"`).
   - Sobrescreve `Element.prototype.attachShadow` para marcar automaticamente cada elemento que cria uma Shadow Root com o atributo `data-sdm-host`.
   - Permite que o script isolado escute e estilize Web Components criados tardiamente por bibliotecas modernas.

3. **[`content.js`](file:///Volumes/Projetos/Diego/darksite/content.js) (Motor de Contraste Adaptativo):**
   - Calcula a luminância relativa de cada elemento usando a fórmula padrão WCAG:
     $$Y = 0.2126 \times R + 0.7152 \times G + 0.0722 \times B$$
   - Aplica adaptação seletiva em fundos claros, bordas e sombras, preservando a matiz e a intenção de design original.
   - Possui observador de mutações (`MutationObserver`) para acompanhar carregamentos infinitos, modais e transições em SPAs.

4. **[`popup.html`](file:///Volumes/Projetos/Diego/darksite/popup.html) e [`popup.js`](file:///Volumes/Projetos/Diego/darksite/popup.js) (Painel de Controle):**
   - Interface com design dark elegante.
   - Sincronização em tempo real via `chrome.storage.local`.

---

## 📁 Estrutura de Pastas

```
darksite/
├── .github/
│   └── workflows/
│       └── build.yml       # Pipeline CI/CD do GitHub Actions (Build, Artefatos e Release)
├── .gitignore              # Regras de exclusão Git (macOS, IDEs, caches)
├── LICENSE                 # Licença de código aberto MIT
├── README.md               # Documentação principal do repositório
├── CONTRIBUTING.md         # Guia e normas para contribuições da comunidade
├── build.sh                # Script de validação, empacotamento e geração de ZIP
├── manifest.json           # Manifesto oficial da extensão Manifest V3
├── background.js           # Service worker de ciclo de vida e injeção rápida
├── content.js              # Motor adaptativo de luminância relativa WCAG
├── main-world.js           # Interceptador de Shadow DOM no contexto principal
├── dark-theme.css          # Folha de estilo base para pintura imediata
├── popup.html              # Interface do painel de controle da extensão
├── popup.js                # Lógica e persistência de dados do popup
├── icons/                  # Ícones da extensão nos tamanhos oficiais
│   ├── icon.svg            # Vetor base em alta resolução
│   ├── icon16.png          # Ícone 16x16 (favicon e abas)
│   ├── icon32.png          # Ícone 32x32 (telas retina)
│   ├── icon48.png          # Ícone 48x48 (gerenciador de extensões)
│   └── icon128.png         # Ícone 128x128 (Chrome Web Store)
└── docs/                   # Site moderno e minimalista de apresentação
    ├── index.html          # Landing page com comparador antes/depois
    ├── styles.css          # Design system minimalista em CSS puro
    ├── app.js              # Lógica interativa de testes e simulador
    └── assets/             # Imagens e ícones utilizados pelo site
```

---

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES2022+ Vanilla):** Zero dependências externas, alto desempenho e compatibilidade nativa com o motor V8 do Google Chrome.
- **CSS3 Moderno:** Variáveis CSS (`custom properties`), transições fluidas e cálculo de cores adaptativo.
- **Chrome Extension API (Manifest V3):** `storage`, `activeTab`, `scripting`, `declarativeContentScripts`.

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Se você deseja propor uma melhoria, corrigir um bug em um site específico ou otimizar regras de contraste:

1. Leia nosso guia em [CONTRIBUTING.md](file:///Volumes/Projetos/Diego/darksite/CONTRIBUTING.md).
2. Faça um fork do projeto.
3. Crie sua branch (`git checkout -b feature/minha-melhoria`).
4. Envie seus commits (`git commit -m 'feat: adiciona suporte especial ao site X'`).
5. Faça o push para a branch (`git push origin feature/minha-melhoria`).
6. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](file:///Volumes/Projetos/Diego/darksite/LICENSE) para obter mais informações.

---

<div align="center">
  <sub>Criado com dedicação por <strong>Diego Alves</strong> • Feito para noites produtivas e olhos saudáveis. 🌙</sub>
</div>
