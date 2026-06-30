// ============================================================
// RELACIONAL ENGINE — Motor de Cálculo do Mapa Relacional
// Input : { pergunta_id: valor_0_6, ... }  +  perguntas[]
// Output: { scores, perfil, diagnostico }
// ============================================================

/**
 * Converte resposta Likert 0-6 para escala normalizada -3 a +3
 */
function likertParaPeso(valor) {
  return valor - 3; // 0→-3, 3→0, 6→+3
}

/**
 * Calcula os 5 scores a partir das respostas.
 * @param {Object}  respostas   { [pergunta_id]: valor_0_6 }
 * @param {Array}   perguntas   [{ id, eixo1, eixo2, direcao }]
 * @returns {Object} { exclusividade, seguranca, estrutura, posse, rede }  0-100
 */
export function calcularScoresRelacional(respostas, perguntas) {
  const eixos = {
    exclusividade: { soma: 0, count: 0 },
    seguranca:     { soma: 0, count: 0 },
    estrutura:     { soma: 0, count: 0 },
    posse:         { soma: 0, count: 0 },
    rede:          { soma: 0, count: 0 },
  };

  for (const pergunta of perguntas) {
    const valor = respostas[pergunta.id];
    if (valor === undefined || valor === null) continue;

    const peso = likertParaPeso(Number(valor)) * pergunta.direcao;

    // Eixo primário com peso 1.0
    if (eixos[pergunta.eixo1] !== undefined) {
      eixos[pergunta.eixo1].soma  += peso;
      eixos[pergunta.eixo1].count += 1;
    }

    // Eixo secundário com peso 0.5
    if (pergunta.eixo2 && eixos[pergunta.eixo2] !== undefined) {
      eixos[pergunta.eixo2].soma  += peso * 0.5;
      eixos[pergunta.eixo2].count += 0.5;
    }
  }

  // Normalizar cada eixo para 0–100
  // Máximo teórico: count * 3 | Mínimo: count * -3
  const scores = {};
  for (const [nome, { soma, count }] of Object.entries(eixos)) {
    if (count === 0) {
      scores[nome] = 50;
      continue;
    }
    const max = count * 3;
    scores[nome] = Math.round(((soma + max) / (2 * max)) * 100);
    scores[nome] = Math.max(0, Math.min(100, scores[nome]));
  }

  return scores;
}

/**
 * Determina o perfil relacional com base nos 5 scores.
 * Lógica: combinação ponderada dos eixos, com regras de desempate.
 *
 * Perfis:
 *  mono-estrutural  — baixa exclusividade (≤35), baixa rede (≤40)
 *  aberto-controlado — exclusividade 36-55, estrutura baixa (≤45)
 *  poliamor         — rede alta (≥65), exclusividade alta (≥55)
 *  explorador       — estrutura alta (≥65), segurança alta (≥60)
 *  anarquico        — posse muito alta (≥70), rede muito alta (≥70)
 *  hibrido          — perfil padrão / empate
 */
export function determinarPerfil(scores) {
  const { exclusividade, seguranca, estrutura, posse, rede } = scores;

  // Anarquico Relacional: máxima autonomia + rede de vínculos
  if (posse >= 70 && rede >= 70) return 'anarquico';

  // Poliamor Relacional: rede afetiva alta + aceitação de multiplicidade
  if (rede >= 65 && exclusividade >= 55) return 'poliamor';

  // Explorador Fluido: alta flexibilidade + baixa rigidez
  if (estrutura >= 65 && seguranca >= 60) return 'explorador';

  // Mono-Estrutural: baixa tolerância à multiplicidade
  if (exclusividade <= 35 && rede <= 40) return 'mono-estrutural';

  // Aberto Controlado: zona intermediária com preferência por regras
  if (exclusividade >= 36 && exclusividade <= 58 && estrutura <= 52) return 'aberto-controlado';

  // Híbrido Adaptativo: perfil de equilíbrio / sem dominância clara
  return 'hibrido';
}

/**
 * Função principal — processa respostas e retorna resultado completo
 */
export function processarResultadoRelacional(respostas, perguntas) {
  const scores  = calcularScoresRelacional(respostas, perguntas);
  const perfilId = determinarPerfil(scores);

  return {
    scores,
    perfilId,
  };
}
