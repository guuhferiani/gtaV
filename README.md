# Mapa Interativo GTA V - Rastreamento de Colecionáveis (100% / Platina)

Este é um projeto de mapa interativo de alta performance e esteticamente premium, projetado para auxiliar jogadores de Grand Theft Auto V a rastrearem todo o progresso necessário para obter a conquista de 100% de conclusão (Platina). 

O design é otimizado para computadores e dispositivos móveis de alta densidade de pixels (como o Samsung Galaxy S25 Ultra).

---

## 🗺️ Recursos do Projeto

*   **Três Estilos de Mapa:** Alterne instantaneamente entre as visualizações **Estrada (Road)**, **Atlas** e **Satélite (Satellite)** (blocos de imagens HD carregados dinamicamente do S3).
*   **276 Pontos de Interesse (Colecionáveis):** Todos os itens essenciais mapeados com precisão nas coordenadas geográficas do jogo:
    *   🛸 50 Partes de Nave Espacial (Spaceship Parts)
    *   ✉️ 50 Fragmentos de Carta (Letter Scraps)
    *   🚗 50 Saltos Únicos (Stunt Jumps)
    *   🌉 50 Locais "Sob a Ponte" (Under the Bridge)
    *   ☢️ 30 Resíduos Nucleares (Nuclear Waste)
    *   ✈️ 15 Voos de Faca (Knife Flights)
    *   📜 10 Tratados de Epsilon (Epsilon Tract)
    *   💵 Pacotes de Dinheiro Ocultos & Spawn de Veículos Raros
*   **Controle de Opacidade Dinâmico:** Um slider na barra lateral permite definir o nível de transparência dos itens coletados (de 10% a 100%) para limpar o mapa visualmente sem sumir totalmente com os ícones.
*   **Filtro Rápido e Botões Globais:** Mostre ou oculte todas as categorias de uma só vez ou filtre apenas o item que você está buscando no momento através do campo de busca inteligente.
*   **Links Diretos para Tutoriais em Vídeo:** Popups integrados aos marcadores do mapa contêm links diretos para guias de vídeo do YouTube no momento exato do colecionável (com suporte a timestamps automáticos do PowerPyx).
*   **Salvar Progresso Automaticamente:** O progresso e as preferências do usuário são persistidos automaticamente no navegador (`localStorage`), garantindo que seus dados nunca se percam ao fechar a aba.

---

## 🛠️ Tecnologias Utilizadas

*   **Leaflet.js:** Biblioteca JavaScript de código aberto para mapas interativos amigáveis a dispositivos móveis.
*   **HTML5 & CSS3 Moderno:** Estrutura semântica e sistema de estilos com variáveis personalizadas (tokens CSS) e efeitos de desfoque de fundo (Glassmorphism) no painel de controle.
*   **JavaScript (ES6):** Manipulação dinâmica de dados e controle de estado em tempo real.
*   **Ícones SVG Vetoriais:** Ícones gerados programaticamente para máxima nitidez gráfica e leveza.

---

## 🚀 Como Executar Localmente

Como o projeto é totalmente estático, você não precisa compilar nada. Basta servir a pasta a partir de um servidor web local.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/guuhferiani/gtaV.git
    cd gtaV
    ```

2.  **Inicie um servidor estático:**
    Se você possui o Node.js instalado, pode rodar:
    ```bash
    npx http-server -p 8080
    ```
    Ou se preferir usar Python:
    ```bash
    python -m http.server 8080
    ```

3.  **Acesse no navegador:**
    Abra `http://127.0.0.1:8080` no seu computador.

---

## 📱 Como Hospedar e Acessar no Celular (GitHub Pages)

Para visualizar no seu celular a qualquer momento:

1.  Acesse o seu repositório no GitHub.
2.  Vá em **Settings** > **Pages** no menu lateral.
3.  Sob *Build and deployment*, defina a branch como **`main`** e clique em **Save**.
4.  Após cerca de 1 minuto, acesse o link gerado pelo GitHub (ex: `https://guuhferiani.github.io/gtaV/`) no navegador do seu smartphone.
5.  Adicione a página à tela inicial do seu celular (S25 Ultra) para usá-la como um aplicativo nativo!

---

## 💳 Créditos e Agradecimentos

*   Coordenadas de colecionáveis obtidas através de repositórios da comunidade (danharper).
*   Vídeos de tutoriais de colecionáveis por PowerPyx.
*   Imagens de blocos de mapa (tiles) hospedadas pela comunidade.
