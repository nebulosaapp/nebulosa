import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbWikiPath = path.resolve(__dirname, 'database/bdsm_wiki.db');

const categorias = [
  { id: 1, nome: 'Fundamentos', cor: '#ff3333', icone: '📖' },
  { id: 2, nome: 'Segurança', cor: '#00d084', icone: '🛡️' },
  { id: 3, nome: 'Papéis', cor: '#9b51e0', icone: '👥' },
  { id: 4, nome: 'Sensação', cor: '#ff6900', icone: '⚡' },
  { id: 5, nome: 'Corporais', cor: '#e91e8c', icone: '💫' },
  { id: 6, nome: 'Vestuário', cor: '#4cc9f0', icone: '👗' },
  { id: 7, nome: 'Materiais', cor: '#f72585', icone: '🔗' },
  { id: 8, nome: 'Contenção', cor: '#7209b7', icone: '🪢' },
  { id: 9, nome: 'Impacto', cor: '#cf2e2e', icone: '💥' },
  { id: 10, nome: 'Sensorial', cor: '#3a86ff', icone: '👁️' },
  { id: 11, nome: 'Avançado', cor: '#ff006e', icone: '⚠️' },
  { id: 12, nome: 'Roleplay', cor: '#8ac926', icone: '🎭' },
];

