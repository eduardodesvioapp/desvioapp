# Deploy no Portainer - Stack Desvio

Guia completo para fazer deploy da aplicação Desvio usando Portainer com repositório GitHub.

---

## Pré-requisitos

- Portainer CE/EE instalado e acessível
- Conta no GitHub com acesso ao repositório do projeto
- Docker Swarm ou Docker Standalone configurado no Portainer

---

## Variáveis de Ambiente

Copie a tabela abaixo e preencha os valores no Portainer ao criar a stack.

### Supabase

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do Supabase | `https://vps1.supabase.desvio.app.br` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | `eyJhbG...` |
| `VITE_SUPABASE_STORAGE_BUCKET` | Nome do bucket de storage | `desvio-storage` |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (apenas workers) | `eyJhbG...` |
| `SUPABASE_URL` | URL do Supabase (para mailer) | `https://vps1.supabase.desvio.app.br` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (para mailer) | `eyJhbG...` |

### Cloudflare R2

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_R2_ACCOUNT_ID` | ID da conta Cloudflare | `d2c5fe7386...` |
| `VITE_R2_ACCESS_KEY_ID` | Access Key ID do R2 | `7737eb420b...` |
| `VITE_R2_SECRET_ACCESS_KEY` | Secret Access Key do R2 | `096388fa1d...` |
| `VITE_R2_BUCKET_NAME` | Nome do bucket R2 | `desvio-storage` |
| `VITE_R2_PUBLIC_URL` | URL pública do bucket | `https://storage.desvio.app.br` |
| `VITE_R2_WORKER_URL` | URL do worker R2 | `https://desvio-r2-worker.desvio.workers.dev` |
| `VITE_CF_ZONE` | Zona Cloudflare | `desvio.app.br` |

### API Keys (AI)

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Chave principal do Gemini | `AQ.Ab8RN6...` |
| `VITE_GEMINI_API_KEY_2` | Chave backup 2 (opcional) | `AIzaSy...` |
| `VITE_GEMINI_API_KEY_3` | Chave backup 3 (opcional) | `AIzaSy...` |
| `VITE_GEMINI_API_KEY_4` | Chave backup 4 (opcional) | `AIzaSy...` |
| `VITE_HUGGING_FACE_ACCESS_TOKEN` | Token HuggingFace | `hf_EtqYju...` |

### SMTP (Admin Mailer)

| Variável | Descrição | Padrão |
|---|---|---|
| `SMTP_HOST` | Host do SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta do SMTP | `465` |
| `SMTP_USER` | Usuário do SMTP | `seu-email@gmail.com` |
| `SMTP_PASS` | Senha de app do Gmail | `abcdefghijklmnop` |
| `SMTP_SENDER_NAME` | Nome do remetente | `Desvio` |
| `SMTP_FROM` | E-mail do remetente | `seu-email@gmail.com` |
| `POLL_INTERVAL_MS` | Intervalo de polling (ms) | `5000` |
| `MAX_ATTEMPTS` | Máximo de tentativas | `5` |

---

## Serviços da Stack

| Serviço | Descrição | Porta |
|---|---|---|
| `web` | Frontend React (Nginx) | 80 |
| `ai-worker` | Worker de chat IA (Gemini) | — |
| `admin-mailer` | Worker de envio de emails | — |
| `redis` | Cache/fila (persistente) | 6379 (interno) |

---

## Deploy via GitHub (Portainer)

### 1. Conectar o repositório GitHub

1. No Portainer, vá em **Settings → Git Configuration**
2. Clique em **Add Git Credential**
3. Preencha:
   - **Name**: `github-desvio`
   - **URL**: `https://github.com/SEU_USUARIO/SEU_REPO.git`
   - **Username**: seu usuário GitHub
   - **Personal Access Token**: gere um token com permissão `repo`
4. Salve

### 2. Criar a Stack

1. Vá em **Stacks → Add Stack**
2. Nome: `desvio`
3. Build method: **Git repository**
4. Preencha:
   - **Repository URL**: `https://github.com/SEU_USUARIO/SEU_REPO.git`
   - **Repository reference**: `refs/heads/main` (ou a branch de deploy)
   - **Compose path**: `docker-compose.yml`
   - **Git credentials**: selecione o credential criado
5. Em **Environment variables**, adicione todas as variáveis da tabela acima
6. Clique em **Deploy the stack**

### 3. Auto-deploy com Webhook

Para atualizar automaticamente a cada push:

1. Na stack criada, vá em **Webhooks**
2. Copie a URL do webhook
3. No GitHub, vá em **Settings → Webhooks → Add webhook**
4. Preencha:
   - **Payload URL**: cole a URL do Portainer
   - **Content type**: `application/json`
   - **Events**: selecione **Just the push event**
5. Salve

Agora cada `git push` disparará o rebuild e deploy automaticamente.

---

## Deploy Manual (atualização)

Para atualizar sem webhook:

1. Na stack, clique em **Editor**
2. Clique em **Update the stack**
3. O Portainer irá fazer pull do repositório e rebuildar

Ou via CLI do Portainer:

```bash
# Atualizar a stack
curl -X POST "https://SEU_PORTAINER/api/stacks/ID stacks/start" \
  -H "X-API-Key: SUA_API_KEY"
```

---

## Variáveis no Portainer

Ao criar a stack pelo methodo Git, o Portainer **não carrega automaticamente** o `.env`. Existem duas opções:

### Opção 1: Variáveis no UI (Recomendado)

No formulário de criação da stack, preencha cada variável manualmente na seção **Environment variables**.

### Opção 2: Arquivo .env no repositório

Crie um arquivo `.env` no repositório (adicione ao `.gitignore` se for privado):

```env
VITE_SUPABASE_URL=https://vps1.supabase.desvio.app.br
VITE_SUPABASE_ANON_KEY=eyJhbG...
# ... outras variáveis
```

> **⚠️ Nunca commite chaves de API em repositórios públicos!**

---

## Troubleshooting

### Build falha com erro de variável

Verifique se todas as variáveis `VITE_*` estão preenchidas no Portainer. O build do frontend precisa delas.

### ai-worker reiniciando

```bash
# Verificar logs
docker logs desvio-ai-worker-1

# Causas comuns:
# - VITE_SUPABASE_URL não configurada
# - VITE_SUPABASE_SERVICE_ROLE_KEY inválida
# - Nenhuma VITE_GEMINI_API_KEY configurada
```

### admin-mailer não envia emails

```bash
# Verificar logs
docker logs desvio-admin-mailer-1

# Causas comuns:
# - SMTP_USER / SMTP_PASS inválidos
# - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados
# - Tabela email_outbox não existe no banco
```

### Frontend mostra branco

```bash
# Verificar se o build completou
docker logs desvio-web-1

# Rebuild manualmente
docker-compose build --no-cache web
```

### Redis não conecta

O Redis usa volume persistente `redis-data`. Se precisar resetar:

```bash
docker volume rm desvio_redis-data
```

---

## Comandos Úteis

```bash
# Ver status da stack
docker-compose ps

# Ver logs de um serviço
docker-compose logs -f ai-worker

# Reconstruir um serviço específico
docker-compose build --no-cache ai-worker

# Parar toda a stack
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

---

## Fluxo de Deploy

```
git push → GitHub Webhook → Portainer detecta → Build → Deploy
     │
     ├── web: rebuild frontend → restart nginx
     ├── ai-worker: rebuild → restart daemon
     ├── admin-mailer: rebuild → restart worker
     └── redis: sem mudança (volume persistente)
```
