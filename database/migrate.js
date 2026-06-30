import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis do .env na raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf8'));

const dbWikiPath = path.resolve(__dirname, '../', config.wiki);
const dbAppPath = path.resolve(__dirname, '../', config.app);

async function runMigrate() {
  console.log('🏁 Iniciando migração dos bancos de dados...');

  // Se DATABASE_URL estiver presente, migra o PostgreSQL. Caso contrário, roda localmente em SQLite.
  if (process.env.DATABASE_URL) {
    console.log('🔌 Conectando ao banco PostgreSQL e rodando migrações...');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    const client = await pool.connect();

    try {
      // 1. Traduzir e aplicar o schema da aplicação para Postgres
      // O Postgres não possui "AUTOINCREMENT" (usa-se SERIAL), e usa VARCHAR/TEXT em vez de datatypes genéricos do SQLite.
      let schemaApp = fs.readFileSync(path.resolve(__dirname, 'migrations/001_initial_app.sql'), 'utf8');
      schemaApp = schemaApp
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/DATETIME/gi, 'TIMESTAMP')
        .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      
      console.log('⚡ Executando migração 001 no PostgreSQL...');
      await client.query(schemaApp);

      // Índices
      await client.query('CREATE INDEX IF NOT EXISTS idx_testes_usuario ON testes(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_limites_usuario ON limites(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_respostas_teste ON respostas(teste_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_praticas_nome ON praticas(nome)');

      // 2. Aplicar o schema do teste Relacional (004) no Postgres
      let schemaRel = fs.readFileSync(path.resolve(__dirname, 'migrations/004_relational_test.sql'), 'utf8');
      schemaRel = schemaRel
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/DATETIME/gi, 'TIMESTAMP')
        .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      
      console.log('⚡ Executando migração 004 (Mapa Relacional) no PostgreSQL...');
      await client.query(schemaRel);

      // Índices
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_token ON resultados_relacionais(token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_usuario ON resultados_relacionais(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_perguntas_rel_bloco ON perguntas_relacional(bloco)');

      console.log('✅ Migração do banco PostgreSQL concluída com sucesso!');
    } catch (e) {
      console.error('❌ Erro migrando banco Postgres:', e.message);
      throw e;
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    // Modo local padrão SQLite
    console.log('📂 Rodando em modo SQLite (Local)...');
    
    // 1. Migrar bdsm_completo.db (Aplicação)
    const dbApp = await open({ filename: dbAppPath, driver: sqlite3.Database });
    const migrationAppSql = fs.readFileSync(path.resolve(__dirname, 'migrations/001_initial_app.sql'), 'utf8');
    await dbApp.exec(migrationAppSql);
    
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_testes_usuario ON testes(usuario_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_limites_usuario ON limites(usuario_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_respostas_teste ON respostas(teste_id)');
    await dbApp.exec('CREATE INDEX IF NOT EXISTS idx_praticas_nome ON praticas(nome)');
    await dbApp.close();
    console.log('✅ Migração do bdsm_completo.db (Aplicação) concluída!');

    // 2. Migration 004: Teste de Mapa Relacional
    const dbApp2 = await open({ filename: dbAppPath, driver: sqlite3.Database });
    const migrationRelacionalSql = fs.readFileSync(path.resolve(__dirname, 'migrations/004_relational_test.sql'), 'utf8');
    await dbApp2.exec(migrationRelacionalSql);
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_resultados_rel_token ON resultados_relacionais(token)');
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_resultados_rel_usuario ON resultados_relacionais(usuario_id)');
    await dbApp2.exec('CREATE INDEX IF NOT EXISTS idx_perguntas_rel_bloco ON perguntas_relacional(bloco)');
    await dbApp2.close();
    console.log('✅ Migration 004 (Mapa Relacional) concluída!');
  }

  // 3. Migrar bdsm_wiki.db (Wiki) - A Wiki permanece local e offline no SQLite para máxima performance
  const dbWiki = await open({ filename: dbWikiPath, driver: sqlite3.Database });
  const migrationWikiSql = fs.readFileSync(path.resolve(__dirname, 'migrations/002_initial_wiki.sql'), 'utf8');
  await dbWiki.exec(migrationWikiSql);
  
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_slug ON dicionario(slug)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_termo ON dicionario(termo)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria)');
  
  const seedCategorias = fs.readFileSync(path.resolve(__dirname, 'seeds/categorias.sql'), 'utf8');
  await dbWiki.exec(seedCategorias);

  // Popular Termos e Dicionário via Javascript
  const categoriasRows = await dbWiki.all("SELECT id, nome FROM categorias");
  const categoriasMap = {};
  categoriasRows.forEach(c => { categoriasMap[c.nome] = c.id; });

  const dicionarioData = [
    ["bdsm", "BDSM", "BDSM", "Acrônimo que engloba as práticas de Bondage/Disciplina, Dominação/Submissão e Sadismo/Masoquismo.", "Fundamentos", "Fundamentos", "conceito"],
    ["ssc", "SSC", "Safe, Sane, Consensual", "Filosofia que rege que as práticas devem ser seguras para a saúde, realizadas de forma sã e com consentimento mútuo.", "Segurança", "Segurança", "protocolo"],
    ["rack", "RACK", "Risk-Aware Consensual Kink", "Filosofia que assume que toda prática envolve risco, focando na conscientização mútua e consentimento sobre tais riscos.", "Segurança", "Segurança", "protocolo"],
    ["prick", "PRICK", "Personal Responsibility, Informed, Consensual Kink", "Filosofia que incentiva a responsabilidade pessoal de cada praticante pela segurança comum.", "Segurança", "Segurança", "protocolo"],
    ["safeword", "Safeword", "Safeword", "Palavra ou sinal de emergência acordado para interromper (Vermelho) ou desacelerar (Amarelo) instantaneamente uma cena.", "Segurança", "Segurança", "protocolo"],
    ["aftercare", "Aftercare", "Aftercare", "Período de acolhimento físico e psicológico imediato após uma cena intensa.", "Segurança", "Segurança", "conceito"],
    ["dominante", "Dominante", "Dominant", "Parceiro que assume o comando geral da cena ou dinâmica de poder.", "Papéis", "Papéis", "papel"],
    ["submisso", "Submisso", "Submissive", "Parceiro que entrega voluntariamente o controle de suas reações e ações.", "Papéis", "Papéis", "papel"],
    ["switch", "Switch", "Switch", "Pessoa versátil que transita entre o papel de Top/Dom e Bottom/sub.", "Papéis", "Papéis", "papel"],
    ["top", "Top", "Top", "Aquele que aplica a ação ou estímulo físico durante a cena.", "Sensação", "Sensação", "papel"],
    ["bottom", "Bottom", "Bottom", "Aquele que recebe a ação ou estímulo físico durante a cena.", "Sensação", "Sensação", "papel"],
    ["keyholding", "Keyholding", "Keyholding", "Custódia das chaves de dispositivos de castidade erótica do parceiro, exercendo controle e dominância sobre o orgasmo.", "Papéis", "Papéis", "papel"],
    ["bratting", "Bratting", "Bratting", "Submissão expressa de forma rebelde ou pirracenta, onde o sub tenta desafiar as regras para provocar uma reação firme do Dom.", "Papéis", "Papéis", "papel"],
    ["podofilia", "Podofilia", "Podophilia / Foot Fetish", "Atração intensa por pés, dedos e solas, envolvendo massagens e beijos.", "Corporais", "Corporais", "fetiche"],
    ["tricofilia", "Tricofilia", "Trichophilia", "Atração erótica por cabelos em geral, cortes ou ato de puxar.", "Corporais", "Corporais", "fetiche"],
    ["retifismo", "Retifismo", "Retifism", "Fetiche por sapatos em geral, calçados e saltos altos.", "Vestuário", "Vestuário", "fetiche"],
    ["maschalagnia", "Maschalagnia", "Maschalagnia / Armpit Fetish", "Fetiche e atração erótica pelas axilas, envolvendo o odor corporal ou estimulação tátil.", "Corporais", "Corporais", "fetiche"],
    ["alvinofilia", "Alvinofilia", "Alvinophilia / Navel Fetish", "Excitação erótica direcionada especificamente ao umbigo humano e sua região circundante.", "Corporais", "Corporais", "fetiche"],
    ["pigofilia", "Pigofilia", "Pygophilia / Butt Fetish", "Atração intensa e erotização das nádegas.", "Corporais", "Corporais", "fetiche"],
    ["mazofilia", "Mazofilia", "Mazophilia / Breast Fetish", "Fetiche e atração erótica direcionados aos seios femininos.", "Corporais", "Corporais", "fetiche"],
    ["couro", "Couro", "Leather", "Atração estética e sensorial por vestimentas e itens feitos de couro legítimo ou sintético.", "Materiais", "Materiais", "fetiche"],
    ["latex", "Látex", "Latex / Rubber", "Fetiche por vestuário de borracha ou látex colado ao corpo e com odor característico.", "Materiais", "Materiais", "fetiche"],
    ["spandex", "Spandex", "Spandex / Lycra", "Fetiche por roupas extremamente colantes feitas de lycra ou elastano.", "Materiais", "Materiais", "fetiche"],
    ["sploshing", "Sploshing", "Sploshing / WAM (Wet And Messy)", "Prazer sensorial e erótico em derramar substâncias viscosas, molhadas ou bagunçadas (como lama, chantilly ou chocolate) sobre o corpo.", "Sensorial", "Sensorial", "pratica"],
    ["urofilia", "Urofilia", "Urophilia / Golden Shower", "Fetiche que envolve a excitação erótica com a urina, seja assistindo, recebendo ou urinando no parceiro.", "Sensorial", "Sensorial", "fetiche"],
    ["lactofilia", "Lactofilia", "Lactophilia", "Fetiche focado na amamentação de adultos ou consumo erótico de leite materno.", "Sensorial", "Sensorial", "fetiche"],
    ["dacrifilia", "Dacrifilia", "Dacryphilia", "Atração em ver o parceiro chorar ou expressar sofrimento emocional/físico consensual.", "Sensorial", "Sensorial", "fetiche"],
    ["bondage", "Bondage", "Bondage", "Prática consensual de restringir a mobilidade através de cordas, algemas ou faixas.", "Contenção", "Contenção", "pratica"],
    ["shibari", "Shibari", "Shibari / Kinbaku", "Arte japonesa tradicional de amarração com cordas focada na beleza, técnica e entrega.", "Contenção", "Contenção", "tecnica"],
    ["impact-play", "Impact Play", "Impact Play", "Prática que envolve impacto físico controlado como spanking (palmadas), flogging (chicote de tiras) e paddles.", "Impacto", "Impacto", "pratica"],
    ["wax-play", "Wax Play", "Wax Play", "Uso sensorial de cera de vela de baixa fusão derretida sobre a pele para estimulação térmica.", "Sensorial", "Sensorial", "pratica"],
    ["edgeplay", "Edgeplay", "Edgeplay", "Práticas que beiram limites biológicos ou psicológicos de alto risco (ex: breath play, fire play).", "Avançado", "Avançado", "pratica"],
    ["pet-play", "Pet Play", "Pet Play", "Interpretação lúdica em que um adulto assume o papel de um animal de estimação (Puppy/Pony play).", "Roleplay", "Roleplay", "pratica"],
    ["age-play", "Age Play", "Age Play", "Dinâmica theatrical e consensual de regressão a uma idade estética mais jovem entre adultos.", "Roleplay", "Roleplay", "pratica"],
    ["catsuit", "Catsuit", "Catsuit", "Macacão inteiriço e extremamente justo feito de látex, vinil, couro ou lycra que envolve todo o corpo.", "Vestuário", "Vestuário", "fetiche"],
    ["zentai", "Zentai", "Zentai", "Traje de corpo inteiro feito de lycra ou nylon elástico que cobre inclusive o rosto e a cabeça, eliminando traços faciais.", "Vestuário", "Vestuário", "fetiche"],
    ["mummification", "Mummification", "Mummification", "Prática avançada de bondage em que o corpo é inteiramente envolto com faixas, plástico ou tiras, restringindo totalmente a mobilidade.", "Contenção", "Contenção", "pratica"],
    ["chastity-play", "Chastity Play", "Chastity Play", "Uso de dispositivos de castidade (gaiolas ou cintos) para negar o orgasmo físico ou delegar o controle do prazer a terceiros.", "Sensação", "Sensação", "pratica"],
    ["tease-and-denial", "Tease and Denial", "Tease and Denial", "Estimulação constante seguida pela negação repetida do orgasmo para elevar a submissão e a tensão.", "Sensação", "Sensação", "pratica"],
    ["cnc", "CNC", "Consensual Non-Consent", "Cena de simulação consensual de não-consentimento previamente negociada sob estrito controle e termos de segurança.", "Avançado", "Avançado", "pratica"]
  ];

  for (const [slug, termo, termoEn, significado, tagNome, catNome, tipo] of dicionarioData) {
    const catId = categoriasMap[catNome] || null;
    await dbWiki.run(
      `INSERT OR REPLACE INTO dicionario (slug, termo, termo_ingles, resumo, descricao_markdown, categoria_id, tipo, nivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, termo, termoEn, significado.slice(0, 120), significado, catId, tipo, "Básico"]
    );
    const row = await dbWiki.get("SELECT id FROM dicionario WHERE slug = ?", [slug]);
    const termoId = row.id;

    await dbWiki.run(`INSERT OR IGNORE INTO tags (nome) VALUES (?)`, [tagNome]);
    const tagRow = await dbWiki.get("SELECT id FROM tags WHERE nome = ?", [tagNome]);
    const tagId = tagRow.id;

    await dbWiki.run(`INSERT OR IGNORE INTO dicionario_tags (termo_id, tag_id) VALUES (?, ?)`, [termoId, tagId]);
  }

  // Popular guias
  const guiasData = [
    [
      "seguranca-fisica-e-areas-de-impacto",
      "Princípios de Segurança Física e Áreas de Impacto",
      "Segurança",
      `No **Impact Play**, a segurança anatômica é inegociável. A escolha das áreas corretas evita danos permanentes aos órgãos e nervos.

### Zonas Seguras (Verde)
*   **Nádegas:** Camadas de gordura e músculos volumosos amortecem perfeitamente o impacto sem lesar órgãos vitais.
*   **Coxas (posterior e lateral):** Região muscular forte, ideal para receber estímulos e marcas temporárias.

### Zonas de Atenção (Amarelo)
*   **Costas Superiores:** Evite impacto direto na coluna. Laterais da escápula podem ser exploradas com leveza.

### Zonas Proibidas (Vermelho - Nunca!)
*   **Coluna Vertebral:** Risco extremo de lesões neurológicas.
*   **Rins (lombar baixa):** Órgãos vitais desprotegidos. Golpes podem causar sangramento interno e insuficiência renal.
*   **Cóccix e Articulações:** Risco de fraturas dolorosas e danos permanentes.
*   **Pescoço e Cabeça:** Risco de desmaios e lesões vasculares graves.

*Mantenha sempre tesouras de ponta redonda (safety scissors) ao alcance no bondage e revise a circulação sanguínea das extremidades a cada 10 minutos.*`,
      5,
      "Médio"
    ],
    [
      "filosofias-de-consentimento-e-safewords",
      "Filosofias de Consentimento e o Semáforo das Safewords",
      "Negociação",
      `O estabelecimento de acordos explícitos é a chave para o BDSM ético. A utilização de **Safewords** baseadas no sistema de Semáforo garante controle e segurança contínua durante as cenas.

### O Semáforo Clássico
1.  🟢 **Verde (Green):** Ritmo ideal. A cena pode progredir ou continuar com o nível de intensidade atual.
2.  🟡 **Amarelo (Yellow):** Alerta de proximidade com limites. Indica a necessidade de diminuir a velocidade, suavizar os golpes ou ajustar a posição física.
3.  🔴 **Vermelho (Red):** **PARADA IMEDIATA.** Todo estímulo cessa no mesmo instante, as amarras são afrouxadas e o acolhimento começa.

### Alternativas Não-Vocais
Em momentos onde mordaças impossibilitam a fala, o parceiro passivo deve segurar um objeto pesado (como chaves de metal) na mão suspensa. Se o objeto cair no chão, equivale instantaneamente a uma Safeword Vermelha, sinalizando cansaço extremo ou perda de consciência.`,
      4,
      "Fácil"
    ],
    [
      "saude-mental-e-hormonal-drop",
      "Saúde Mental e Emocional: Entendendo o Sub Drop e o Dom Drop",
      "Segurança",
      `O BDSM de alta intensidade física ou psicológica promove grandes descargas hormonais no cérebro (endorfina, adrenalina, oxitocina e cortisol). O esgotamento repentino dessas substâncias após a cena pode causar um fenômeno conhecido como **Drop** (Queda).

### O que é o Sub Drop?
Ocorre com o parceiro submisso/passivo horas ou até dias após a cena. Sintomas comuns incluem:
*   Tristeza inexplicável, choro fácil ou sentimento de vazio.
*   Calafrios, cansaço físico servo ou dores musculares.
*   Insegurança em relação à própria dinâmica ou medo de rejeição pelo parceiro.

### O que é o Dom Drop?
Ocorre com o parceiro dominante/ativo, frequentemente motivado pela sobrecarga de responsabilidade e autocontrole exigidos durante a condução da cena. Sintomas comuns:
*   Sentimento de culpa ou medo de ter machucado ou cruzado limites do sub.
*   Sensação de exaustão e vazio emocional.

### Como Prevenir e Tratar?
1.  **Aftercare Atencioso:** Não pule o acolhimento imediato (mantas aquecidas, hidratação, doces rápidos para glicose e abraço de acolhimento).
2.  **Diálogo Pós-Cena (Feedback):** Conversas abertas reforçam que tudo ocorreu dentro da consensualidade e do afeto, acalmando a mente.
3.  **Descanso Adequado:** Durma bem, beba água e evite cobranças físicas nas 48 horas seguintes.`,
      6,
      "Médio"
    ],
    [
      "o-que-bdsm-consensual-nao-e",
      "O que BDSM Consensual NÃO É (Desmistificando Mitos)",
      "Fundamentos",
      `Existem muitos estereótipos sobre o BDSM que distorcem sua verdadeira natureza ética e consensual. É fundamental saber separar o kink da violência doméstica e das patologias de saúde mental.

### Mitigando Estereótipos
*   ❌ **BDSM não é Abuso:** O abuso e a violência doméstica são caracterizados pela ausência de consentimento, manipulação coercitiva e dor imposta sem limites ou safewords. No BDSM, o consentimento é a base fundamental e a pessoa passiva mantém o controle da cena com a Safeword.
*   ❌ **BDSM não é Patologia:** A Organização Mundial da Saúde (CID-11) e a Associação Psiquiátrica Americana (DSM-5) retiraram as preferências kinky e sadomasoquistas consensuais da lista de doenças mentais. Elas só são tratadas como distúrbio se causarem sofrimento clínico ao próprio indivíduo ou envolverem menores/terceiros não consententes.
*   ❌ **BDSM não exige obrigatoriedade de Dor:** Muitas dinâmicas de dominação e submissão são estritamente psicológicas ou focadas em protocolos de etiqueta e rotinas (como D/s geral e M/s de serviço), sem envolver qualquer tipo de dor física.`,
      4,
      "Fácil"
    ]
  ];

  const columns = await dbWiki.all("PRAGMA table_info(guias)");
  const hasDifficultyColumn = columns.some(col => col.name === 'difficulty');

  for (const [slug, titulo, categoria, conteudoMd, tempoLeitura, dificuldade] of guiasData) {
    if (hasDifficultyColumn) {
      await dbWiki.run(
        `INSERT OR REPLACE INTO guias (slug, titulo, categoria, conteudo_md, tempo_leitura, difficulty) VALUES (?, ?, ?, ?, ?, ?)`,
        [slug, titulo, categoria, conteudoMd, tempoLeitura, dificuldade]
      );
    } else {
      await dbWiki.run(
        `INSERT OR REPLACE INTO guias (slug, titulo, categoria, conteudo_md, tempo_leitura, dificuldade) VALUES (?, ?, ?, ?, ?, ?)`,
        [slug, titulo, categoria, conteudoMd, tempoLeitura, dificuldade]
      );
    }
  }

  await dbWiki.close();
  
  console.log('✅ Migração do bdsm_wiki.db (Wiki) + Seeds completa!');
  console.log('🎉 Todas as migrações foram aplicadas com sucesso!');
}

runMigrate().catch(err => {
  console.error('❌ Falha na execução das migrações:', err);
  process.exit(1);
});
