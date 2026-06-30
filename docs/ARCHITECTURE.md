# 🌌 Arquitetura do Projeto — Nebulosa

Este documento define a organização arquitetural, fluxos de dados e separação de responsabilidades no ecossistema **Nebulosa** (BDSM Test).

---

## 🏗️ Separação de Responsabilidades

O projeto adota uma arquitetura modular simplificada separando frontend estático, lógica de rotas do backend (API) e regras de domínio puras.

### 📁 Estrutura de Diretórios Atualizada

```
/
├── backend/                  # Servidor Express & Bancos de Dados
│   ├── data/                 # JSONs com Perguntas e Textos de Diagnóstico
│   ├── src/                  # Código-Fonte do Backend
│   │   ├── api/              # Controllers, Middlewares e Rotas
│   │   ├── domain/           # Regras de Negócio e Motores de Cálculo
│   │   └── infrastructure/   # Conexões e Acesso aos Bancos (SQLite)
│   ├── bdsm_completo.db      # SQLite para usuários, testes e dinâmicas
│   └── bdsm_wiki.db          # SQLite contendo o glossário e guias educativos
├── frontend/                 # Client Estático (HTML, JS, CSS)
│   ├── assets/               # Style, Menu e i18n (Traduções)
│   ├── biblioteca.html       # Biblioteca Kinky Interativa
│   ├── index.html            # Tela de Configuração e Acesso
│   ├── test.html             # Painel de Questionário com Likert
│   ├── results.html          # Diagnósticos, Radar de Pilares e Compatibilidade
│   └── perfil.html           # Cadastro de Usuário e Histórico
├── docs/                     # Documentação de Arquitetura e Decisões
└── brain/                    # Regras de Negócio de Produto & Roteiro
```

---

## 🛠️ Banco de Dados (SQLite)

O sistema divide seus dados fisicamente em dois bancos para otimizar desempenho e facilitar backups:
1.  **`bdsm_completo.db`:** Armazena dados mutáveis e confidenciais dos usuários (`usuarios`, `testes_salvos`, `limites_usuario`, `relacionamentos`, `checklist_tarefas` e `diario_sessoes`).
2.  **`bdsm_wiki.db`:** Banco de dados estático e otimizado para leitura rápida de conteúdo pedagógico (`dicionario` e `guias_educativos`).

---

## 🧩 Regras de Ouro e Fluxos Críticos
*   **Agnosticismo de ID:** Suporta tanto identificadores de e-mail quanto de Instagram (`@`) na autenticação de forma transparente.
*   **Motor de Cálculo Unificado (`engine.js`):** Algoritmo puro de normalização ponderada para calcular os 25 arquétipos, média harmônica para o perfil *Switch* e dedução progressiva para a afinidade *Vanilla*.
*   **Tradução e i18n:** Rótulos gerenciados dinamicamente no frontend pelo módulo `i18n.js` com suporte a PT, EN e ES, persistindo a escolha no `localStorage`.
