-- Migration 003: Core Indexes
-- Banco de Dados: bdsm_completo.db e bdsm_wiki.db

-- Índices bdsm_wiki.db
CREATE INDEX IF NOT EXISTS idx_dicionario_slug ON dicionario(slug);
CREATE INDEX IF NOT EXISTS idx_dicionario_termo ON dicionario(termo);
CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria);

-- Índices bdsm_completo.db
-- Nota: Serão criados no banco correspondente durante o processo de migração
CREATE INDEX IF NOT EXISTS idx_testes_usuario ON testes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_limites_usuario ON limites(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_teste ON respostas(teste_id);
CREATE INDEX IF NOT EXISTS idx_praticas_nome ON praticas(nome);
