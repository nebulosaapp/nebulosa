-- Migration 005: Suporte a Usuarios Anonimos
-- Adiciona a coluna is_anonimo para rastrear acessos sem cadastro

ALTER TABLE usuarios ADD COLUMN is_anonimo INTEGER DEFAULT 0;
