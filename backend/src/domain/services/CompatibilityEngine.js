import { WikiRepository } from '../repositories/WikiRepository.js';

export class CompatibilityEngine {
  /**
   * Calcula o relatório completo de compatibilidade consensual (Motor de Compatibilidade)
   * @param {Array} limitesA - Limites do Usuário A
   * @param {Array} limitesB - Limites do Usuário B
   */
  static async calculate(limitesA, limitesB) {
    const mapA = new Map(limitesA.map(l => [l.pratica_id, l]));
    const mapB = new Map(limitesB.map(l => [l.pratica_id, l]));

    // Obter todos os IDs de práticas avaliados por pelo menos um
    const praticasIds = new Set([...mapA.keys(), ...mapB.keys()]);
    
    let comunsCount = 0;
    let conflitosCount = 0;
    const verdes = [];
    const conversar = [];
    
    // Mapeador de categorias para scores agregados
    const categoriasScore = {};

    for (const praticaId of praticasIds) {
      const limiteA = mapA.get(praticaId);
      const limiteB = mapB.get(praticaId);

      const nivelA = limiteA ? limiteA.nivel : 'nunca_pensei';
      const nivelB = limiteB ? limiteB.nivel : 'nunca_pensei';
      
      const nomePratica = limiteA ? limiteA.nome : (limiteB ? limiteB.nome : 'Prática');
      const categoria = limiteA ? limiteA.categoria : (limiteB ? limiteB.categoria : 'Geral');

      // Inicializar categoria no agregador
      if (!categoriasScore[categoria]) {
        categoriasScore[categoria] = { comuns: 0, total: 0 };
      }

      // Se qualquer um dos dois marcar vermelho, é um limite rígido (conflito)
      if (nivelA === 'vermelho' || nivelB === 'vermelho') {
        conflitosCount++;
        categoriasScore[categoria].total++;
        continue;
      }

      // Se ambos marcarem verde, é prática comum
      if (nivelA === 'verde' && nivelB === 'verde') {
        comunsCount++;
        categoriasScore[categoria].comuns++;
        categoriasScore[categoria].total++;
        verdes.push({
          nome: nomePratica,
          categoria,
          obs_A: limiteA ? limiteA.observacao : '',
          obs_B: limiteB ? limiteB.observacao : ''
        });
      }
      // Se houver mistura com amarelo, entra em pontos de conversa/negociação
      else if (nivelA === 'amarelo' || nivelB === 'amarelo' || (nivelA === 'verde' && nivelB === 'nunca_pensei') || (nivelB === 'verde' && nivelA === 'nunca_pensei')) {
        comunsCount++;
        categoriasScore[categoria].comuns += 0.5; // Peso menor
        categoriasScore[categoria].total++;
        conversar.push({
          nome: nomePratica,
          categoria,
          nivel_A: nivelA,
          nivel_B: nivelB,
          obs_A: limiteA ? limiteA.observacao : '',
          obs_B: limiteB ? limiteB.observacao : ''
        });
      }
    }

    // Calcular taxa de compatibilidade geral
    let compatibilidade = 50;
    const totalAvaliados = comunsCount + conflitosCount;
    if (totalAvaliados > 0) {
      compatibilidade = Math.round((comunsCount / totalAvaliados) * 100);
    }

    // Processar compatibilidade agregada por categoria
    const categorias = {};
    for (const [catName, data] of Object.entries(categoriasScore)) {
      if (data.total > 0) {
        categorias[catName] = Math.round((data.comuns / data.total) * 100);
      } else {
        categorias[catName] = 50;
      }
    }

    // Recomendações automáticas baseadas em guias da wiki para práticas comuns
    const guiasDisponiveis = await WikiRepository.findGuides();
    const guiasRecomendados = [];
    
    // Mapeamento simples de interesse para guias
    const termosVerdes = verdes.map(v => v.nome.toLowerCase());
    if (termosVerdes.some(t => t.includes('shibari') || t.includes('rope') || t.includes('bondage'))) {
      const guiaSeg = guiasDisponiveis.find(g => g.slug.includes('seguranca'));
      if (guiaSeg) guiasRecomendados.push(guiaSeg);
    }
    if (termosVerdes.some(t => t.includes('impact') || t.includes('wax') || t.includes('dor'))) {
      const guiaDrop = guiasDisponiveis.find(g => g.slug.includes('drop'));
      if (guiaDrop) guiasRecomendados.push(guiaDrop);
    }
    
    // Sempre sugerir guias de consentimento
    const guiaConsent = guiasDisponiveis.find(g => g.slug.includes('consentimento') || g.slug.includes('safewords'));
    if (guiaConsent) guiasRecomendados.push(guiaConsent);

    return {
      compatibilidade,
      comunsCount,
      conflitosCount,
      categorias,
      verdes,
      conversar,
      guiasRecomendados
    };
  }
}
