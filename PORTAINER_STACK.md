# Deploy no Portainer - Stack Desvio

Guia completo para fazer deploy da aplicação Desvio usando Portainer com Docker Swarm.

---

## Pré-requisitos

- Portainer CE/EE instalado e acessível (Swarm mode)
- Git instalado no servidor
- Traefik rodando como service no Swarm (rede `desvio-net-01`)

---

## Fluxo de Deploy

```
git push → Build manual no servidor → Portainer deploy → Traefik roteia
```

---

## 1. Build das Imagens no Servidor

As imagens precisam ser buildadas **no servidor** porque Docker Swarm não suporta `build:`.

### Setup inicial (primeira vez)

```bash
# Instalar Git
apt install git -y

# Clonar o repositório
cd /opt
git clone https://github.com/eduardodesvioapp/desvioapp.git
cd desvioapp

# Criar .env.local com suas credenciais
nano .env.local
```

Cole o conteúdo do `.env.local` (mesmo do desenvolvimento local).

### Build

```bash
chmod +x build.sh
./build.sh
```

### Atualizar (após git push)

```bash
cd /opt/desvio-build
git pull
./build.sh
```

---

## 2. Deploy no Portainer

1. Acesse o Portainer (`https://vps1.portainer.desvio.app.br`)
2. Vá em **Stacks → Add Stack**
3. Nome: `desvio-react`
4. Build method: **Repository**
5. Preencha:
   - **Repository URL**: `https://github.com/eduardodesvioapp/desvioapp.git`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`
6. Clique em **Deploy the stack**

> Nota: O compose usa `image:` (não `build:`), então ele vai usar as imagens que já foram buildadas no servidor.

---

## 3. Serviços da Stack

| Serviço | Imagem | Descrição |
|---|---|---|
| `web` | `desvio-web:latest` | Frontend React via Traefik |
| `ai-worker` | `desvio-ai-worker:latest` | Worker de chat IA (Gemini) |
| `admin-mailer` | `desvio-admin-mailer:latest` | Worker de envio de emails |
| `redis` | `redis:7-alpine` | Cache/fila persistente |

---

## 4. Variáveis de Ambiente

Variáveis para os workers (preenchidas no UI do Portainer):

### Supabase
| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do Supabase |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Chave service_role |
| `SUPABASE_URL` | URL do Supabase (mailer) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (mailer) |

### Gemini
| Variável | Descrição |
|---|---|
| `VITE_GEMINI_API_KEY` | Chave principal |
| `VITE_GEMINI_API_KEY_2/3/4` | Chaves backup (opcional) |

### SMTP
| Variável | Padrão |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | (obrigatório) |
| `SMTP_PASS` | (obrigatório) |
| `SMTP_SENDER_NAME` | `Desvio` |
| `SMTP_FROM` | (obrigatório) |

---

## 5. Acesso

| Serviço | URL |
|---|---|
| App | `https://desvio.app.br` |
| Portainer | `https://vps1.portainer.desvio.app.br` |
| Supabase | `https://vps1.supabase.desvio.app.br` |

---

## 6. Traefik

O Traefik roteia automaticamente com base nos labels:
- **Host**: `desvio.app.br`
- **Entrypoint**: `websecure` (porta 443)
- **TLS**: Let's Encrypt (automático)
- **Rede**: `desvio-net-01`

---

## 7. Troubleshooting

### Container não inicia
```bash
docker service ps desvio-react_web
docker service logs desvio-react_web --tail 50
```

### Imagem não encontrada
```bash
# Verificar se a imagem existe
docker images | grep desvio-

# Rebuild
cd /opt/desvio-build && ./build.sh
```

### Traefik retorna 404
```bash
# Verificar se o container está na rede correta
docker network inspect desvio-net-01 | grep -A 5 "desvio-react"

# Verificar labels do Traefik
docker service inspect desvio-react_web --pretty | grep -A 20 "Labels"
```

### Redis não conecta
```bash
# Resetar volume
docker volume rm desvio-react_redis-data
```

---

## 8. Comandos Úteis

```bash
# Status da stack
docker stack services desvio-react

# Logs
docker service logs -f desvio-react_web
docker service logs -f desvio-react_ai-worker

# Remover stack
docker stack rm desvio-react

# Listar imagens
docker images | grep desvio-
```
