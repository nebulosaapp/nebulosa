const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function run() {
  try {
    const db = await open({ filename: path.resolve('database/bdsm_wiki.db'), driver: sqlite3.Database });
    const guias = await db.all('SELECT slug, titulo FROM guias');
    console.log('=== SLUGS DOS GUIAS ===');
    guias.forEach(g => console.log(` Slug: "${g.slug}" | Titulo: "${g.titulo}"`));
    await db.close();
  } catch(err) {
    console.error('ERRO:', err.message);
  }
}
run();