const termos = [
  // Fundamentos
  { slug: 'bdsm', termo: 'BDSM', termo_ingles: 'BDSM', descricao: 'Acrônimo que representa as práticas de Bondage/Disciplina, Dominância/Submissão e Sadismo/Masoquismo. O BDSM é uma expressão sexual e relacional consensual entre adultos.', categoria_id: 1, tipo: 'conceito' },
  { slug: 'ssc', termo: 'SSC', termo_ingles: 'SSC - Safe, Sane, Consensual', descricao: 'Filosofia do BDSM ético: Seguro, Saudável e Consensual. Propõe que todas as práticas devem ser fisicamente seguras, mentalmente saudáveis e acordadas previamente.', categoria_id: 1, tipo: 'protocolo' },
  { slug: 'rack', termo: 'RACK', termo_ingles: 'RACK - Risk-Aware Consensual Kink', descricao: 'Filosofia alternativa ao SSC que reconhece que algumas práticas têm riscos inerentes, mas os aceita conscientemente. Foca na consciência total dos riscos por todos os envolvidos.', categoria_id: 1, tipo: 'protocolo' },
  { slug: 'prick', termo: 'PRICK', termo_ingles: 'PRICK - Personal Responsibility Informed Consensual Kink', descricao: 'Evolução do RACK que adiciona responsabilidade pessoal: cada participante é responsável pelas consequências de suas escolhas consensuais.', categoria_id: 1, tipo: 'protocolo' },
  { slug: 'safeword', termo: 'Safeword', termo_ingles: 'Safeword', descricao: 'Palavra ou sinal previamente combinado entre os parceiros para interromper imediatamente qualquer atividade. Deve ser respeitada absolutamente e sem questionamentos.', categoria_id: 2, tipo: 'protocolo' },
  { slug: 'aftercare', termo: 'Aftercare', termo_ingles: 'Aftercare', descricao: 'Cuidados físicos e emocionais fornecidos após uma cena de BDSM. Inclui hidratação, afeto, mantas aquecidas e diálogo reconfortante para prevenir o Drop.', categoria_id: 2, tipo: 'protocolo' },
  { slug: 'subdrop', termo: 'Sub Drop', termo_ingles: 'Sub Drop / Drop', descricao: 'Queda hormonal que pode ocorrer horas ou dias após uma sessão intensa. Sintomas: tristeza inexplicável, cansaço, insegurança. Tratado com aftercare adequado.', categoria_id: 2, tipo: 'conceito' },
  { slug: 'domdrop', termo: 'Dom Drop', termo_ingles: 'Dom Drop / Top Drop', descricao: 'Queda emocional que afeta o parceiro dominante após uma cena. Manifestado por sentimento de culpa, exaustão e questionamentos sobre a sessão.', categoria_id: 2, tipo: 'conceito' },
  { slug: 'negociacao', termo: 'Negociação', termo_ingles: 'Negotiation / Scene Negotiation', descricao: 'Conversa estruturada antes de uma cena para definir limites, preferências, safewords, nível de intensidade e qualquer outra condição necessária para o consentimento pleno.', categoria_id: 2, tipo: 'protocolo' },
  { slug: 'hardlimit', termo: 'Hard Limit', termo_ingles: 'Hard Limit', descricao: 'Limite rígido e inegociável. Práticas que um participante nunca está disposto a realizar, independentemente de qualquer circunstância ou pressão.', categoria_id: 2, tipo: 'protocolo' },
  { slug: 'softlimit', termo: 'Soft Limit', termo_ingles: 'Soft Limit', descricao: 'Limite flexível que pode ser negociado com o parceiro certo, no contexto certo, com a preparação adequada. Não é um "não absoluto", mas requer cuidado extra.', categoria_id: 2, tipo: 'protocolo' },
  // Papéis
  { slug: 'dominant', termo: 'Dominante', termo_ingles: 'Dominant / Dom / Domme', descricao: 'Pessoa que assume o papel de controle, liderança e autoridade em uma dinâmica consensual. Responsável pelo bem-estar e segurança do submisso durante as cenas.', categoria_id: 3, tipo: 'papel' },
  { slug: 'submisso', termo: 'Submisso', termo_ingles: 'Submissive / Sub', descricao: 'Pessoa que delega voluntariamente o controle e a autoridade ao dominante dentro de uma dinâmica consensual. O poder real de parar a cena pertence ao submisso via safeword.', categoria_id: 3, tipo: 'papel' },
  { slug: 'switch', termo: 'Switch', termo_ingles: 'Switch', descricao: 'Pessoa que transita entre os papéis dominante e submisso, podendo assumir qualquer posição dependendo do parceiro, da cena ou do seu estado emocional.', categoria_id: 3, tipo: 'papel' },
  { slug: 'master-slave', termo: 'Master/Slave', termo_ingles: 'Master / Slave (M/s)', descricao: 'Dinâmica de Poder Total (TPE - Total Power Exchange) onde o escravo cede controle amplo da vida ao Mestre, além das cenas pontuais. Exige negociação extremamente detalhada.', categoria_id: 3, tipo: 'papel' },
  { slug: 'daddy-mommy', termo: 'Daddy/Mommy Kink', termo_ingles: 'Daddy Dom / Mommy Dom (DD/lg)', descricao: 'Dinâmica de cuidado e proteção entre um parceiro cuidador (Daddy/Mommy) e um parceiro que regride emocionalmente (Little/Baby). Baseado em afeto e segurança.', categoria_id: 3, tipo: 'papel' },
  { slug: 'little', termo: 'Little', termo_ingles: 'Little / Baby Girl / Baby Boy', descricao: 'Pessoa que explora a regressão a um estado emocional mais jovem como forma de descanso mental e entrega. Relaciona-se com o cuidador (Daddy/Mommy).', categoria_id: 3, tipo: 'papel' },
  { slug: 'brat', termo: 'Brat', termo_ingles: 'Brat', descricao: 'Submisso que desafia ativamente o dominante com desobediência intencional e humor travesso. O conflito e a "conquista" do controle fazem parte da dinâmica.', categoria_id: 3, tipo: 'papel' },
  { slug: 'primal', termo: 'Primal', termo_ingles: 'Primal / Primal Play', descricao: 'Dinâmica instintiva e animalesca que desperta impulsos primitivos de caça e presa. O Primal Hunter persegue e captura o Primal Prey em cenas de luta física controlada.', categoria_id: 3, tipo: 'papel' },
  // Práticas de Sensação
  { slug: 'impact-play', termo: 'Impact Play', termo_ingles: 'Impact Play', descricao: 'Prática que envolve impacto físico controlado sobre o corpo, como palmadas (spanking), chicote de tiras (flogging), remos (paddles) e varas. Exige conhecimento das áreas seguras.', categoria_id: 9, tipo: 'pratica' },
  { slug: 'wax-play', termo: 'Wax Play', termo_ingles: 'Wax Play', descricao: 'Uso sensorial de cera de vela de baixa fusão derretida sobre a pele para estimulação térmica e sensorial. Requer velas específicas sem corantes e fragrâncias.', categoria_id: 10, tipo: 'pratica' },
  { slug: 'sensory-deprivation', termo: 'Privação Sensorial', termo_ingles: 'Sensory Deprivation', descricao: 'Técnica que bloqueia um ou mais sentidos (visão com venda, audição com protetores, toque com luvas) para amplificar os sentidos restantes e aumentar a entrega.', categoria_id: 10, tipo: 'pratica' },
  { slug: 'temperature-play', termo: 'Temperature Play', termo_ingles: 'Temperature Play', descricao: 'Jogo com contrastes de temperatura: gelo, velas de cera fria, cubos de gelo, metais aquecidos. Estimula nervos da pele e cria sensações intensas e contrastantes.', categoria_id: 10, tipo: 'pratica' },
  { slug: 'knife-play', termo: 'Knife Play', termo_ingles: 'Knife Play', descricao: 'Uso de facas ou lâminas sobre a pele para estimulação psicológica e sensorial através da frieza do metal e da tensão. Não deve incluir cortes. Prática avançada.', categoria_id: 11, tipo: 'pratica' },
  { slug: 'edge-play', termo: 'Edgeplay', termo_ingles: 'Edgeplay', descricao: 'Práticas que beiram limites biológicos ou psicológicos de alto risco, como breath play ou fire play. Exigem treinamento específico e são contraindicadas para iniciantes.', categoria_id: 11, tipo: 'pratica' },
  // Contenção
  { slug: 'bondage', termo: 'Bondage', termo_ingles: 'Bondage', descricao: 'Prática consensual de restringir a mobilidade de um parceiro através de cordas, algemas, faixas ou outros meios. Base do B em BDSM.', categoria_id: 8, tipo: 'pratica' },
  { slug: 'shibari', termo: 'Shibari', termo_ingles: 'Shibari / Kinbaku', descricao: 'Arte japonesa tradicional de amarração com cordas focada na beleza estética, técnica e na entrega emocional. O rigging (amarrador) é um artista e responsável pela segurança do modelo.', categoria_id: 8, tipo: 'tecnica' },
  { slug: 'mummification', termo: 'Mummification', termo_ingles: 'Mummification', descricao: 'Prática avançada de bondage em que o corpo é inteiramente envolto com faixas, plástico ou tiras, restringindo totalmente a mobilidade. Requer ventilação, monitoramento e corte rápido.', categoria_id: 8, tipo: 'pratica' },
  { slug: 'chastity-play', termo: 'Chastity Play', termo_ingles: 'Chastity Play', descricao: 'Uso de dispositivos de castidade (gaiolas ou cintos) para negar o orgasmo físico ou delegar o controle do prazer ao parceiro. Popular em dinâmicas D/s e M/s.', categoria_id: 4, tipo: 'pratica' },
  { slug: 'tease-denial', termo: 'Tease and Denial', termo_ingles: 'Tease and Denial', descricao: 'Estimulação constante seguida pela negação repetida do orgasmo para elevar a submissão, tensão e entrega do parceiro passivo.', categoria_id: 4, tipo: 'pratica' },
  // Fetiche - Corporal
  { slug: 'pygophilia', termo: 'Pigofilia', termo_ingles: 'Pygophilia / Butt Fetish', descricao: 'Atração intensa e erotização das nádegas. Um dos fetiches mais comuns documentados, presente em diversas culturas ao redor do mundo.', categoria_id: 5, tipo: 'fetiche' },
  { slug: 'mazofilia', termo: 'Mazofilia', termo_ingles: 'Mazophilia / Breast Fetish', descricao: 'Fetiche e atração erótica direcionados aos seios femininos. Pode incluir lactação, beleza estética ou toque sensorial específico.', categoria_id: 5, tipo: 'fetiche' },
  // Fetiche - Material
  { slug: 'couro', termo: 'Couro', termo_ingles: 'Leather Fetish', descricao: 'Atração estética e sensorial por vestimentas e itens feitos de couro legítimo ou sintético. O cheiro, textura e aparência do couro são os elementos centrais da excitação.', categoria_id: 7, tipo: 'fetiche' },
  { slug: 'latex', termo: 'Látex', termo_ingles: 'Latex / Rubber', descricao: 'Fetiche por vestuário de borracha ou látex colado ao corpo e com odor característico. O aperto, brilho e sensação de segunda pele são elementos centrais.', categoria_id: 7, tipo: 'fetiche' },
  { slug: 'spandex', termo: 'Spandex', termo_ingles: 'Spandex / Lycra', descricao: 'Fetiche por roupas extremamente colantes feitas de lycra ou elastano. Apelo visual e tátil do material que revela e comprime o corpo ao mesmo tempo.', categoria_id: 7, tipo: 'fetiche' },
  // Sensorial
  { slug: 'sploshing', termo: 'Sploshing', termo_ingles: 'Sploshing / WAM (Wet And Messy)', descricao: 'Prazer sensorial e erótico em derramar substâncias viscosas, molhadas ou bagunçadas (como lama, chantilly ou chocolate) sobre o corpo. Também chamado de WAM.', categoria_id: 10, tipo: 'pratica' },
  { slug: 'urofilia', termo: 'Urofilia', termo_ingles: 'Urophilia / Golden Shower', descricao: 'Fetiche que envolve a excitação erótica com a urina, seja assistindo, recebendo ou urinando no parceiro. Requer comunicação clara e higiene adequada.', categoria_id: 10, tipo: 'fetiche' },
  { slug: 'lactofilia', termo: 'Lactofilia', termo_ingles: 'Lactophilia', descricao: 'Fetiche focado na amamentação de adultos ou consumo erótico de leite materno. Frequentemente associado a dinâmicas de cuidado e regressão.', categoria_id: 10, tipo: 'fetiche' },
  { slug: 'dacrifilia', termo: 'Dacrifilia', termo_ingles: 'Dacryphilia', descricao: 'Atração em ver o parceiro chorar ou expressar sofrimento emocional ou físico consensual. Pode ser combinada com dinâmicas de humilhação ou cuidado.', categoria_id: 10, tipo: 'fetiche' },
  // Roleplay
  { slug: 'pet-play', termo: 'Pet Play', termo_ingles: 'Pet Play / Animal Play', descricao: 'Interpretação lúdica em que um adulto assume o papel de um animal de estimação (Puppy Play, Pony Play, Kitten Play). O cuidador cuida e treina o "pet" de forma consensual.', categoria_id: 12, tipo: 'pratica' },
  { slug: 'age-play', termo: 'Age Play', termo_ingles: 'Age Play', descricao: 'Dinâmica teatral e consensual de regressão a uma idade estética mais jovem entre adultos. Foca no cuidado, proteção e inocência. Não envolve menores.', categoria_id: 12, tipo: 'pratica' },
  // Vestuário
  { slug: 'catsuit', termo: 'Catsuit', termo_ingles: 'Catsuit', descricao: 'Macacão inteiramente justo feito de látex, vinil, couro ou lycra que envolve todo o corpo. Popular no fetiche de látex e nas estéticas kink.', categoria_id: 6, tipo: 'fetiche' },
  { slug: 'zentai', termo: 'Zentai', termo_ingles: 'Zentai', descricao: 'Traje de corpo inteiro feito de lycra ou nylon elástico que cobre inclusive o rosto e a cabeça, eliminando traços faciais. Popular no fetiche de anonimato.', categoria_id: 6, tipo: 'fetiche' },
  // Avançado
  { slug: 'cnc', termo: 'CNC', termo_ingles: 'CNC - Consensual Non-Consent', descricao: 'Cena de simulação consensual de não-consentimento previamente negociada sob estrito controle e termos de segurança. Exige negociação extensa, confiança profunda e safeword robusta.', categoria_id: 11, tipo: 'pratica' },
];

