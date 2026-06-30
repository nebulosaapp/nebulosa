import express from 'express';
import cors from 'cors';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { calculateBDSMScores } from './engine.js';
import { processarResultadoRelacional } from './relacional_engine.js';
import { registrarUsuario, loginUsuario, gerarTokenUnico } from './auth.js';
import { LimitRepository } from '../repositories/LimitRepository.js';
import { authMiddleware } from './authMiddleware.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar variáveis do .env localizado na raiz
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.get('/', (req, res) => {
  res.redirect('/login.html');
});
app.use(express.static(path.join(__dirname, '../../../frontend')));

const dbPath = path.resolve(__dirname, '../../../database/bdsm_completo.db');

// Inicializar DB Helper
async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

// Ler perguntas do arquivo de dados para a API
const questionsData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/questions.json'), 'utf-8')
);

// Ler textos do relatório dinâmico por faixas
const textBuckets = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/result_texts.json'), 'utf-8')
);

// Carregar traduções das perguntas (EN e ES)
let questionTranslationsMap = {};
try {
  const translationsData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../data/questions_translations.json'), 'utf-8')
  );
  translationsData.translations.forEach(t => {
    questionTranslationsMap[t.id] = { text_en: t.text_en, text_es: t.text_es };
  });
  console.log(`✅ Traduções carregadas: ${Object.keys(questionTranslationsMap).length} perguntas`);
} catch (e) {
  console.warn('⚠️ Arquivo de traduções não encontrado. Apenas PT estará disponível.');
}

