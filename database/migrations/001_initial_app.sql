-- Migration 001: Initial Schema
-- Banco de Dados: bdsm_completo.db (Dados da Aplicação)

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,
    identificador TEXT UNIQUE,
    email TEXT UNIQUE,
    instagram TEXT UNIQUE,
    senha_hash TEXT NOT NULL,
    nome TEXT,
    foto TEXT,
    bio TEXT,
    cidade TEXT,
    pais TEXT,
    idioma TEXT DEFAULT 'pt',
    pronome TEXT DEFAULT 'elu',
    orientacao_sexual TEXT,
    genero TEXT,
    idade INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS testes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE,
    usuario_id INTEGER,
    tipo TEXT,
    perfil_declarado TEXT,
    resultado_json TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS testes_salvos (
    token TEXT PRIMARY KEY,
    usuario_id INTEGER,
    level_teste TEXT,
    scores_json TEXT NOT NULL,
    profile_declarado TEXT,
    pronome TEXT,
    finalizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teste_id INTEGER,
    pergunta_id INTEGER,
    resposta INTEGER,
    FOREIGN KEY(teste_id) REFERENCES testes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS perguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    categoria TEXT,
    eixo TEXT,
    peso REAL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS praticas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    categoria TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS limites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    pratica_id INTEGER,
    nivel TEXT,
    observacao TEXT DEFAULT '',
    UNIQUE(usuario_id, pratica_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY(pratica_id) REFERENCES praticas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS relacionamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario1 INTEGER,
    usuario2 INTEGER,
    tipo TEXT,
    iniciado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo INTEGER DEFAULT 1,
    deleted_at DATETIME,
    FOREIGN KEY(usuario1) REFERENCES usuarios(id),
    FOREIGN KEY(usuario2) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS diario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relacionamento_id INTEGER,
    usuario_id INTEGER,
    titulo TEXT,
    texto TEXT,
    humor INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY(relacionamento_id) REFERENCES relacionamentos(id) ON DELETE CASCADE,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relacionamento_id INTEGER,
    inicio DATETIME,
    fim DATETIME,
    safeword_utilizada INTEGER DEFAULT 0,
    observacoes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY(relacionamento_id) REFERENCES relacionamentos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aftercare (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_id INTEGER,
    hidratou INTEGER DEFAULT 0,
    alimentou INTEGER DEFAULT 0,
    conversou INTEGER DEFAULT 0,
    observacoes TEXT,
    FOREIGN KEY(sessao_id) REFERENCES sessoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    descricao TEXT,
    icone TEXT
);

CREATE TABLE IF NOT EXISTS usuarios_badges (
    usuario_id INTEGER,
    badge_id INTEGER,
    recebido_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(usuario_id, badge_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY(badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id INTEGER,
    termo_id INTEGER,
    PRIMARY KEY(usuario_id, termo_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historico_buscas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    busca TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origem TEXT,
    origem_id INTEGER,
    embedding BLOB,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preferencias (
    usuario_id INTEGER PRIMARY KEY,
    tema TEXT DEFAULT 'dark',
    idioma TEXT DEFAULT 'pt',
    notificacoes INTEGER DEFAULT 1,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    acao TEXT,
    ip TEXT,
    user_agent TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS relationship_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending | accepted | declined
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS limit_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    pratica_id INTEGER NOT NULL,
    nivel_anterior TEXT,
    nivel_novo TEXT NOT NULL,
    observacao TEXT,
    mudado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY(pratica_id) REFERENCES praticas(id) ON DELETE CASCADE
);
