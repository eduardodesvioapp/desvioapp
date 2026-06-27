# Desvio R2 Worker

Cloudflare Worker para gerenciar uploads diretos para o Cloudflare R2.

## Setup

1. Instalar dependências:
```bash
cd worker
npm install
```

2. Configurar secrets do Worker:
```bash
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_PUBLIC_URL
```

3. Deploy:
```bash
npm run deploy
```

4. Copie a URL do Worker e adicione em `.env.local`:
```
VITE_R2_WORKER_URL=https://desvio-r2-worker.your-subdomain.workers.dev
```

## Rotas

- `POST /api/r2/presigned-url` - Gera URL pré-assinada para upload
- `GET /api/r2/health` - Health check

## Desenvolvimento

```bash
npm run dev
```

O Worker estará disponível em `http://localhost:8787`