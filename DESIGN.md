# Design System: Desvio - AI Dating Platform
**Project ID:** 11014186466768188483

## 1. Visual Theme & Atmosphere
O Desvio utiliza uma estética **Cyber-Premium Glassmorphic**. A atmosfera é de exclusividade, mistério e tecnologia de ponta. O design equilibra a densidade de dados de um "dossiê técnico" com a elegância de uma interface de luxo. Elementos de transparência profunda, desfoques intensos e brilhos neon sutis criam uma experiência imersiva de "conexão segura".

## 2. Color Palette & Roles
*   **Deep Obsidian (#050505):** Fundo principal (Lowest Surface). Usado para criar contraste máximo com elementos neon.
*   **Vibrant Electric Purple (#BA9EFF):** Cor primária de destaque. Usada para botões de ação principal, ícones de status e realces de scanner.
*   **Cyber Mint (#10B981):** Cor de status "Ativo/Conectado". Usada para indicadores de presença e validação.
*   **Pure White (#FFFFFF):** Usada em opacidades variadas (5%, 10%, 20%) para criar superfícies de vidro (Glassmorphism).
*   **Warning Red (#EF4444):** Usada para alertas de segurança e ações de cancelamento/fechamento.

## 3. Typography Rules
*   **Headlines (Plus Jakarta Sans):** Uso de pesos **Black** e **ExtraBold**, frequentemente em **Itálico** com `tracking-tighter`. Transmite urgência, peso e modernidade.
*   **Body & Technical Data (Inter):** Uso de pesos variados para legibilidade. Dados técnicos usam `uppercase` com `tracking-[0.2em]` para um visual de "relatório".
*   **Monospace (Optional):** Usada apenas para hashes de ID e coordenadas geográficas, reforçando a natureza de "dossiê".
*   **Auth Branding (Brand Hero):** Nas telas de autenticação, o logo "Desvio" é ampliado para **`text-6xl` a `text-7xl`** para criar impacto visual imediato.
*   **Reduced Titles:** Títulos secundários ou de boas-vindas em cards de login/cadastro utilizam tamanhos reduzidos (**`text-xl` a `text-2xl`**) para equilibrar com o logo massivo.

## 4. Component Stylings (Radius Standard: 16px)
*   **Border Radius:** O padrão absoluto do sistema é **16px (`rounded-2xl`)**. Isso se aplica a botões, cards, inputs, containers e avatares. O estilo abandonou o formato pílula em favor de um visual "Sharp-Premium".
*   **Buttons:** Quadrados arredondados (`rounded-2xl`). Botões primários têm fundo sólido (`bg-primary`) e texto preto. Botões secundários são vidros sutis (`bg-white/5`) com bordas finas.
*   **Cards & Containers:** Bordas de 16px (`rounded-2xl`). Sempre acompanhados de `backdrop-blur-3xl` e bordas semi-transparentes (`border-white/10`).
*   **Inputs:** Formato retangular com cantos de 16px, fundos escuros e translúcidos. Quando em foco, recebem uma borda **Vibrant Electric Purple** e um leve brilho (`glow`) de realce para indicar atividade.
*   **Icons:** Material Symbols Outlined, mantendo traços finos e minimalistas.

## 5. Layout Principles
*   **Density & Whitespace:** O layout alterna entre grandes áreas de respiro (whitespace) e blocos densos de informação técnica.
*   **Global Navigation:** O Header é focado em identidade e acesso rápido. A busca global foi removida do topo para priorizar a descoberta via Radar (Filtros Inteligentes) e Mapas.
*   **Profile Integration:** O avatar no Header sempre redireciona o usuário logado para o seu próprio perfil (`/user/:id`).
*   **Scanning Effects:** Uso de linhas de brilho horizontais animadas em fotos de perfil para simular biometria.
*   **Floating Actions:** Barra de navegação flutuante no rodapé (`ActionNavBar`), centralizada e com raio de 16px, para máxima ergonomia.
