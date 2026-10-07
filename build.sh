#!/usr/bin/env bash
# ==============================================================================
# Smart Dark Mode & Reader - Build Script
# Gera o pacote de distribuição da extensão (pasta descompactada e arquivo ZIP)
# ==============================================================================

set -euo pipefail

# Diretório raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

DIST_DIR="${ROOT_DIR}/dist"
UNPACKED_DIR="${DIST_DIR}/unpacked"

# Cores para saída no terminal
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERRO]${NC} $1" >&2
}

show_help() {
  cat << EOF
Uso: ./build.sh [OPÇÕES]

Opções:
  -c, --clean       Limpa o diretório de build (dist/) e encerra
  --no-zip          Gera apenas a pasta descompactada (dist/unpacked) sem o ZIP
  -h, --help        Exibe esta mensagem de ajuda

Exemplos:
  ./build.sh            # Realiza a validação e gera o pacote completo (.zip e unpacked)
  ./build.sh --clean    # Limpa artefatos anteriores
EOF
}

clean_dist() {
  log_info "Limpando diretório de distribuição ($DIST_DIR)..."
  rm -rf "$DIST_DIR"
  log_success "Diretório de distribuição limpo."
}

# Processamento de argumentos
GENERATE_ZIP=true
while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--clean)
      clean_dist
      exit 0
      ;;
    --no-zip)
      GENERATE_ZIP=false
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      log_error "Opção desconhecida: $1"
      show_help
      exit 1
      ;;
  esac
done

echo -e "${BOLD}====================================================${NC}"
echo -e "${BOLD}  🌙 Smart Dark Mode & Reader - Processo de Build   ${NC}"
echo -e "${BOLD}====================================================${NC}"

# 1. Validação de pré-requisitos e arquivos
log_info "Validando arquivos essenciais da extensão..."

if [[ ! -f "manifest.json" ]]; then
  log_error "manifest.json não foi encontrado na raiz do projeto!"
  exit 1
fi

# Extração da versão do manifest.json
VERSION=""
if command -v node >/dev/null 2>&1; then
  VERSION=$(node -e "try { console.log(require('./manifest.json').version); } catch(e) { process.exit(1); }" 2>/dev/null || true)
fi

if [[ -z "$VERSION" ]] && command -v python3 >/dev/null 2>&1; then
  VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])" 2>/dev/null || true)
fi

if [[ -z "$VERSION" ]]; then
  VERSION=$(grep -m1 '"version"' manifest.json | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/' || true)
fi

if [[ -z "$VERSION" ]]; then
  log_error "Não foi possível identificar a versão em manifest.json."
  exit 1
fi

log_info "Versão detectada: ${BOLD}v${VERSION}${NC}"

# Validar sintaxe do manifest.json se python3 ou node estiverem disponíveis
if command -v python3 >/dev/null 2>&1; then
  if ! python3 -m json.tool manifest.json >/dev/null 2>&1; then
    log_error "manifest.json possui erro de sintaxe JSON!"
    exit 1
  fi
  log_success "Sintaxe do manifest.json validada com sucesso."
elif command -v node >/dev/null 2>&1; then
  if ! node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))" >/dev/null 2>&1; then
    log_error "manifest.json possui erro de sintaxe JSON!"
    exit 1
  fi
  log_success "Sintaxe do manifest.json validada com sucesso."
fi

