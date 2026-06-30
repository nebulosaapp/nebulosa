import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../bdsm_completo.db');

async function seedData() {
  console.log('🌱 Iniciando injeção de Massa de Dados Real...');

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Limpar dados anteriores para evitar duplicação em dev
  await db.exec(`
    DELETE FROM usuarios WHERE identificador IN ('@wellington', '@orion');
    DELETE FROM relacionamentos;
    DELETE FROM testes_salvos;
    DELETE FROM limites;
    DELETE FROM resultados_relacionais;
  `);

  // 1. Criar Usuários
  const hash = await bcrypt.hash('SenhaForte123!', 10);
  
  await db.run(
    `INSERT INTO usuarios (identificador, senha_hash, nome, pronome, idade, cidade, orientacao_sexual, genero) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['@wellington', hash, 'Wellington', 'ele', 28, 'São Paulo - SP', 'Bissexual', 'Cisgênero']
  );
  const wellId = (await db.get(`SELECT id FROM usuarios WHERE identificador = '@wellington'`)).id;

  await db.run(
    `INSERT INTO usuarios (identificador, senha_hash, nome, pronome, idade, cidade, orientacao_sexual, genero) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['@orion', hash, 'Orion', 'ele', 32, 'Rio de Janeiro - RJ', 'Bissexual', 'Cisgênero']
  );
  const orionId = (await db.get(`SELECT id FROM usuarios WHERE identificador = '@orion'`)).id;

  console.log('✅ Usuários Wellington e Orion criados com senha "SenhaForte123!".');

  // 2. Criar Relacionamento
  await db.run(
    `INSERT INTO relacionamentos (usuario1, usuario2, tipo, ativo) VALUES (?, ?, 'casal', 1)`,
    [wellId, orionId]
  );
  console.log('✅ Relacionamento estabelecido.');

  // 3. Criar Testes Salvos (Resultados Simulados)
  const scoreWell = JSON.stringify({
    "Submissive": 85,
    "Brat": 78,
    "Masochist": 70,
    "Rope bunny": 65,
    "Pet": 60,
    "Dominant": 15
  });
  const scoreOrion = JSON.stringify({
    "Dominant": 92,
    "Sadist": 85,
    "Rigger": 80,
    "Master/Mistress": 75,
    "Daddy/Mommy": 70,
    "Submissive": 10
  });

  await db.run(
    `INSERT INTO testes_salvos (token, usuario_id, level_teste, scores_json, profile_declarado, pronome) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['TESTE-WELL', wellId, 'completo', scoreWell, 'submisso', 'ele']
  );

  await db.run(
    `INSERT INTO testes_salvos (token, usuario_id, level_teste, scores_json, profile_declarado, pronome) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['TESTE-ORION', orionId, 'completo', scoreOrion, 'dominante', 'ele']
  );
  console.log('✅ Testes BDSM Individuais salvos.');

  // 4. Teste Relacional Simulado
  const scoreRelWell = { exclusividade: 80, seguranca: 90, estrutura: 85, posse: 75, rede: 40 };
  const scoreRelOrion = { exclusividade: 85, seguranca: 95, estrutura: 90, posse: 80, rede: 35 };
  
  await db.run(
    `INSERT INTO resultados_relacionais (token, usuario_id, perfil_id, score_exclusividade, score_seguranca, score_estrutura, score_posse, score_rede, respostas_json) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['REL-WELL', wellId, 1, scoreRelWell.exclusividade, scoreRelWell.seguranca, scoreRelWell.estrutura, scoreRelWell.posse, scoreRelWell.rede, '{}']
  );
  await db.run(
    `INSERT INTO resultados_relacionais (token, usuario_id, perfil_id, score_exclusividade, score_seguranca, score_estrutura, score_posse, score_rede, respostas_json) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['REL-ORION', orionId, 2, scoreRelOrion.exclusividade, scoreRelOrion.seguranca, scoreRelOrion.estrutura, scoreRelOrion.posse, scoreRelOrion.rede, '{}']
  );
  console.log('✅ Mapa Relacional salvo.');

  // 5. Cadastrar Práticas e Limites
  await db.exec(`
    INSERT OR IGNORE INTO praticas (nome, categoria) VALUES ('Bondage', 'Contenção');
    INSERT OR IGNORE INTO praticas (nome, categoria) VALUES ('Shibari', 'Contenção');
    INSERT OR IGNORE INTO praticas (nome, categoria) VALUES ('Impact Play', 'Impacto');
    INSERT OR IGNORE INTO praticas (nome, categoria) VALUES ('Wax Play', 'Sensorial');
    INSERT OR IGNORE INTO praticas (nome, categoria) VALUES ('Edgeplay', 'Avançado');
  `);

  const praticas = await db.all(`SELECT id, nome FROM praticas`);
  const praticaMap = {};
  praticas.forEach(p => praticaMap[p.nome] = p.id);

  const limitesWell = [
    { nome: 'Bondage', nivel: 'verde', obs: 'Amo cordas apertadas' },
    { nome: 'Shibari', nivel: 'verde', obs: 'Segurança em primeiro lugar' },
    { nome: 'Impact Play', nivel: 'amarelo', obs: 'Apenas spanking leve' },
    { nome: 'Edgeplay', nivel: 'vermelho', obs: 'Não gosto de brincar com fogo' }
  ];

  const limitesOrion = [
    { nome: 'Bondage', nivel: 'verde', obs: 'Gosto de imobilizar' },
    { nome: 'Shibari', nivel: 'verde', obs: 'Treinando suspensões' },
    { nome: 'Impact Play', nivel: 'verde', obs: 'Cane e flogger preferidos' },
    { nome: 'Edgeplay', nivel: 'vermelho', obs: 'Risco alto demais' }
  ];

  for (const l of limitesWell) {
    if(praticaMap[l.nome]) {
      await db.run(`INSERT INTO limites (usuario_id, pratica_id, nivel, observacao) VALUES (?, ?, ?, ?)`, [wellId, praticaMap[l.nome], l.nivel, l.obs]);
    }
  }

  for (const l of limitesOrion) {
    if(praticaMap[l.nome]) {
      await db.run(`INSERT INTO limites (usuario_id, pratica_id, nivel, observacao) VALUES (?, ?, ?, ?)`, [orionId, praticaMap[l.nome], l.nivel, l.obs]);
    }
  }
  console.log('✅ Limites individuais configurados com comentários de observação.');

  await db.close();
  console.log('🚀 SEEDING FINALIZADO COM SUCESSO! Sistema pronto para DEMO.');
}

seedData().catch(err => {
  console.error('❌ Erro no Seeding:', err);
});
