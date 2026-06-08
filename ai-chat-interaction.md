# Planejamento: Chat Interativo com Perfis de IA (Desvio - VPS Self-Hosted)

## Objetivo
Transformar a interação reativa/síncrona atual em uma experiência assíncrona premium de alta performance na sua infraestrutura **Self-Hosted na VPS**, dotando as IAs de **memória contextual (histórico)**, **simulação humana de digitação (delay realista)** e **outreach ativo (iniciar o chat após o match)** de forma nativa e leve.

---

## 🏗️ Análise de Arquitetura para VPS Self-Hosted

Como o Supabase está rodando em uma VPS própria (via Docker Compose), evitamos a complexidade de gerenciar deploy de *Edge Functions* locais no CLI. Em vez disso, adotamos uma das duas arquiteturas ultra-robustas abaixo, aproveitando o que já está ativo no seu Postgres (extensão `http`):

### Opção A (Recomendada): Fila Nativa no Postgres (`ai_chat_queue` + `pg_cron` / `pg_net`)
* **Fluxo:** 
  1. O usuário humano envia uma mensagem.
  2. Uma trigger instantânea insere um registro em uma tabela leve de fila (`ai_chat_queue`). O chat do usuário fecha a transação imediatamente em `<5ms`.
  3. O `pg_cron` (nativo do Supabase) executa a cada 5 segundos um script PL/pgSQL em background que busca itens pendentes na fila, executa a chamada HTTP ao Gemini (usando a sua extensão `http` existente) e insere a resposta do bot no banco.
  4. O Supabase Realtime propaga a resposta ao frontend de forma assíncrona.

```
[Humano] ──(Grava Msg instantaneamente)──> [messages]
                                                │
                                        (Trigger leve <1ms)
                                                ▼
                                         [ai_chat_queue] 
                                                ▲
                                                │ (Consome a cada 5s em bg)
                                         [Job do pg_cron] ──(HTTP)──> [Gemini API]
                                                │
                                                ▼
                                    (Insere Resposta da IA) ──> [messages] ──> [Realtime UI]
```

### Opção B: Worker Lightweight em Node.js (Background na VPS)
* **Fluxo:** 
  1. Um script Node.js ultra-simples (ex: `worker.cjs` rodando via PM2 ou Docker na mesma VPS) assina o canal Realtime do Supabase ou consulta a tabela de fila a cada 3 segundos.
  2. Quando detecta uma mensagem enviada a um bot, o worker em Node faz a chamada ao Gemini, calcula o tempo de digitação, e insere a resposta diretamente via `@supabase/supabase-js`.
  3. **Vantagem:** Retira toda a carga de requisições de rede HTTP e JSON parsing de dentro do banco de dados (Postgres), mantendo a VPS extremamente leve.

---

## 📋 Lista de Tarefas (Ajustada para VPS)

### Fase 1: Criação da Fila de Mensagens (`ai_chat_queue`)
- [ ] **Tarefa 1: Criar a Tabela de Fila no Banco de Dados**
  * Criar `public.ai_chat_queue` para rastrear mensagens pendentes de processamento de IA, status (`pending`, `processing`, `completed`, `failed`), tentativas de reenvio e erros.
  * *Verificação:* Executar o schema e validar a presença da tabela via SQL Editor.
- [ ] **Tarefa 2: Criar Trigger Instantânea de Fila**
  * Substituir a trigger síncrona atual por uma trigger leve `tr_enqueue_ai_response` que apenas insere o `message_id` na fila quando a mensagem for destinada a um perfil com `is_human = FALSE`.
  * *Verificação:* Enviar mensagem para um bot no chat e verificar se a linha na tabela `messages` é criada instantaneamente e um registro surge na fila `ai_chat_queue` com status `pending`.

### Fase 2: Implementação do Worker de Processamento (Opção B)
- [ ] **Tarefa 3: Criar Script Worker em Node (`scratch/ai_chat_worker.cjs`)**
  * Desenvolver um script leve usando o SDK do Supabase que monitora a fila `ai_chat_queue`, busca o histórico do chat (RPC existente), faz a chamada à API do Gemini e executa o salvamento.
  * *Verificação:* Rodar o worker localmente com `node scratch/ai_chat_worker.cjs` e ver a IA respondendo no chat em background.
- [ ] **Tarefa 4: Adicionar Simulação Humana (Delay & Status Digitando)**
  * No worker Node, antes de enviar a resposta, atualizar o match para `is_typing = true`, aguardar um delay proporcional ao tamanho da resposta (`Math.min(4000, text.length * 45)`) e depois salvar a mensagem definitiva limpando o status `is_typing`.
  * *Verificação:* Validar se no frontend o feedback visual de digitação funciona de forma fluida durante a janela de processamento.

### Fase 3: Proatividade & Deploy na VPS
- [ ] **Tarefa 5: Implementar Trigger de Match Proativo (Liquidez Ativa)**
  * Criar uma trigger `tr_ai_initiate_chat` no banco de dados que escuta a criação de novos Matches aceitos envolvendo bots e insere uma mensagem de "Boas-vindas/Abertura" na fila de processamento após 30 segundos de intervalo.
  * *Verificação:* Validar se matches novos com perfis sintéticos geram abordagens proativas dos bots de forma autônoma.
- [ ] **Tarefa 6: Configurar o Worker na VPS via PM2**
  * Configurar o script Node para rodar como daemon contínuo na VPS usando PM2 para garantir que o chat de IA continue funcionando em tempo de produção.
  * *Verificação:* Reiniciar a VPS e garantir que o serviço de chat da IA suba e se restabeleça automaticamente.

---

## Critérios de Sucesso (Done When)
- [ ] Gravação imediata de mensagens dos usuários (latência zero no banco).
- [ ] IA conversa de forma inteligente utilizando memória do histórico (conversas fluidas).
- [ ] Atraso de digitação e animação `"Digitando..."` integrados na UI do chat de forma natural.
- [ ] Serviço de background robusto e tolerante a falhas rodando na VPS.
