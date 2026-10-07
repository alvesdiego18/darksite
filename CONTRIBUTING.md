# Contribuindo com o Smart Dark Mode & Reader

Obrigado pelo interesse em contribuir! 🎉 Este projeto é open-source e contribuições da comunidade são muito bem-vindas — sejam correções de bugs, suporte a novos sites complexos, melhorias visuais ou otimizações de performance.

---

## 🧭 Como Começar

1. **Faça um Fork** deste repositório no GitHub.
2. **Clone** o seu fork localmente:
   ```bash
   git clone https://github.com/SEU_USUARIO/darksite.git
   cd darksite
   ```
3. **Crie uma branch** para a sua funcionalidade ou correção:
   ```bash
   git checkout -b feature/minha-melhoria
   ```

---

## 🛠️ Como Testar Localmente no Chrome

Como o projeto utiliza JavaScript Vanilla e Manifest V3 sem necessidade de build ou bundlers:

1. Abra o Google Chrome e navegue até `chrome://extensions/`.
2. Ative a chave **Modo do desenvolvedor** (*Developer mode*) no canto superior direito.
3. Clique em **Carregar sem compactação** (*Load unpacked*).
4. Selecione a pasta raiz deste repositório.
5. Sempre que fizer alterações no código:
   - Para alterações em `content.js` ou `popup.html` / `popup.js`: Recarregue a página de teste ou reabra o popup.
   - Para alterações no `manifest.json` ou `background.js`: Clique no botão de recarregar (ícone de rotação 🔄) do card da extensão em `chrome://extensions/`.

---

## 📐 Diretrizes de Código

- **Vanilla First**: Não adicione bibliotecas pesadas de terceiros ao motor de injeção. O objetivo é manter a extensão com menos de 50KB e latência imperceptível.
- **Padrão Manifest V3**: Respeite os padrões modernos de Service Workers, `chrome.storage.local` e scripts de conteúdo isolados.
- **Não quebre mídias**: Ao adicionar regras ou heurísticas de cores, certifique-se de que imagens (`<img>`), vídeos (`<video>`), telas canvas, SVGs e iframes mantenham suas cores originais sem inversão indesejada.
- **Código Limpo**: Mantenha nomes de variáveis descritivos e comente seções com regras específicas de sites.

---

## 🐛 Reportando Bugs

Ao abrir uma issue, informe:
- A URL do site onde ocorreu o problema (caso seja público).
- Comportamento esperado vs Comportamento observado (ex: texto ilegível, imagem invertida, flash branco).
- Versão do Chrome e Sistema Operacional.
- Screenshots ou gravações breves do problema.

---

## 🚀 Enviando seu Pull Request

1. Garanta que seu código foi testado em múltiplos websites (sites claros, sites escuros nativos e SPAs dinâmicas).
2. Execute `./build.sh` para validar a sintaxe do manifesto e a integridade dos arquivos gerados.
3. Faça commit com mensagens claras seguindo o padrão Conventional Commits (ex: `feat:`, `fix:`, `docs:`, `perf:`).
4. Envie o push para o seu fork:
   ```bash
   git push origin feature/minha-melhoria
   ```
5. Abra um Pull Request com uma descrição detalhada das mudanças.

Agradecemos imensamente por tornar a navegação web noturna mais agradável para todos! 🌙
