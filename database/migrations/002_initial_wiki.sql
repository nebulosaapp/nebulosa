-- Migration 002: Initial Wiki Schema
-- Banco de Dados: bdsm_wiki.db (Base de Conhecimento)

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    cor TEXT,
    icone TEXT
);

CREATE TABLE IF NOT EXISTS dicionario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    termo TEXT NOT NULL,
    termo_ingles TEXT,
    resumo TEXT,
    descricao_markdown TEXT,
    categoria_id INTEGER,
    tipo TEXT, -- conceito | protocolo | pratica | fetiche | papel | tecnica
    nivel TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS dicionario_tags (
    termo_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (termo_id, tag_id),
    FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS midias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    termo_id INTEGER,
    tipo TEXT,
    url TEXT,
    legenda TEXT,
    FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS referencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    termo_id INTEGER,
    titulo TEXT,
    autor TEXT,
    url TEXT,
    FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    titulo TEXT,
    categoria TEXT,
    conteudo_md TEXT,
    tempo_leitura INTEGER,
    dificuldade TEXT,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
