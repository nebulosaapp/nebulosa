const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function run() {
  try {
    const db = await open({ filename: path.resolve('database/bdsm_wiki.db'), driver: sqlite3.Database });
    
    // Sample 3 terms
    const terms = await db.all(`
      SELECT d.termo, d.termo_ingles, d.descricao_markdown as significado, d.tipo, c.nome as tags 
      FROM dicionario d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      LIMIT 3
    `);
    console.log('=== SAMPLE TERMS ===');
    terms.forEach(t => {
      console.log(`Termo: ${t.termo} | tags: ${t.tags} | tipo: ${t.tipo} | sig_len: ${t.significado?.length}`);
    });
    
    // Check categorias
    const cats = await db.all('SELECT * FROM categorias');
    console.log('\n=== CATEGORIAS ===');
    cats.forEach(c => console.log(` - ${c.id}: ${c.nome}`));
    
    // Check guias
    const guias = await db.all('SELECT slug, titulo, categoria, tempo_leitura, dificuldade FROM guias');
    console.log('\n=== GUIAS ===');
    guias.forEach(g => console.log(` - ${g.titulo} (${g.categoria}) ${g.tempo_leitura}min`));
    
    await db.close();
  } catch(err) {
    console.error('ERRO:', err.message);
  }
}
run();
