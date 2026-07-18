#!/bin/bash
# ============================================================
# Script de build das imagens Docker para o Desvio
# Execute no servidor antes de fazer deploy da stack no Portainer
# ============================================================

set -e

REPO_URL="https://github.com/eduardodesvioapp/desvioapp.git"
BUILD_DIR="/opt/desvio-build"
ENV_FILE=".env.local"

echo "=== Desvio - Build de Imagens Docker ==="

# 1. Clonar ou atualizar o repositório
if [ -d "$BUILD_DIR" ]; then
  echo "Atualizando repositório..."
  cd "$BUILD_DIR"
  git pull
else
  echo "Clonando repositório..."
  git clone "$REPO_URL" "$BUILD_DIR"
  cd "$BUILD_DIR"
fi

# 2. Carregar variáveis de ambiente
if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: Arquivo $ENV_FILE não encontrado!"
  echo "Crie o arquivo $ENV_FILE na raiz do repositório com as variáveis necessárias."
  exit 1
fi

echo "Carregando variáveis de $ENV_FILE..."
set -a
source "$ENV_FILE"
set +a

# 3. Build da imagem web (React + Nginx)
echo ""
echo ">>> Building desvio-web..."
docker build \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
  --build-arg VITE_SUPABASE_STORAGE_BUCKET="${VITE_SUPABASE_STORAGE_BUCKET}" \
  --build-arg VITE_R2_ACCOUNT_ID="${VITE_R2_ACCOUNT_ID}" \
  --build-arg VITE_R2_ACCESS_KEY_ID="${VITE_R2_ACCESS_KEY_ID}" \
  --build-arg VITE_R2_SECRET_ACCESS_KEY="${VITE_R2_SECRET_ACCESS_KEY}" \
  --build-arg VITE_R2_BUCKET_NAME="${VITE_R2_BUCKET_NAME}" \
  --build-arg VITE_R2_PUBLIC_URL="${VITE_R2_PUBLIC_URL}" \
  --build-arg VITE_R2_WORKER_URL="${VITE_R2_WORKER_URL}" \
  --build-arg VITE_CF_ZONE="${VITE_CF_ZONE}" \
  --build-arg VITE_HUGGING_FACE_ACCESS_TOKEN="${VITE_HUGGING_FACE_ACCESS_TOKEN}" \
  --build-arg VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY}" \
  --build-arg VITE_GEMINI_API_KEY_2="${VITE_GEMINI_API_KEY_2:-}" \
  --build-arg VITE_GEMINI_API_KEY_3="${VITE_GEMINI_API_KEY_3:-}" \
  --build-arg VITE_GEMINI_API_KEY_4="${VITE_GEMINI_API_KEY_4:-}" \
  -t desvio-web:latest \
  -f dockerfile .

# 4. Build da imagem ai-worker
echo ""
echo ">>> Building desvio-ai-worker..."
docker build \
  -t desvio-ai-worker:latest \
  -f Dockerfile.worker .

# 5. Build da imagem admin-mailer
echo ""
echo ">>> Building desvio-admin-mailer..."
docker build \
  -t desvio-admin-mailer:latest \
  -f Dockerfile \
  ./scripts/admin-mailer

# 6. Listar imagens criadas
echo ""
echo "=== Build concluído! ==="
docker images | grep desvio-

echo ""
echo "Próximos passos:"
echo "1. Acesse o Portainer"
echo "2. Crie/Atualize a stack 'desvio-react'"
echo "3. O deploy vai usar as imagens que acabamos de buildar"
