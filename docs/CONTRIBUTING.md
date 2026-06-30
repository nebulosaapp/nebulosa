# 📖 Guia de Desenvolvimento e Padrões da Nebulosa

Este documento orienta os desenvolvedores sobre a arquitetura e os padrões de codificação adotados na Nebulosa (BDSM Test).

---

## 🛠️ Stack Tecnológica & Dependências

*   **Backend:** Node.js Express (ES Modules)
*   **Banco de Dados:** SQLite (com driver `sqlite3` e helper `sqlite` assíncrono)
*   **Frontend:** HTML5, CSS3 baunilha (focado em mobile e responsividade), JavaScript puro (ES6)

---

## 🏗️ Padrões de Arquitetura (Versão 1.0)

O projeto adota uma arquitetura em camadas bem definida para isolar responsabilidades e garantir testabilidade:

```
[Cliente Frontend] 
       ↓ HTTP REST
[Roteador Express (server.js)]
       ↓
[Camada de Serviços (Services)]   <-- Regras de Negócio e Validações
       ↓
[Camada de Repositórios (Repos)]  <-- Abstração das Queries SQL
       ↓
[SQLite Database]
```

### 📁 Estrutura de Pastas e Componentes:
1.  **`/database/migrations`**: Scripts SQL de controle de versão de banco.
2.  **`/database/seeds`**: Dados estáticos de povoamento inicial (categorias, verbetes).
3.  **`backend/src/infrastructure/database.js`**: Gerenciador centralizado de conexões com os bancos SQLite.
4.  **`backend/src/repositories/`**: Abstração total de acesso a dados (Ex: `WikiRepository.js`, `LimitRepository.js`). Nenhuma outra camada do app escreve código SQL diretamente.
5.  **`backend/src/services/`**: Concentração de lógica de negócio e validações de dados (Ex: `WikiService.js`, `LimitService.js`).

---

## 📝 Boas Práticas de Código

1.  **Segurança e Entrada:** Nunca confie nas entradas do frontend. Adicione validações explícitas na camada de serviço.
2.  **Tratamento de Erros:** Todos os controllers devem possuir blocos `try/catch` para delegação de erros e devolução de respostas amigáveis.
3.  **Higienização e Manutenção:** Não deixe arquivos órfãos, backups soltos ou arquivos temporários na raiz. O versionamento de bancos deve ocorrer exclusivamente via `npm run migrate`.
