# 🌌 Nebulosa — Manual de Implantação e Execução (Dev)

Este guia orienta a inicialização e manutenção do ecossistema do projeto.

---

## 🛠️ Requisitos de Instalação

1.  **Node.js:** Versão 18 ou superior instalada.
2.  **Dependências:** Execute a instalação das dependências a partir da pasta `/backend`:
    ```bash
    cd backend
    npm install
    ```

---

## 🚀 Inicialização Local

Para subir o servidor Express e servir o frontend estático na porta `3001`:

1.  **Executar o Script:** Na raiz do projeto, execute:
    ```bash
    npm start
    ```
2.  **Acesso Local:** Abra o navegador em `http://localhost:3001/`.

---

## 💾 Manutenção de Bancos de Dados

O projeto utiliza dois arquivos de banco SQLite:
-   `bdsm_completo.db`: Dados de testes de usuários.
-   `bdsm_wiki.db`: Contém os verbetes e guias educativos estruturados. Caso precise repovoar a base da wiki com mais termos, utilize o script Python `expandir_wiki.py` na pasta de scratch.