# Lista de arquivos obrigatórios para a extensão funcionar
REQUIRED_FILES=(
  "manifest.json"
  "background.js"
  "content.js"
  "main-world.js"
  "dark-theme.css"
  "popup.html"
  "popup.js"
  "icons/icon16.png"
  "icons/icon32.png"
  "icons/icon48.png"
  "icons/icon128.png"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    log_error "Arquivo obrigatório ausente: $file"
    exit 1
  fi
done
log_success "Todos os ${#REQUIRED_FILES[@]} arquivos essenciais foram validados."

# 2. Preparação do diretório dist
clean_dist
mkdir -p "$UNPACKED_DIR"

# 3. Cópia dos arquivos de produção para dist/unpacked
log_info "Copiando arquivos da extensão para dist/unpacked/..."

cp manifest.json "$UNPACKED_DIR/"
cp background.js "$UNPACKED_DIR/"
cp content.js "$UNPACKED_DIR/"
cp main-world.js "$UNPACKED_DIR/"
cp dark-theme.css "$UNPACKED_DIR/"
cp popup.html "$UNPACKED_DIR/"
cp popup.js "$UNPACKED_DIR/"

if [[ -f "LICENSE" ]]; then
  cp LICENSE "$UNPACKED_DIR/"
fi

mkdir -p "$UNPACKED_DIR/icons"
cp -r icons/* "$UNPACKED_DIR/icons/"

# Limpeza de arquivos indesejados no pacote
find "$UNPACKED_DIR" -name ".DS_Store" -delete 2>/dev/null || true
find "$UNPACKED_DIR" -name "Thumbs.db" -delete 2>/dev/null || true

log_success "Arquivos copiados com sucesso para $UNPACKED_DIR"

# 4. Geração do arquivo ZIP para publicação
ZIP_FILENAME="smart-dark-mode-v${VERSION}.zip"
ZIP_FILEPATH="${DIST_DIR}/${ZIP_FILENAME}"
GENERIC_ZIP_FILEPATH="${DIST_DIR}/smart-dark-mode.zip"

if [[ "$GENERATE_ZIP" = true ]]; then
  log_info "Compactando pacote para publicação: $ZIP_FILENAME..."

  if command -v zip >/dev/null 2>&1; then
    (
      cd "$UNPACKED_DIR"
      zip -qr -9 "$ZIP_FILEPATH" . -x "*.DS_Store" -x "*__MACOSX*" -x "*.git*"
    )
  elif command -v python3 >/dev/null 2>&1; then
    python3 - <<EOF
import os, zipfile
dist_dir = "$DIST_DIR"
unpacked = "$UNPACKED_DIR"
zip_path = "$ZIP_FILEPATH"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(unpacked):
        for f in files:
            if f in ('.DS_Store', 'Thumbs.db'): continue
            fp = os.path.join(root, f)
            arcname = os.path.relpath(fp, unpacked)
            zf.write(fp, arcname)
EOF
  else
    log_error "Nem o comando 'zip' nem 'python3' foram encontrados para criar o arquivo .zip."
    exit 1
  fi

  # Cria cópia genérica sem versão para links diretos
  cp "$ZIP_FILEPATH" "$GENERIC_ZIP_FILEPATH"

  # 5. Cálculo do Checksum SHA-256
  log_info "Gerando checksum SHA-256..."
  CHECKSUM=""
  if command -v sha256sum >/dev/null 2>&1; then
    CHECKSUM=$(cd "$DIST_DIR" && sha256sum "$ZIP_FILENAME")
  elif command -v shasum >/dev/null 2>&1; then
    CHECKSUM=$(cd "$DIST_DIR" && shasum -a 256 "$ZIP_FILENAME")
  fi

  if [[ -n "$CHECKSUM" ]]; then
    echo "$CHECKSUM" > "${DIST_DIR}/${ZIP_FILENAME}.sha256"
    echo "$CHECKSUM" > "${DIST_DIR}/checksums.txt"
    log_success "Checksum SHA-256 gerado em dist/checksums.txt"
  fi

  # Tamanho do arquivo ZIP
  if command -v du >/dev/null 2>&1; then
    ZIP_SIZE=$(du -h "$ZIP_FILEPATH" | cut -f1)
  else
    ZIP_SIZE="N/A"
  fi
fi

echo ""
echo -e "${BOLD}====================================================${NC}"
echo -e "${GREEN}${BOLD}  ✨ Build concluído com sucesso!                   ${NC}"
echo -e "${BOLD}====================================================${NC}"
echo -e "  Versão:            ${BOLD}v${VERSION}${NC}"
echo -e "  Pasta Descompactada: ${BLUE}${UNPACKED_DIR}${NC}"
if [[ "$GENERATE_ZIP" = true ]]; then
  echo -e "  Arquivo ZIP:       ${BLUE}${ZIP_FILEPATH}${NC} (${ZIP_SIZE})"
  echo -e "  Arquivo ZIP (link):${BLUE}${GENERIC_ZIP_FILEPATH}${NC}"
  if [[ -f "${DIST_DIR}/checksums.txt" ]]; then
    echo -e "  SHA-256:           $(cat "${DIST_DIR}/checksums.txt" | awk '{print $1}')"
  fi
fi
echo -e "${BOLD}====================================================${NC}"
echo ""
echo -e "Para carregar no Chrome:"
echo -e "  1. Acesse chrome://extensions/"
echo -e "  2. Ative o 'Modo do desenvolvedor'"
echo -e "  3. Clique em 'Carregar sem compactação' e selecione: ${BLUE}${UNPACKED_DIR}${NC}"
echo ""
