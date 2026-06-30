import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../../database/bdsm_completo.db');

// Abre conexão com SQLite
async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

import { gerarTokenAcesso } from './authMiddleware.js';

// 1. Registrar Usuário (@instagram ou email)
export async function registrarUsuario(identificador, senha, pronome) {
  const db = await getDb();
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash(senha, salt);
  
  try {
    const result = await db.run(
      `INSERT INTO usuarios (identificador, senha_hash, pronome) VALUES (?, ?, ?)`,
      [identificador.trim(), senhaHash, pronome || 'elu']
    );
    const userId = result.lastID;
    const token = gerarTokenAcesso({ id: userId, identificador });
    await db.close();
    return { success: true, userId, token };
  } catch (error) {
    await db.close();
    if (error.message.includes('UNIQUE')) {
      return { success: false, error: 'Usuário já cadastrado.' };
    }
    return { success: false, error: error.message };
  }
}

// 2. Login de Usuário
export async function loginUsuario(identificador, senha) {
  const db = await getDb();
  const user = await db.get(
    `SELECT * FROM usuarios WHERE identificador = ?`,
    [identificador.trim()]
  );
  await db.close();

  if (!user) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  const matches = await bcrypt.compare(senha, user.senha_hash);
  if (!matches) {
    return { success: false, error: 'Senha incorreta.' };
  }

  const token = gerarTokenAcesso({ id: user.id, identificador: user.identificador });
  return { success: true, token, user: { id: user.id, identificador: user.identificador } };
}

// 3. Gerador de Token Curto sem Colisão (8 Caracteres limpos)
export async function gerarTokenUnico(tabela = 'testes_salvos') {
  const db = await getDb();
  // Evita caracteres ambíguos como 1, l, 0, O
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  let exists = true;

  while (exists) {
    token = '';
    for (let i = 0; i < 8; i++) {
      const idx = crypto.randomInt(0, chars.length);
      token += chars[idx];
    }

    const row = await db.get(`SELECT token FROM ${tabela} WHERE token = ?`, [token]);
    if (!row) {
      exists = false;
    }
  }

  await db.close();
  return token;
}
