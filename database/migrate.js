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
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf8'));

const dbWikiPath = path.resolve(__dirname, '../', config.wiki);
const dbAppPath = path.resolve(__dirname, '../', config.app);

async function runMigrate() {
  console.log('🏁 Iniciando migração dos bancos de dados...');

  // Se DATABASE_URL estiver presente, migra o PostgreSQL. Caso contrário, roda localmente em SQLite.
  if (process.env.DATABASE_URL) {
    console.log('🔌 Conectando ao banco PostgreSQL e rodando migrações...');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    const client = await pool.connect();

    try {
      // 1. Traduzir e aplicar o schema da aplicação para Postgres
      // O Postgres não possui "AUTOINCREMENT" (usa-se SERIAL), e usa VARCHAR/TEXT em vez de datatypes genéricos do SQLite.
      let schemaApp = fs.readFileSync(path.resolve(__dirname, 'migrations/001_initial_app.sql'), 'utf8');
      schemaApp = schemaApp
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/DATETIME/gi, 'TIMESTAMP')
        .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      
      console.log('⚡ Executando migração 001 no PostgreSQL...');
      await client.query(schemaApp);

      // Índices
      await client.query('CREATE INDEX IF NOT EXISTS idx_testes_usuario ON testes(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_limites_usuario ON limites(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_respostas_teste ON respostas(teste_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_praticas_nome ON praticas(nome)');

      // 2. Aplicar o schema do teste Relacional (004) no Postgres
      let schemaRel = fs.readFileSync(path.resolve(__dirname, 'migrations/004_relational_test.sql'), 'utf8');
      schemaRel = schemaRel
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/DATETIME/gi, 'TIMESTAMP')
        .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      
      console.log('⚡ Executando migração 004 (Mapa Relacional) no PostgreSQL...');
      await client.query(schemaRel);

      // Índices
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_token ON resultados_relacionais(token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_usuario ON resultados_relacionais(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_perguntas_rel_bloco ON perguntas_relacional(bloco)');

      console.log('✅ Migração do banco PostgreSQL concluída com sucesso!');
    } catch (e) {
      console.error('❌ Erro migrando banco Postgres:', e.message);
      throw e;
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    // Modo local padrão SQLite
    console.log('📂 Rodando em modo SQLite (Local)...');
    
    // 1. Migrar bdsm_completo.db (Aplicação)
    const dbApp = await open({ filename: dbAppPath, driver: sqlite3.Database });
    const migrationAppSql = fs.readFileSync(path.resolve(__dirname, 'migrations/001_initial_app.sql'), 'utf8');
    await dbApp.exec(migrationAppSql);
    
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_testes_usuario ON testes(usuario_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_limites_usuario ON limites(usuario_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_respostas_teste ON respostas(teste_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_praticas_nome ON praticas(nome)');
    await dbApp.close();
    console.log('✅ Migração do bdsm_completo.db (Aplicação) concluída!');

    // 2. Migration 004: Teste de Mapa Relacional
    const dbApp2 = await open({ filename: dbAppPath, driver: sqlite3.Database });
    const migrationRelacionalSql = fs.readFileSync(path.resolve(__dirname, 'migrations/004_relational_test.sql'), 'utf8');
    await dbApp2.exec(migrationRelacionalSql);
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_resultados_rel_token ON resultados_relacionais(token)');
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_resultados_rel_usuario ON resultados_relacionais(usuario_id)');
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_perguntas_rel_bloco ON perguntas_relacional(bloco)');
    await dbApp2.close();
    console.log('✅ Migration 004 (Mapa Relacional) concluída!');
  }

  // 3. Migrar bdsm_wiki.db (Wiki) - A Wiki permanece local e offline no SQLite para máxima performance
  const dbWiki = await open({ filename: dbWikiPath, driver: sqlite3.Database });
  const migrationWikiSql = fs.readFileSync(path.resolve(__dirname, 'migrations/002_initial_wiki.sql'), 'utf8');
  await dbWiki.exec(migrationWikiSql);
  
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_slug ON dicionario(slug)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_termo ON dicionario(termo)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria)');
  
  const seedCategorias = fs.readFileSync(path.resolve(__dirname, 'seeds/categorias.sql'), 'utf8');
  await dbWiki.exec(seedCategorias);
  await dbWiki.close();
  
  console.log('✅ Migração do bdsm_wiki.db (Wiki) + Seeds concluída!');
  console.log('🎉 Todas as migrações foram aplicadas com sucesso!');
}

runMigrate().catch(err => {
  console.error('❌ Falha na execução das migrações:', err);
  process.exit(1);
});
