import { DatabaseConnection } from '../infrastructure/database.js';

export class WikiRepository {
  static async findTerms(searchQuery) {
    const db = await DatabaseConnection.getWikiDb();
    let query = `
      SELECT d.termo, d.termo_ingles, d.descricao_markdown as significado, d.tipo, c.nome as tags 
      FROM dicionario d
      LEFT JOIN categorias c ON d.categoria_id = c.id
    `;
    let params = [];
    if (searchQuery) {
      query += ' WHERE d.termo LIKE ? OR d.termo_ingles LIKE ? OR d.descricao_markdown LIKE ?';
      params = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`];
    }
    const terms = await db.all(query, params);
    await db.close();
    return terms;
  }

  static async findGuides() {
    const db = await DatabaseConnection.getWikiDb();
    const guides = await db.all(`
      SELECT slug, titulo, categoria, conteudo_md as conteudo_markdown, 
             tempo_leitura as tempo_leitura_min, dificuldade 
      FROM guias
    `);
    await db.close();
    return guides;
  }
}