const guias = [
  {
    slug: 'seguranca-fisica-e-areas-de-impacto',
    titulo: 'Princípios de Segurança Física e Áreas de Impacto',
    categoria: 'Segurança',
    conteudo_md: `No **Impact Play**, a segurança anatômica é inegociável. A escolha das áreas corretas evita danos permanentes aos órgãos e nervos.

### Zonas Seguras (Verde)
*   **Nádegas:** Camadas de gordura e músculos volumosos amortece perfeitamente o impacto sem lesar órgãos vitais.
*   **Coxas (posterior e lateral):** Região muscular forte, ideal para receber estímulos e marcas temporárias.

### Zonas de Atenção (Amarelo)
*   **Costas Superiores:** Evite impacto direto na coluna. Laterais da escápula podem ser exploradas com leveza.

### Zonas Proibidas (Vermelho - Nunca!)
*   **Coluna Vertebral:** Risco extremo de lesões neurológicas.
*   **Rins (lombar baixa):** Órgãos vitais desprotegidos. Golpes podem causar sangramento interno.
*   **Cóccix e Articulações:** Risco de fraturas dolorosas e danos permanentes.
*   **Pescoço e Cabeça:** Risco de desmaios e lesões vasculares graves.

*Mantenha sempre tesouras de ponta redonda (safety scissors) ao alcance no bondage e revise a circulação sanguínea das extremidades a cada 10 minutos.*`,
    tempo_leitura: 5,
    dificuldade: 'Médio',
  },
  {
    slug: 'filosofias-de-consentimento-e-safewords',
    titulo: 'Filosofias de Consentimento e o Semáforo das Safewords',
    categoria: 'Negociação',
    conteudo_md: `O estabelecimento de acordos explícitos é a chave para o BDSM ético. A utilização de **Safewords** baseadas no sistema de Semáforo garante controle e segurança contínua durante as cenas.

### O Semáforo Clássico
1.  🟢 **Verde (Green):** Ritmo ideal. A cena pode progredir ou continuar com o nível de intensidade atual.
2.  🟡 **Amarelo (Yellow):** Alerta de proximidade com limites. Indica necessidade de diminuir a velocidade ou ajustar.
3.  🔴 **Vermelho (Red):** **PARADA IMEDIATA.** Todo estímulo cessa no mesmo instante e o acolhimento começa.

### Alternativas Não-Vocais
Em momentos onde mordaças impossibilitam a fala, o parceiro passivo deve segurar um objeto pesado (como chaves de metal) na mão suspensa. Se o objeto cair, equivale instantaneamente a uma Safeword Vermelha.`,
    tempo_leitura: 4,
    dificuldade: 'Fácil',
  },
  {
    slug: 'saude-mental-e-hormonal-drop',
    titulo: 'Saúde Mental e Emocional: Entendendo o Sub Drop e o Dom Drop',
    categoria: 'Segurança',
    conteudo_md: `O BDSM de alta intensidade física ou psicológica promove grandes descargas hormonais no cérebro (endorfina, adrenalina, oxitocina e cortisol). O esgotamento repentino dessas substâncias após a cena pode causar o **Drop** (Queda).

### O que é o Sub Drop?
Ocorre com o parceiro submisso/passivo horas ou até dias após a cena. Sintomas comuns incluem:
*   Tristeza inexplicável, choro fácil ou sentimento de vazio.
*   Calafrios, cansaço físico ou dores musculares.
*   Insegurança em relação à própria dinâmica ou medo de rejeição.

### O que é o Dom Drop?
Ocorre com o parceiro dominante/ativo, frequentemente por sobrecarga de responsabilidade. Sintomas:
*   Sentimento de culpa ou medo de ter cruzado limites.
*   Sensação de exaustão e vazio emocional.

### Como Prevenir e Tratar?
1.  **Aftercare Atencioso:** Não pule o acolhimento imediato (mantas aquecidas, hidratação, doces para glicose e abraço).
2.  **Diálogo Pós-Cena (Feedback):** Conversas abertas reforçam que tudo ocorreu dentro da consensualidade.
3.  **Descanso Adequado:** Durma bem, beba água e evite cobranças físicas nas 48 horas seguintes.`,
    tempo_leitura: 6,
    dificuldade: 'Médio',
  },
  {
    slug: 'o-que-bdsm-consensual-nao-e',
    titulo: 'O que BDSM Consensual NÃO É (Desmistificando Mitos)',
    categoria: 'Fundamentos',
    conteudo_md: `Existem muitos estereótipos sobre o BDSM que distorcem sua verdadeira natureza ética e consensual. É fundamental saber separar o kink da violência doméstica e das patologias de saúde mental.

### Mitigando Estereótipos
*   ❌ **BDSM não é Abuso:** O abuso é caracterizado pela ausência de consentimento e manipulação coercitiva. No BDSM, o consentimento é a base fundamental e a pessoa passiva mantém o controle via Safeword.
*   ❌ **BDSM não é Patologia:** A OMS (CID-11) e a APA (DSM-5) retiraram as preferências kinky consensuais da lista de doenças mentais. Só são tratadas como distúrbio se causarem sofrimento clínico.
*   ❌ **BDSM não exige Dor obrigatória:** Muitas dinâmicas de dominação e submissão são estritamente psicológicas ou focadas em protocolos de etiqueta sem qualquer dor física.`,
    tempo_leitura: 4,
    dificuldade: 'Fácil',
  },
];