// 1. Cadastrar / Login
app.post('/api/auth/register', async (req, res) => {
  const { identificador, senha, pronome } = req.body;
  const result = await registrarUsuario(identificador, senha, pronome);
  if (!result.success) {
    return res.status(400).json(result);
  }
  // Normalizar resposta para o mesmo formato do login: { token, user: { id, identificador } }
  res.json({
    success: true,
    token: result.token,
    user: { id: result.userId, identificador: identificador?.trim()?.toLowerCase() }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { identificador, senha } = req.body;
  const result = await loginUsuario(identificador, senha);
  res.json(result);
});

// Acesso Anônimo: cria um usuário temporário rastreável sem cadastro
app.post('/api/auth/anonymous', async (req, res) => {
  const { pronome } = req.body;
  const db = await getDb();
  try {
    // Gerar identificador anônimo único
    const anonId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const anonPronome = pronome || 'elu';

    // Inserir no banco com flag is_anonimo
    const result = await db.run(
      `INSERT INTO usuarios (identificador, senha_hash, pronome, is_anonimo) VALUES (?, ?, ?, 1)`,
      [anonId, 'anonymous', anonPronome]
    );
    const userId = result.lastID;

    // Emitir JWT igual aos usuários normais
    const token = jwt.sign(
      { id: userId, identificador: anonId },
      process.env.JWT_SECRET || 'super_segredo_jwt_nebulosa_v4_2026',
      { expiresIn: '7d' }
    );

    await db.close();
    res.json({
      success: true,
      token,
      user: { id: userId, identificador: anonId, is_anonimo: true }
    });
  } catch (error) {
    await db.close();
    res.status(500).json({ success: false, error: error.message });
  }
});

// Associar testes anônimos salvos localmente ao usuário logado
app.post('/api/auth/associate-tests', async (req, res) => {
  const { userId, tokens } = req.body;
  if (!userId || !tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.json({ success: true, message: 'Nenhum token para associar.' });
  }

  const db = await getDb();
  try {
    for (const token of tokens) {
      // Tentar associar em testes_salvos
      await db.run(
        `UPDATE testes_salvos SET usuario_id = ? WHERE token = ? AND usuario_id IS NULL`,
        [userId, token]
      );
      // Tentar associar em resultados_relacionais
      await db.run(
        `UPDATE resultados_relacionais SET usuario_id = ? WHERE token = ? AND usuario_id IS NULL`,
        [userId, token]
      );
    }
    await db.close();
    res.json({ success: true, message: 'Testes associados com sucesso!' });
  } catch (error) {
    await db.close();
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Obter perguntas com base no nível selecionado (basico, medio, completo), perfil e idioma
app.post('/api/start', (req, res) => {
  const { level, profile, lang } = req.body;
  
  let filtered = questionsData.questions.filter(q => {
    if (level === 'basico') return q.levels.includes('basico');
    if (level === 'medio') return q.levels.includes('basico') || q.levels.includes('medio');
    return true;
  });

  // Ordenação inteligente baseada no perfil declarado
  if (profile && profile !== 'nao_sabe') {
    filtered.sort((a, b) => {
      const aMatch = a.profiles.includes(profile) ? 0 : 1;
      const bMatch = b.profiles.includes(profile) ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  // Mesclar traduções nas perguntas se lang for en ou es
  const questionsWithLang = filtered.map(q => {
    const trans = questionTranslationsMap[q.id];
    return {
      ...q,
      text_en: trans ? trans.text_en : q.text,
      text_es: trans ? trans.text_es : q.text
    };
  });

  res.json({ questions: questionsWithLang });
});

// 3. Processar cálculo e gerar o token de resultado
app.post('/api/calculate', async (req, res) => {
  const { answers, userId, level, profile } = req.body;

  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: 'Nenhuma resposta enviada.' });
  }

  const scores = calculateBDSMScores(answers);

  // Ordenar resultados decrescentes
  const sorted = Object.entries(scores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  // Obter faixas textuais do Top 5
  const top5 = sorted.slice(0, 5).map(item => {
    let f = 1;
    if (item.score >= 76) f = 4;
    else if (item.score >= 46) f = 3;
    else if (item.score >= 16) f = 2;
    const texto = textBuckets[item.name] ? textBuckets[item.name][f] : '';
    return { name: item.name, score: item.score, texto };
  });

  // Salvar no SQLite com profile_declarado e pronome do usuário
  const token = await gerarTokenUnico();
  const db = await getDb();
  
  // Extrair e validar o ID do usuário usando o token JWT dos headers (se houver) para evitar fraude de userId
  let jwtUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'super_segredo_jwt_nebulosa_v4_2026');
        jwtUserId = decoded.id;
      } catch (err) {
        console.warn('Token inválido enviado na rota de cálculo:', err.message);
      }
    }
  }

  // Fallback para o userId do body se não tiver token, mas forçando o parseInt
  const finalUserId = jwtUserId ? parseInt(jwtUserId) : (userId ? parseInt(userId) : null);

  let userPronome = 'elu';
  if (finalUserId) {
    const userRow = await db.get(`SELECT pronome FROM usuarios WHERE id = ?`, [finalUserId]);
    if (userRow) userPronome = userRow.pronome;
  }

  await db.run(
    `INSERT INTO testes_salvos (token, usuario_id, level_teste, scores_json, profile_declarado, pronome) VALUES (?, ?, ?, ?, ?, ?)`,
    [token, finalUserId, level || 'completo', JSON.stringify(scores), profile || 'nao_sabe', userPronome]
  );
  await db.close();

  res.json({ token, scores: sorted, top5 });
});

// 4. Buscar Teste por Token
app.get('/api/result/:token', async (req, res) => {
  const normToken = req.params.token.trim().toUpperCase();
  const db = await getDb();
  const test = await db.get(`SELECT * FROM testes_salvos WHERE UPPER(token) = ?`, [normToken]);
  await db.close();

  if (!test) {
    return res.status(404).json({ error: 'Resultado não encontrado.' });
  }

  const scoresObj = JSON.parse(test.scores_json);

  const sorted = Object.entries(scoresObj)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  const top5 = sorted.slice(0, 5).map(item => {
    let f = 1;
    if (item.score >= 76) f = 4;
    else if (item.score >= 46) f = 3;
    else if (item.score >= 16) f = 2;
    const texto = textBuckets[item.name] ? textBuckets[item.name][f] : '';
    return { name: item.name, score: item.score, texto };
  });

  res.json({
    token: test.token,
    scores: sorted,
    top5,
    pronome: test.pronome || 'elu',
    profile_declarado: test.profile_declarado || 'nao_sabe',
    finalizado_em: test.finalizado_em
  });
});

app.post('/api/compare', async (req, res) => {
  const { tokenA, tokenB } = req.body;
  if (!tokenA || !tokenB) {
    return res.status(400).json({ error: 'Tokens não fornecidos.' });
  }

  const normA = tokenA.trim().toUpperCase();
  const normB = tokenB.trim().toUpperCase();
  const db = await getDb();
  
  const testA = await db.get(`SELECT scores_json FROM testes_salvos WHERE UPPER(token) = ?`, [normA]);
  const testB = await db.get(`SELECT scores_json FROM testes_salvos WHERE UPPER(token) = ?`, [normB]);
  
  await db.close();

  if (!testA || !testB) {
    return res.status(404).json({ error: 'Um ou ambos os tokens são inválidos.' });
  }

  const scoresA = JSON.parse(testA.scores_json);
  const scoresB = JSON.parse(testB.scores_json);

  // Algoritmo de Compatibilidade (Díades e Conflitos de Poder)
  const dyadMapping = [
    { active: "Dominant", passive: "Submissive" },
    { active: "Master/Mistress", passive: "Slave" },
    { active: "Owner", passive: "Pet" },
    { active: "Rigger", passive: "Rope bunny" },
    { active: "Sadist", passive: "Masochist" },
    { active: "Degrader", passive: "Degradee" },
    { active: "Brat tamer", passive: "Brat" },
    { active: "Daddy/Mommy", passive: "Little" },
    { active: "Primal (Hunter)", passive: "Primal (Presa)" }
  ];

  let positiveScore = 0;
  let matchesCount = 0;

  dyadMapping.forEach(dyad => {
    // Caso A ativo e B passivo
    const s1 = Math.min(scoresA[dyad.active] || 0, scoresB[dyad.passive] || 0);
    // Caso B ativo e A passivo
    const s2 = Math.min(scoresB[dyad.active] || 0, scoresA[dyad.passive] || 0);

    if (s1 > 15 || s2 > 15) {
      positiveScore += Math.max(s1, s2);
      matchesCount += 1;
    }
  });

  // Switch compatibilidade mútua
  const swA = scoresA["Switch"] || 0;
  const swB = scoresB["Switch"] || 0;
  if (swA > 40 && swB > 40) {
    positiveScore += Math.min(swA, swB) * 0.8;
    matchesCount += 1;
  }

  // Média final das díades ativas
  let finalPercent = matchesCount > 0 ? Math.round(positiveScore / matchesCount) : 35; // Compatibilidade base padrão

  // Penalização por conflitos de liderança ou inércia de passividade
  let conflito = false;
  if (scoresA["Dominant"] > 75 && scoresB["Dominant"] > 75) {
    finalPercent = Math.max(10, finalPercent - 30);
    conflito = true;
  } else if (scoresA["Submissive"] > 75 && scoresB["Submissive"] > 75) {
    finalPercent = Math.max(15, finalPercent - 25);
    conflito = true;
  }

  // Diagnóstico
  let interpretacao = '';
  if (finalPercent >= 76) {
    interpretacao = `Compatibilidade excepcional de ${finalPercent}%! Suas preferências kinky se encaixam de forma perfeita. Onde um busca assumir as regras, o outro sente enorme prazer em ceder o controle, promovendo uma dinâmica segura, excitante e harmoniosa.`;
  } else if (finalPercent >= 41) {
    interpretacao = `Sintonia moderada de ${finalPercent}%. Vocês possuem ótimos pontos de encontro erótico (como interesses em comum), mas precisarão dialogar e negociar regras de controle no cotidiano, já que algumas preferências de liderança podem colidir.`;
  } else {
    interpretacao = `Compatibilidade de ${finalPercent}%. É bastante baixa, sugerindo que suas preferências provavelmente não combinam muito bem. Ambos podem disputar a liderança ou sofrer por inércia de passividade. O diálogo sincero será a chave.`;
  }

  res.json({
    tokenA,
    tokenB,
    compatibilidade: finalPercent,
    conflito,
    interpretacao
  });
});

// 6. Buscar todos os testes salvos (BDSM e Relacional) de um usuário
app.get('/api/user/:userId/tests', authMiddleware, async (req, res) => {
  // Segurança JWT: impede carregar histórico de outro ID
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const db = await getDb();
  try {
    const bdsmTests = await db.all(
      `SELECT token, 'bdsm' AS tipo_teste, scores_json, finalizado_em FROM testes_salvos WHERE usuario_id = ? ORDER BY finalizado_em DESC`,
      [req.params.userId]
    );

    const relTests = await db.all(
      `SELECT r.token, 'relacional' AS tipo_teste, r.score_exclusividade, r.score_seguranca, r.score_estrutura, r.score_posse, r.score_rede, r.criado_em AS finalizado_em, p.nome AS profile_declarado 
       FROM resultados_relacionais r 
       LEFT JOIN perfis_relacionais p ON r.perfil_id = p.id 
       WHERE r.usuario_id = ? ORDER BY r.criado_em DESC`,
      [req.params.userId]
    );

    const formattedRelTests = relTests.map(t => ({
      token: t.token,
      tipo_teste: 'relacional',
      finalizado_em: t.finalizado_em,
      profile_declarado: t.profile_declarado,
      scores_json: JSON.stringify({
        exclusividade: t.score_exclusividade,
        seguranca: t.score_seguranca,
        estrutura: t.score_estrutura,
        posse: t.score_posse,
        rede: t.score_rede
      })
    }));

    const allTests = [...bdsmTests, ...formattedRelTests].sort(
      (a, b) => new Date(b.finalizado_em) - new Date(a.finalizado_em)
    );

    await db.close();
    res.json({ tests: allTests });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Excluir Teste Salvo
app.delete('/api/result/:token', authMiddleware, async (req, res) => {
  const db = await getDb();
  try {
    // Validar se o teste pertence ao usuário logado antes de deletar
    const checkBdsm = await db.get(`SELECT usuario_id FROM testes_salvos WHERE token = ?`, [req.params.token]);
    const checkRel = await db.get(`SELECT usuario_id FROM resultados_relacionais WHERE token = ?`, [req.params.token]);
    const ownerId = (checkBdsm && checkBdsm.usuario_id) || (checkRel && checkRel.usuario_id);

    if (ownerId && parseInt(ownerId) !== parseInt(req.userId)) {
      await db.close();
      return res.status(403).json({ success: false, error: 'Você não tem permissão para remover este teste.' });
    }

    await db.run(`DELETE FROM testes_salvos WHERE token = ?`, [req.params.token]);
    await db.run(`DELETE FROM resultados_relacionais WHERE token = ?`, [req.params.token]);
    await db.close();
    res.json({ success: true });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});



// 9. Buscar Informações de Cadastro do Usuário
app.get('/api/user/:userId', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const db = await getDb();
  const user = await db.get(
    `SELECT identificador, pronome, nome, idade, cidade, email, orientacao_sexual, genero, instagram FROM usuarios WHERE id = ?`,
    [req.params.userId]
  );
  await db.close();
  res.json({ success: true, user });
});

// 10. Atualizar Cadastro do Usuário
app.post('/api/user/:userId', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const { pronome, nome, idade, cidade, email, orientacao_sexual, genero, instagram, identificador } = req.body;
  const db = await getDb();
  
  try {
    await db.run(
      `UPDATE usuarios SET 
        identificador = ?, 
        pronome = ?, 
        nome = ?, 
        idade = ?, 
        cidade = ?, 
        email = ?, 
        orientacao_sexual = ?, 
        genero = ?, 
        instagram = ?
      WHERE id = ?`,
      [identificador, pronome, nome, idade ? parseInt(idade) : null, cidade, email, orientacao_sexual, genero, instagram, req.params.userId]
    );
    await db.close();
    res.json({ success: true });
  } catch (error) {
    await db.close();
    res.json({ success: false, error: error.message });
  }
});

import { WikiService, LimitService } from '../services/WikiService.js';

// 11. Obter termos do dicionário (Wiki)
app.get('/api/wiki/dicionario', async (req, res) => {
  try {
    const search = req.query.q;
    const termos = await WikiService.getTerms(search);
    res.json({ success: true, terms: termos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Obter guias educativos
app.get('/api/wiki/guias', async (req, res) => {
  try {
    const guias = await WikiService.getGuides();
    res.json({ success: true, guias });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Salvar Limite Individual do Usuário (Checklist de Práticas)
app.post('/api/user/:userId/limits', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const { termo, nivel, observacao } = req.body;
  try {
    await LimitService.updateLimit(req.params.userId, termo, nivel, observacao);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Obter Estatísticas de Limites de Perfil
app.get('/api/user/:userId/limits/stats', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  try {
    const stats = await LimitService.getUserStats(req.params.userId);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14c. Obter todos os limites de um usuário de uma vez (para marcar na biblioteca)
app.get('/api/user/:userId/limits/all', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const db = await getDb();
  try {
    const limites = await db.all(
      `SELECT p.nome, l.nivel, l.observacao
       FROM limites l
       JOIN praticas p ON l.pratica_id = p.id
       WHERE l.usuario_id = ?`,
      [req.params.userId]
    );
    await db.close();
    res.json({ success: true, limites });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14b. Listar práticas por nível de consentimento (para o modal editável)
app.get('/api/user/:userId/limits/by-nivel', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  const { nivel } = req.query;
  const db = await getDb();
  try {
    const limites = await db.all(
      `SELECT l.id, l.pratica_id, p.nome, l.nivel, l.observacao
       FROM limites l
       JOIN praticas p ON l.pratica_id = p.id
       WHERE l.usuario_id = ? AND l.nivel = ?
       ORDER BY p.nome ASC`,
      [req.params.userId, nivel]
    );
    await db.close();
    res.json({ success: true, limites });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Calcular Compatibilidade e Sinergia de Limites do Casal
app.post('/api/user/compare-limits', authMiddleware, async (req, res) => {
  const { meuId, parceiroId } = req.body;
  console.log('compare-limits: req.userId =', req.userId, '(type:', typeof req.userId, '), meuId =', meuId, '(type:', typeof meuId, ')');
  // Segurança JWT: O usuário solicitante deve ser o meuId fornecido
  if (parseInt(req.userId) !== parseInt(meuId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  try {
    const sinergia = await LimitService.getSinergia(meuId, parceiroId);
    res.json({ success: true, ...sinergia });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15b. Histórico de Mudanças de Limites (ex: 🟡 → 🟢 em "Wax Play")
app.get('/api/user/:userId/limits/history', authMiddleware, async (req, res) => {
  if (parseInt(req.userId) !== parseInt(req.params.userId)) {
    return res.status(403).json({ success: false, error: 'Acesso proibido.' });
  }
  try {
    const history = await LimitRepository.getLimitHistory(req.params.userId, 15);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Gerar Token Único Seguro de Convite (Ex: 8YKD-2A9P)
app.post('/api/relationship/invite', async (req, res) => {
  const { senderId } = req.body;
  const db = await getDb();
  
  // Gerador de token de 8 caracteres alfanuméricos sem ambiguidades
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) token += '-';
    token += chars[Math.floor(Math.random() * chars.length)];
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Expira em 24h

  try {
    await db.run(
      'INSERT INTO relationship_invites (token, sender_id, expires_at) VALUES (?, ?, ?)',
      [token, senderId, expiresAt]
    );
    await db.close();
    res.json({ success: true, token });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// 17. Aceitar Convite de Relacionamento e Criar Vínculo Consensual
app.post('/api/relationship/accept', async (req, res) => {
  const { receiverId, token } = req.body;
  const db = await getDb();

  try {
    // Buscar convite ativo e válido
    const invite = await db.get(
      'SELECT * FROM relationship_invites WHERE token = ? AND status = "pending"',
      [token.trim().toUpperCase()]
    );

    if (!invite) {
      await db.close();
      return res.status(404).json({ success: false, error: 'Convite inválido ou já expirado.' });
    }

    // Criar o relacionamento na tabela relacionamentos
    const result = await db.run(
      'INSERT INTO relacionamentos (usuario1, usuario2, tipo, ativo) VALUES (?, ?, ?, 1)',
      [invite.sender_id, receiverId, 'casal']
    );

    // Atualizar o status do convite
    await db.run(
      'UPDATE relationship_invites SET status = "accepted", receiver_id = ? WHERE id = ?',
      [receiverId, invite.id]
    );

    await db.close();
    res.json({ success: true, message: 'Relacionamento conectado com sucesso!', parceiroId: invite.sender_id });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ROTAS DO TESTE DE MAPA RELACIONAL ──────────────────────────────────────

// R1. Buscar todas as perguntas relacionais
app.get('/api/relacional/perguntas', async (req, res) => {
  const db = await getDb();
  try {
    const perguntas = await db.all(
      'SELECT id, bloco, bloco_nome, texto, eixo1, eixo2, direcao FROM perguntas_relacional ORDER BY bloco, id'
    );
    await db.close();
    res.json({ success: true, perguntas });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// R2. Calcular e salvar resultado relacional
app.post('/api/relacional/resultado', async (req, res) => {
  const { respostas, userId } = req.body;
  const db = await getDb();
  try {
    // Buscar todas as perguntas com metadados
    const perguntas = await db.all(
      'SELECT id, eixo1, eixo2, direcao FROM perguntas_relacional'
    );

    // Calcular scores e perfil
    const { scores, perfilId } = processarResultadoRelacional(respostas, perguntas);

    // Buscar texto do perfil
    const perfil = await db.get('SELECT * FROM perfis_relacionais WHERE id = ?', [perfilId]);

    // Gerar token único validando na tabela correta
    const token = await gerarTokenUnico('resultados_relacionais');

    const parsedUserId = userId ? parseInt(userId) : null;

    // Salvar resultado
    await db.run(
      `INSERT INTO resultados_relacionais
       (token, usuario_id, perfil_id, score_exclusividade, score_seguranca, score_estrutura, score_posse, score_rede, respostas_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token,
        parsedUserId,
        perfilId,
        scores.exclusividade,
        scores.seguranca,
        scores.estrutura,
        scores.posse,
        scores.rede,
        JSON.stringify(respostas)
      ]
    );

    await db.close();
    res.json({ success: true, token, scores, perfil });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// R3. Buscar resultado relacional por token
app.get('/api/relacional/resultado/:token', async (req, res) => {
  const db = await getDb();
  try {
    const resultado = await db.get(
      'SELECT * FROM resultados_relacionais WHERE token = ?',
      [req.params.token]
    );
    if (!resultado) {
      await db.close();
      return res.status(404).json({ success: false, error: 'Resultado não encontrado.' });
    }
    const perfil = await db.get(
      'SELECT * FROM perfis_relacionais WHERE id = ?',
      [resultado.perfil_id]
    );
    await db.close();
    res.json({
      success: true,
      token: resultado.token,
      perfilId: resultado.perfil_id,
      perfil,
      scores: {
        exclusividade: resultado.score_exclusividade,
        seguranca:     resultado.score_seguranca,
        estrutura:     resultado.score_estrutura,
        posse:         resultado.score_posse,
        rede:          resultado.score_rede,
      }
    });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint para o Render
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Rota amigável para a página do painel administrativo
app.get('/admadm', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../../frontend/admadm.html'));
});

// Endpoint seguro para estatísticas administrativas (acesso via Basic Auth)
app.get('/api/admin/stats', async (req, res) => {
  const auth = req.headers['authorization'];
  // Base64 de 'adminorion:orion123' é 'YWRtaW5vcmlvbjpvcmlvbjEyMw=='
  if (!auth || auth !== 'Basic YWRtaW5vcmlvbjpvcmlvbjEyMw==') {
    return res.status(401).json({ success: false, error: 'Acesso não autorizado.' });
  }

  const db = await getDb();
  try {
    const uCount = await db.get('SELECT COUNT(*) AS total FROM usuarios');
    const uAnonCount = await db.get('SELECT COUNT(*) AS total FROM usuarios WHERE is_anonimo = 1');
    const tCount = await db.get('SELECT COUNT(*) AS total FROM testes_salvos');
    const rCount = await db.get('SELECT COUNT(*) AS total FROM resultados_relacionais');

    // Mapeamento por perfil declarado no teste BDSM
    const profiles = await db.all('SELECT profile_declarado, COUNT(*) AS qtd FROM testes_salvos GROUP BY profile_declarado');
    
    // Mapeamento por nível de teste concluído
    const levels = await db.all('SELECT level_teste, COUNT(*) AS qtd FROM testes_salvos GROUP BY level_teste');

    // Mapeamento de pronomes
    const pronomes = await db.all('SELECT pronome, COUNT(*) AS qtd FROM usuarios GROUP BY pronome');

    await db.close();

    res.json({
      success: true,
      totalUsuarios: uCount.total,
      totalUsuariosAnonimos: uAnonCount ? uAnonCount.total : 0,
      totalTestesBdsm: tCount.total,
      totalTestesRelacionais: rCount.total,
      perfis: profiles,
      niveis: levels,
      pronomes: pronomes
    });
  } catch (err) {
    await db.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BDSM Test Server rodando na porta ${PORT}`);
});
