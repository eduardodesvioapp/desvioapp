# 🛡️ Política de Termos Bloqueados - Desvio

Esta lista define os termos, padrões e comportamentos que devem ser monitorados ou bloqueados nas mensagens de chat para garantir a segurança dos usuários e a integridade da plataforma.

## 1. Contatos e Redes Sociais
*   **Instagram**: `instagram`, `insta`, `@ig`, `meu insta`
*   **WhatsApp**: `whatsapp`, `zap`, `wpp`, `whats`, `meu numero`
*   **Facebook**: `facebook`, `fb`, `face`
*   **TikTok**: `tiktok`, `tk`, `meu tiktok`
*   **Telefones**: Padrões numéricos como `9XXXX-XXXX`, `(XX) XXXXX-XXXX`

## 2. Dados de Comunicação
*   **Emails**: Padrões com `@`, `.com`, `.br`, `.edu`, `.org`
*   **Links Externos**: `http://`, `https://`, `www.`, `.com.br`

## 3. Transações Financeiras (Prevenção de Fraudes)
*   **Pagamentos**: `pix`, `transferencia`, `ted`, `doc`, `deposito`, `pagamento`
*   **Valores**: `valor`, `preço`, `quanto é`, `dinheiro`, `grana`

## 4. Termos de Baixo Calão e Abuso
*   *Lista extensiva de palavras ofensivas (devem ser filtradas por bibliotecas específicas ou regex).*

## 🛠️ Sugestão de Implementação Técnica
Para o chat do Desvio, recomenda-se uma abordagem de "Dossiê Seguro":

1.  **Aviso de Segurança**: Ao detectar um termo, mostrar um alerta: `[AVISO_SISTEMA]: Detecção de dado sensível. Mantenha a conexão criptografada dentro do Desvio para sua segurança.`
2.  **Ofuscação**: Substituir automaticamente o termo por `[DADO_OCULTO]` ou `********`.
3.  **Shadow Ban**: Mensagens com múltiplos termos bloqueados podem ser sinalizadas para revisão automática da IA.