async function recriarWikiDb() {
  console.log('🔄 Recriando bdsm_wiki.db com encoding UTF-8 correto...');
  
  // Deletar banco antigo
  if (fs.existsSync(dbWikiPath)) {
    fs.unlinkSync(dbWikiPath);
    console.log('🗑️ Banco wiki antigo removido.');
  }

  const db = await open({ filename: dbWikiPath, driver: sqlite3.Database });
  
  // Criar schema
  await db.exec(`
    PRAGMA encoding = "UTF-8";
    
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE,
      cor TEXT,
      icone TEXT
    );

    CREATE TABLE IF NOT EXISTS dicionario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      termo TEXT NOT NULL,
      termo_ingles TEXT,
      resumo TEXT,
      descricao_markdown TEXT,
      categoria_id INTEGER,
      tipo TEXT,
      nivel TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS dicionario_tags (
      termo_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (termo_id, tag_id),
      FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS midias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      termo_id INTEGER,
      tipo TEXT,
      url TEXT,
      legenda TEXT,
      FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      termo_id INTEGER,
      titulo TEXT,
      autor TEXT,
      url TEXT,
      FOREIGN KEY(termo_id) REFERENCES dicionario(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS guias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      titulo TEXT,
      categoria TEXT,
      conteudo_md TEXT,
      tempo_leitura INTEGER,
      dificuldade TEXT,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_dicionario_slug ON dicionario(slug);
    CREATE INDEX IF NOT EXISTS idx_dicionario_termo ON dicionario(termo);
    CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria);
  `);

  // Inserir categorias
  for (const cat of categorias) {
    await db.run(
      'INSERT OR IGNORE INTO categorias (id, nome, cor, icone) VALUES (?, ?, ?, ?)',
      [cat.id, cat.nome, cat.cor, cat.icone]
    );
  }
  console.log(`✅ ${categorias.length} categorias inseridas.`);

  // Inserir termos
  for (const termo of termos) {
    await db.run(
      'INSERT OR IGNORE INTO dicionario (slug, termo, termo_ingles, descricao_markdown, categoria_id, tipo) VALUES (?, ?, ?, ?, ?, ?)',
      [termo.slug, termo.termo, termo.termo_ingles, termo.descricao, termo.categoria_id, termo.tipo]
    );
  }
  console.log(`✅ ${termos.length} termos inseridos.`);

  // Inserir guias
  for (const guia of guias) {
    await db.run(
      'INSERT OR IGNORE INTO guias (slug, titulo, categoria, conteudo_md, tempo_leitura, dificuldade) VALUES (?, ?, ?, ?, ?, ?)',
      [guia.slug, guia.titulo, guia.categoria, guia.conteudo_md, guia.tempo_leitura, guia.dificuldade]
    );
  }
  console.log(`✅ ${guias.length} guias inseridos.`);

  await db.close();
  console.log('🎉 bdsm_wiki.db recriado com sucesso em UTF-8!');
}

recriarWikiDb().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
