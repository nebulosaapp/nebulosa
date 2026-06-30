const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function run() {
  const dbPath = path.resolve(__dirname, 'database/bdsm_completo.db');
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('=== TABELAS ===');
    tables.forEach(t => console.log(' -', t.name));
    
    // Checar schema da tabela usuarios
    const cols = await db.all("PRAGMA table_info(usuarios)");
    console.log('\n=== COLUNAS DE USUARIOS ===');
    cols.forEach(c => console.log(` - ${c.name} (${c.type})`));
    
    // Checar se tabela perguntas_relacional existe e tem dados
    try {
      const count = await db.get("SELECT COUNT(*) as cnt FROM perguntas_relacional");
      console.log('\n=== PERGUNTAS_RELACIONAL ===');
      console.log(' Total:', count.cnt);
    } catch(e) {
      console.log('\n❌ perguntas_relacional NÃO EXISTE');
    }

    // Checar resultados_relacionais
    try {
      const cols2 = await db.all("PRAGMA table_info(resultados_relacionais)");
      console.log('\n=== COLUNAS resultados_relacionais ===');
      cols2.forEach(c => console.log(` - ${c.name}`));
    } catch(e) {
      console.log('\n❌ resultados_relacionais NÃO EXISTE');
    }

    await db.close();
  } catch(err) {
    console.error('ERRO:', err.message);
  }
}

run();
