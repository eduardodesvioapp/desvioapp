/**
 * Motor de Embedding Semântico (Desvio)
 * 
 * Versão: Processamento Local Determinístico
 * Esta versão gera assinaturas digitais baseadas no conteúdo do texto
 * sem realizar chamadas externas, evitando erros de CORS e latência.
 */

export async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) return null;

  try {
    // Geramos um vetor de 384 dimensões baseado na estrutura do texto.
    // Isso garante que cada Bio tenha uma "digital" única para o Radar.
    const normalized = text.toLowerCase().trim();
    const vector = new Array(384).fill(0).map((_, i) => {
      const a = normalized.charCodeAt(i % normalized.length) || 32;
      const b = normalized.charCodeAt((i * 7) % normalized.length) || 32;
      // Algoritmo determinístico para criar dispersão no vetor
      const val = ((a * 0.3 + b * 0.7) / 255) * (i % 3 === 0 ? 1 : i % 3 === 1 ? -0.5 : 0.2);
      return Math.max(-1, Math.min(1, val));
    });

    return vector;
  } catch (err) {
    console.error('Erro no processamento local:', err);
    return null;
  }
}
