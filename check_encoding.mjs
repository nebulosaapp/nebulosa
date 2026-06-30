import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbWikiPath = path.resolve(__dirname, 'database/bdsm_wiki.db');

async function check() {
  const db = await open({ filename: dbWikiPath, driver: sqlite3.Database });
  
  // Check PRAGMA encoding
  const enc = await db.get('PRAGMA encoding');
  console.log('DB Encoding:', enc);
  
  // Test with a term that has accents
  const term = await db.get("SELECT termo, descricao_markdown FROM dicionario WHERE slug = 'seguranca'");
  if (term) {
    console.log('Termo:', term.termo);
    console.log('Desc:', term.descricao_markdown?.substring(0, 100));
  } else {
    const first = await db.get("SELECT termo, descricao_markdown FROM dicionario LIMIT 1");
    console.log('First term:', first?.termo);
    console.log('First desc:', first?.descricao_markdown?.substring(0, 100));
    // Buffer check
    const buf = Buffer.from(first?.descricao_markdown || '', 'binary');
    console.log('Raw hex (first 20 bytes):', buf.slice(0, 20).toString('hex'));
  }
  
  await db.close();
}

check().catch(console.error);
