/**
 * 🤖 WORKER DE CHAT DE IA (Desvio - VPS Background Daemon)
 * 
 * Monitora a tabela `ai_chat_queue` em busca de novas mensagens para perfis de IA.
 * Processa a resposta utilizando a API do Gemini com histórico de conversa (contexto),
 * simula um atraso realista de digitação e aciona o indicador visual "Digitando...".
 * 
 * Executar via PM2 na VPS: pm2 start scratch/ai_chat_worker.cjs --name "desvio-ai-worker"
 */
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
// Carrega uma lista de Chaves de API do Gemini para rodízio e custo zero
const GEMINI_API_KEYS = [
  process.env.VITE_GEMINI_API_KEY,
  process.env.VITE_GEMINI_API_KEY_2,
  process.env.VITE_GEMINI_API_KEY_3,
  process.env.VITE_GEMINI_API_KEY_4
].filter(Boolean);

if (!SUPABASE_URL || !SERVICE_KEY || GEMINI_API_KEYS.length === 0) {
  console.error('❌ Erro: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY ou pelo menos uma VITE_GEMINI_API_KEY não configurada em .env.local');
  process.exit(1);
}

let currentKeyIndex = 0;

// Retorna a chave ativa atual
function getActiveApiKey() {
  return GEMINI_API_KEYS[currentKeyIndex];
}

