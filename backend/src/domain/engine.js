import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler dados das perguntas reescritas e mapeamentos
const questionsData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/questions.json'), 'utf-8')
);

const CATEGORIES = {
  DOMINANT: 'Dominant',
  SUBMISSIVE: 'Submissive',
  MASTER_MISTRESS: 'Master/Mistress',
  SLAVE: 'Slave',
  OWNER: 'Owner',
  PET: 'Pet',
  RIGGER: 'Rigger',
  ROPE_BUNNY: 'Rope bunny',
  SADIST: 'Sadist',
  MASOCHIST: 'Masochist',
  VOYEUR: 'Voyeur',
  EXHIBITIONIST: 'Exhibitionist',
  DADDY_MOMMY: 'Daddy/Mommy',
  LITTLE: 'Little',
  DEGRADER: 'Degrader',
  DEGRADEE: 'Degradee',
  BRAT_TAMER: 'Brat tamer',
  BRAT: 'Brat',
  EXPERIMENTALIST: 'Experimentalist',
  VANILLA: 'Vanilla',
  PRIMAL_HUNTER: 'Primal (Hunter)',
  PRIMAL_PREY: 'Primal (Presa)',
  NON_MONOGAMIST: 'Non-monogamist',
  AGEPLAYER: 'Ageplayer',
  SWITCH: 'Switch'
};

export function calculateBDSMScores(answers) {
  const categoryScores = {};
  const categoryMaxScores = {};

  // Inicializar acumuladores
  Object.values(CATEGORIES).forEach(cat => {
    categoryScores[cat] = 0;
    categoryMaxScores[cat] = 0;
  });

  // Mapear e calcular scores
  questionsData.questions.forEach(q => {
    const userAns = answers[q.id];
    if (userAns === undefined) return; // ignora se não respondido (ex: nível básico/médio)

    q.cats.forEach(cat => {
      const factor = q.factor !== undefined ? q.factor : 1.0;
      
      // Mapear escala 0-6 para peso
      // Caso seja Vanilla invertido, tratamos na normalização ou nos pesos
      const weight = Math.abs(factor);
      categoryMaxScores[cat] += 6 * weight;

      if (factor === -1.0) {
        categoryScores[cat] += (6 - userAns) * weight;
      } else {
        categoryScores[cat] += userAns * weight;
      }
    });
  });

  // 1. Média Ponderada e Normalização Inicial
  const percentages = {};
  Object.values(CATEGORIES).forEach(cat => {
    const max = categoryMaxScores[cat];
    if (max > 0) {
      percentages[cat] = Math.round((categoryScores[cat] / max) * 100);
    } else {
      percentages[cat] = 0;
    }
  });

  // 2. Lógica Switch (Média Harmônica entre Dominante e Submisso)
  const dom = percentages[CATEGORIES.DOMINANT] || 0;
  const sub = percentages[CATEGORIES.SUBMISSIVE] || 0;
  if (dom > 15 && sub > 15) {
    // Média Harmônica pune alta disparidade
    const harmonicMean = Math.round((2 * dom * sub) / (dom + sub));
    percentages[CATEGORIES.SWITCH] = harmonicMean;
  } else {
    percentages[CATEGORIES.SWITCH] = 0;
  }

  // 3. Regra Vanilla Inversa Fina
  // Iniciamos com 100% e deduzimos com base na pontuação média kinky (excluindo Vanilla e Switch)
  let kinkySum = 0;
  let kinkyCount = 0;
  Object.entries(percentages).forEach(([cat, val]) => {
    if (cat !== CATEGORIES.VANILLA && cat !== CATEGORIES.SWITCH) {
      kinkySum += val;
      kinkyCount += 1;
    }
  });
  
  const avgKinky = kinkyCount > 0 ? kinkySum / kinkyCount : 0;
  // Deduz progressivamente baseado no comportamento kinky
  const vanillaCalculated = Math.max(0, Math.round(100 - avgKinky * 2.2));
  percentages[CATEGORIES.VANILLA] = vanillaCalculated;

  return percentages;
}
