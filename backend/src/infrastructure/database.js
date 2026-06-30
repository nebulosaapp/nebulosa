import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis do .env na raiz
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../database/config.json'), 'utf8')
);

const dbWikiPath = path.resolve(__dirname, '../../../', config.wiki);
const dbAppPath = path.resolve(__dirname, '../../../', config.app);

// Pool de conexão PostgreSQL (só é instanciado se DATABASE_URL existir)
let pgPool = null;
if (process.env.DATABASE_URL) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Abstração que unifica chamadas de query e execução entre SQLite e PostgreSQL
class DbWrapper {
  constructor(isPg, clientOrDb) {
    this.isPg = isPg;
    this.conn = clientOrDb;
  }

  // Executa uma query que retorna múltiplos registros
  async all(sql, params = []) {
    if (this.isPg) {
      // Traduzir placeholders "?" para "$1, $2, ..." do PostgreSQL
      const pgSql = translatePlaceholders(sql);
      const res = await this.conn.query(pgSql, params);
      return res.rows;
    } else {
      return this.conn.all(sql, params);
    }
  }

  // Executa uma query que retorna um único registro
  async get(sql, params = []) {
    if (this.isPg) {
      const pgSql = translatePlaceholders(sql);
      const res = await this.conn.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      return this.conn.get(sql, params);
    }
  }

  // Executa comandos INSERT/UPDATE/DELETE
  async run(sql, params = []) {
    if (this.isPg) {
      const pgSql = translatePlaceholders(sql);
      const res = await this.conn.query(pgSql, params);
      return {
        lastID: res.rows && res.rows[0] ? res.rows[0].id : null,
        changes: res.rowCount
      };
    } else {
      const res = await this.conn.run(sql, params);
      return {
        lastID: res.lastID,
        changes: res.changes
      };
    }
  }

  // Executa múltiplos blocos SQL brutos
  async exec(sql) {
    if (this.isPg) {
      return this.conn.query(sql);
    } else {
      return this.conn.exec(sql);
    }
  }

  async close() {
    if (this.isPg) {
      // Em PG usando Pool, o client é liberado de volta ao pool
      if (typeof this.conn.release === 'function') {
        this.conn.release();
      }
    } else {
      await this.conn.close();
    }
  }
}

// Função utilitária para converter "?" do SQLite para "$1, $2" do Postgres
function translatePlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export class DatabaseConnection {
  // Retorna conexão do App
  static async getAppDb() {
    if (pgPool) {
      const client = await pgPool.connect();
      return new DbWrapper(true, client);
    } else {
      const db = await open({
        filename: dbAppPath,
        driver: sqlite3.Database
      });
      return new DbWrapper(false, db);
    }
  }

  // A Wiki por ser estática/leitura pode continuar no SQLite local mesmo em produção (offline)
  // ou pode apontar para Postgres. Por segurança de deploy stateless, mantemos suporte híbrido.
  static async getWikiDb() {
    const db = await open({
      filename: dbWikiPath,
      driver: sqlite3.Database
    });
    return new DbWrapper(false, db);
  }
}