// Rotaciona para a próxima chave disponível
function rotateApiKey() {
  if (GEMINI_API_KEYS.length <= 1) return;
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  console.log(`🔄 [API KEY ROTATION] Limite atingido. Alternando para a Chave de API de Backup #${currentKeyIndex + 1}`);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Helper para delay assíncrono
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para chamar a API do Gemini via HTTPS nativo
async function callGeminiAPI(apiKey, promptHistory, personality, model = 'gemini-1.5-flash') {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    // Monta a estrutura de conteúdos suportando histórico do Gemini v1beta
    const payload = JSON.stringify({
      systemInstruction: {
        parts: [{ text: `INSTRUÇÕES GERAIS DE COMPORTAMENTO (OBRIGATÓRIO):
1. VOCÊ É UMA PESSOA REAL: Você é um usuário real conversando no aplicativo de encontros Desvio. NUNCA diga que é uma inteligência artificial, robô, modelo de linguagem ou assistente da Google. Fale e aja como um ser humano buscando conexão.
2. NÃO DÊ SUPORTE OU INSTRUÇÕES: Você NÃO está aqui para tirar dúvidas sobre o aplicativo, explicar telas ou resolver problemas técnicos do usuário. Se perguntarem algo do app, desconverse, brinque ou seja evasivo de forma natural, exatamente como uma pessoa real faria.
3. FOCO EXCLUSIVO EM BATE-PAPO: Seu único objetivo é flertar, conversar de forma descontraída, interessante e manter o papo fluindo naturalmente.
4. ESTILO DE ESCRITA HUMANO E COMPACTO: Escreva de forma curta (máximo 1 a 3 frases curtas), use gírias leves se fizer sentido para o perfil, evite pontuações excessivamente formais e dê respostas dinâmicas.
5. ALINHAMENTO ABSOLUTO COM SEU PERFIL: Use as instruções da sua personalidade individual, interesses, idade e biografia como base única para responder a quaisquer perguntas sobre quem você é, o que faz, onde mora, do que gosta ou seus planos. Mantenha coerência total com a sua persona e nunca invente fatos que entrem em contradição com ela.
6. NUNCA CONFIRMAR ENCONTROS PRESENCIAIS (MANDATÓRIO): Sob nenhuma circunstância aceite, confirme ou agende encontros ao vivo, ligações ou troca de contatos externos (como WhatsApp ou Instagram). Se o usuário sugerir um encontro presencial ou pedir seu contato, desvie do assunto de maneira educada, charmosa e extremamente natural. Use de bom humor (ex: dizendo que prefere ir devagar e se conhecer melhor por aqui no chat primeiro) e mude sutilmente o rumo da conversa para outro assunto interessante, mantendo a conversa fluindo de forma agradável e sem parecer robótico.

INSTRUÇÕES DA SUA PERSONALIDADE INDIVIDUAL:
${personality}` }]
      },
      contents: promptHistory
    });

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            const usage = parsed.usageMetadata || {};
            if (text) {
              resolve({
                text: text.trim(),
                promptTokens: usage.promptTokenCount || 0,
                completionTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0
              });
            } else {
              reject(new Error(`Resposta vazia ou inválida da API: ${data}`));
            }
          } catch (e) {
            reject(new Error(`Erro ao parsear JSON da resposta: ${e.message}`));
          }
        } else {
          reject(new Error(`API Gemini respondeu com status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Processador principal do ciclo da fila
async function processQueue() {
  // 1. Busca mensagens pendentes na fila
  const { data: queueItems, error: queueError } = await supabase
    .from('ai_chat_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5);

  if (queueError) {
    console.error('❌ Erro ao ler fila do banco:', queueError.message);
    return;
  }

  if (!queueItems || queueItems.length === 0) {
    return; // Sem mensagens na fila
  }

  console.log(`🤖 Processando ${queueItems.length} mensagem(ns) enfileirada(s)...`);

  for (const item of queueItems) {
    try {
      // Atualiza status na fila para evitar reprocessamento paralelo
      await supabase
        .from('ai_chat_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      // 3. Carrega detalhes da mensagem e perfil da IA
      const { data: msg, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', item.message_id)
        .single();

      if (msgError || !msg) {
        throw new Error(`Mensagem original ${item.message_id} não encontrada: ${msgError?.message}`);
      }

      const { data: bot, error: botError } = await supabase
        .from('users')
        .select('name, is_human, ai_config')
        .eq('id', msg.receiver_id)
        .single();

      if (botError || !bot) {
        throw new Error(`Perfil de IA ${msg.receiver_id} não encontrado: ${botError?.message}`);
      }

      if (bot.is_human !== false) {
        throw new Error(`Usuário ${msg.receiver_id} não é um perfil de IA. Ignorando.`);
      }

      console.log(`💬 Conversa iniciada com bot: ${bot.name} (Match ID: ${msg.match_id})`);

      // 4. Carrega o histórico das últimas 10 mensagens
      const { data: historyMsgs, error: histError } = await supabase
        .from('messages')
        .select('sender_id, content')
        .eq('match_id', msg.match_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (histError) {
        throw new Error(`Erro ao recuperar histórico: ${histError.message}`);
      }

      // Ordena do mais antigo para o mais recente para o prompt
      historyMsgs.reverse();

      // Monta os conteúdos estruturados para a API do Gemini
      const promptHistory = historyMsgs.map(h => ({
        role: h.sender_id === msg.receiver_id ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      // Se o histórico estiver vazio por algum motivo, garante a inserção da última mensagem do usuário
      if (promptHistory.length === 0) {
        promptHistory.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      }

      // 5. Liga o sinalizador de digitação ("Digitando...") na tabela de matches
      await supabase
        .from('matches')
        .update({ typing_user_id: msg.receiver_id })
        .eq('id', msg.match_id);

      // 6. Configuração do Bot e Chamada da API
      const aiConfig = bot.ai_config || {};
      const personality = aiConfig.personality || 'Você é um perfil misterioso no app Desvio.';
      let model = aiConfig.model || 'gemini-flash-latest';
      
      // Forçamos o uso do gemini-flash-lite-latest para garantir a generosa cota gratuita robusta de 2026 (o flash padrão está limitado a 20 req/dia na chave gratuita)
      model = 'gemini-flash-lite-latest';

      let geminiResult = null;
      let attempts = 0;
      const maxKeyAttempts = GEMINI_API_KEYS.length;

      while (attempts < maxKeyAttempts) {
        try {
          const currentKey = getActiveApiKey();
          geminiResult = await callGeminiAPI(currentKey, promptHistory, personality, model);
          break; // Sucesso, sai do loop de tentativas
        } catch (apiErr) {
          // Se for erro de cota esgotada (429 ou Quota Limit)
          if (apiErr.message.includes('429') || apiErr.message.toLowerCase().includes('quota') || apiErr.message.toLowerCase().includes('limit')) {
            console.warn(`⚠️ Chave de API #${currentKeyIndex + 1} esgotou a cota. Tentando rotacionar...`);
            rotateApiKey();
            attempts++;
          } else {
            // Outro erro de API (ex: prompt bloqueado por segurança), não adianta rotacionar chave
            throw apiErr;
          }
        }
      }

      if (!geminiResult) {
        throw new Error('Todas as chaves de API do Gemini no pool de rodízio falharam ou atingiram seus limites.');
      }

      const responseText = geminiResult.text;
      console.log(`🤖 Resposta gerada para ${bot.name}: "${responseText.substring(0, 50)}..." [Tokens: ${geminiResult.totalTokens} (Prompt: ${geminiResult.promptTokens}, Completion: ${geminiResult.completionTokens})]`);

      // 7. Simula atraso realista de digitação baseado na extensão da resposta
      // Velocidade média: ~45ms por caractere + 500ms de tempo de pensamento
      const typingDelay = Math.min(4500, (responseText.length * 45) + 500);
      console.log(`⏳ Simulando digitação por ${typingDelay}ms...`);
      await sleep(typingDelay);

      // 8. Grava a resposta da IA no banco de dados
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          match_id: msg.match_id,
          sender_id: msg.receiver_id,
          receiver_id: msg.sender_id,
          content: responseText
        });

      if (insertError) {
        throw new Error(`Erro ao inserir resposta da IA no banco: ${insertError.message}`);
      }

      // 9. Desliga o sinalizador de digitação
      await supabase
        .from('matches')
        .update({ typing_user_id: null })
        .eq('id', msg.match_id);

      // 10. Atualiza status na fila como concluído com sucesso e salva contagem de tokens
      await supabase
        .from('ai_chat_queue')
        .update({
          status: 'completed',
          prompt_tokens: geminiResult.promptTokens,
          completion_tokens: geminiResult.completionTokens,
          total_tokens: geminiResult.totalTokens,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      console.log(`✅ Fila concluída com sucesso para o item ${item.id}`);

    } catch (err) {
      console.error(`❌ Falha ao processar item de fila ${item.id}:`, err.message);
      
      const retryCount = (item.retry_count || 0) + 1;
      const nextStatus = retryCount >= 3 ? 'failed' : 'pending'; // Auto-retry até 3 vezes

      // Desliga o sinalizador de digitação por segurança em caso de erro
      try {
        await supabase
          .from('matches')
          .update({ typing_user_id: null })
          .eq('id', item.match_id);
      } catch (e) { /* ignore */ }

      await supabase
        .from('ai_chat_queue')
        .update({
          status: nextStatus,
          retry_count: retryCount,
          error_message: err.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
    }
  }
}

// Loop infinito do Daemon
async function startDaemon() {
  console.log('🚀 Desvio AI Chat Worker iniciado. Monitorando fila a cada 3 segundos...');
  
  while (true) {
    try {
      await processQueue();
    } catch (err) {
      console.error('🔥 Erro crítico no loop do worker:', err.message);
    }
    await sleep(3000); // Aguarda 3 segundos para a próxima verificação
  }
}

// Inicia execução
startDaemon();
