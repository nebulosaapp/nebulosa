import { DatabaseConnection } from '../infrastructure/database.js';

export class LimitRepository {
  static async saveLimit(userId, termo, nivel, observacao) {
    const db = await DatabaseConnection.getAppDb();
    
    // Garantir que a prática exista
    await db.run(
      'INSERT OR IGNORE INTO praticas (nome, categoria) VALUES (?, ?)',
      [termo, 'Geral']
    );
    const pratica = await db.get('SELECT id FROM praticas WHERE nome = ?', [termo]);
    
    // Buscar nível anterior (para registrar histórico de mudança)
    const limiteAtual = await db.get(
      'SELECT nivel FROM limites WHERE usuario_id = ? AND pratica_id = ?',
      [userId, pratica.id]
    );
    const nivelAnterior = limiteAtual ? limiteAtual.nivel : null;
    
    // Salvar/atualizar limite atual
    await db.run(
      `INSERT INTO limites (usuario_id, pratica_id, nivel, observacao) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(usuario_id, pratica_id) DO UPDATE SET nivel = ?, observacao = ?`,
      [userId, pratica.id, nivel, observacao || '', nivel, observacao || '']
    );
    
    // Registrar histórico somente se o nível MUDOU
    if (nivelAnterior !== nivel) {
      await db.run(
        `INSERT INTO limit_history (usuario_id, pratica_id, nivel_anterior, nivel_novo, observacao)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, pratica.id, nivelAnterior, nivel, observacao || '']
      );
    }
    
    await db.close();
    return true;
  }

  static async getLimitHistory(userId, limit = 10) {
    const db = await DatabaseConnection.getAppDb();
    const rows = await db.all(
      `SELECT lh.nivel_anterior, lh.nivel_novo, lh.observacao, lh.mudado_em, p.nome as pratica
       FROM limit_history lh
       JOIN praticas p ON lh.pratica_id = p.id
       WHERE lh.usuario_id = ?
       ORDER BY lh.mudado_em DESC
       LIMIT ?`,
      [userId, limit]
    );
    await db.close();
    return rows;
  }

  static async getStats(userId) {
    const db = await DatabaseConnection.getAppDb();
    const rows = await db.all(
      'SELECT nivel, count(*) as count FROM limites WHERE usuario_id = ? GROUP BY nivel',
      [userId]
    );
    await db.close();
    
    const stats = { verde: 0, amarelo: 0, vermelho: 0 };
    rows.forEach(r => {
      if (stats[r.nivel] !== undefined) {
        stats[r.nivel] = r.count;
      }
    });
    return stats;
  }

  static async compareLimits(userId, partnerId) {
    const db = await DatabaseConnection.getAppDb();
    
    // Obter todos os limites detalhados do usuário A
    const limitesA = await db.all(
      `SELECT l.pratica_id, p.nome, p.categoria, l.nivel, l.observacao 
       FROM limites l
       JOIN praticas p ON l.pratica_id = p.id
       WHERE l.usuario_id = ?`,
      [userId]
    );

    // Obter todos os limites detalhados do usuário B
    const limitesB = await db.all(
      `SELECT l.pratica_id, p.nome, p.categoria, l.nivel, l.observacao 
       FROM limites l
       JOIN praticas p ON l.pratica_id = p.id
       WHERE l.usuario_id = ?`,
      [partnerId]
    );

    await db.close();

    // Import dinâmico do CompatibilityEngine para evitar imports circulares indesejados
    const { CompatibilityEngine } = await import('../domain/services/CompatibilityEngine.js');
    return await CompatibilityEngine.calculate(limitesA, limitesB);
  }
}
