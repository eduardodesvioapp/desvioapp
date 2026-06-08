# ⚛️ Resonance Engine (Motor de Ressonância)

Este documento descreve o funcionamento do algoritmo de compatibilidade e afinidade do ecossistema **Desvio**.

## 1. Visão Geral
A **Ressonância** é a métrica que define o quanto dois usuários são compatíveis dentro da plataforma. Diferente de algoritmos tradicionais que usam apenas preferências explícitas, o Desvio utiliza um motor híbrido que combina dados estruturados, proximidade geográfica e inteligência semântica.

## 2. Lógica de Cálculo (Algoritmo)
O cálculo é realizado em tempo real através da função `calculate_resonance(user_a, user_b)`. A pontuação final é composta pelos seguintes fatores:

### A. Base de Ressonância (40%)
Todo par de usuários começa com uma base mínima de **40 pontos**. Isso representa a possibilidade latente de conexão entre qualquer dois agentes na rede.

### B. Afinidade de Interesses (Até +30%)
Baseado na tabela `user_interests`.
*   **Regra**: +10 pontos para cada interesse (tag) em comum.
*   **Limite**: Máximo de 30 pontos adicionais.
*   **Exemplo**: Se ambos possuem "Casual" e "Namoro", o score sobe +20.

### C. Similaridade Semântica / IA (Até +20%)
Utiliza a extensão `pgvector` para comparar os `compatibility_embedding` gerados a partir da biografia e perfil dos usuários.
*   **Método**: Distância do Cosseno (`<=>`).
*   **Cálculo**: `(1 - distância) * 20`.
*   **Objetivo**: Identificar compatibilidade de "vibe" e tom de escrita mesmo que as tags sejam diferentes.

### D. Bônus de Proximidade (+10%)
Privilegia conexões locais para incentivar encontros reais.
*   **Regra**: +10 pontos se os usuários estiverem registrados na mesma cidade (`city`).

### E. Bônus de Integridade de Perfil (+10%)
Incentiva usuários a manterem perfis completos.
*   **Regra**: +10 pontos se ambos possuírem `profile_score >= 90`.

## 3. Implementação Técnica
O motor está implementado como uma função SQL (`STABLE`) para garantir performance máxima durante as buscas no Radar.

*   **Arquivo SQL**: `/home/edukmattos/Projetos/desvio/prd/resonance_engine.sql`
*   **Integração**: Injetado diretamente na coluna `compatibility` da função `search_users_safe`.

## 4. Evolução (Roadmap)
Futuras versões do motor de ressonância incluirão:
1.  **Frequência de Atividade**: Bônus para usuários ativos simultaneamente.
2.  **Histórico de Matches**: Ajuste de afinidade baseado em padrões de matches anteriores bem-sucedidos.
3.  **Filtragem Colaborativa**: Sugestões baseadas em "usuários como você também gostaram de...".

---
*Documentação atualizada em 01/05/2026*
