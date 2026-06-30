import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variÃ¡veis do .env na raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf8'));

const dbWikiPath = path.resolve(__dirname, '../', config.wiki);
const dbAppPath = path.resolve(__dirname, '../', config.app);

async function runMigrate() {
  console.log('ðŸ Iniciando migraÃ§Ã£o dos bancos de dados...');

  // Se DATABASE_URL estiver presente, migra o PostgreSQL. Caso contrÃ¡rio, roda localmente em SQLite.
  if (process.env.DATABASE_URL) {
    console.log('ðŸ”Œ Conectando ao banco PostgreSQL e rodando migraÃ§Ãµes...');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    const client = await pool.connect();

    try {
      // 1. Traduzir e aplicar o schema da aplicaÃ§Ã£o para Postgres
      // O Postgres nÃ£o possui "AUTOINCREMENT" (usa-se SERIAL), e usa VARCHAR/TEXT em vez de datatypes genÃ©ricos do SQLite.
      let schemaApp = fs.readFileSync(path.resolve(__dirname, 'migrations/001_initial_app.sql'), 'utf8');
      schemaApp = schemaApp
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/DATETIME/gi, 'TIMESTAMP')
        .replace(/TEXT DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      
      console.log('âš¡ Executando migraÃ§Ã£o 001 no PostgreSQL...');
      await client.query(schemaApp);

      // Ãndices
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
      
      console.log('âš¡ Executando migraÃ§Ã£o 004 (Mapa Relacional) no PostgreSQL...');
      await client.query(schemaRel);

      // Ãndices
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_token ON resultados_relacionais(token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_resultados_rel_usuario ON resultados_relacionais(usuario_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_perguntas_rel_bloco ON perguntas_relacional(bloco)');

      console.log('✅ Migração do banco PostgreSQL concluída com sucesso!');
      // Migration 005: coluna is_anonimo no Postgres
      try {
        await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_anonimo INTEGER DEFAULT 0');
        console.log('✅ Migration 005 (is_anonimo) aplicada no PostgreSQL!');
      } catch (e005) {
        console.log('ℹ️  Migration 005 Postgres: ' + e005.message);
      }
      try {
        await client.query('ALTER TABLE limit_history ADD COLUMN IF NOT EXISTS observacao TEXT');
      } catch (e) {
        console.warn('Coluna observacao em limit_history já deve existir no PostgreSQL.');
      }
    } catch (e) {
      console.error('❌ Erro migrando banco Postgres:', e.message);
      throw e;
    } finally {
      client.release();
      await pool.end();
    }
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

    // 3. Migration 005: Coluna is_anonimo para usuários anônimos
    const dbApp3 = await open({ filename: dbAppPath, driver: sqlite3.Database });
    try {
      await dbApp3.exec('ALTER TABLE usuarios ADD COLUMN is_anonimo INTEGER DEFAULT 0');
      console.log('✅ Migration 005 (is_anonimo) aplicada!');
    } catch (e) {
      if (e.message && e.message.includes('duplicate column name')) {
        console.log('ℹ️  Migration 005: coluna is_anonimo já existe, ignorando.');
      } else {
        throw e;
      }
    }
    await dbApp3.close();
  }

  // 3. Migrar bdsm_wiki.db (Wiki) - A Wiki permanece local e offline no SQLite para mÃ¡xima performance
  const dbWiki = await open({ filename: dbWikiPath, driver: sqlite3.Database });
  const migrationWikiSql = fs.readFileSync(path.resolve(__dirname, 'migrations/002_initial_wiki.sql'), 'utf8');
  await dbWiki.exec(migrationWikiSql);
  
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_slug ON dicionario(slug)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_dicionario_termo ON dicionario(termo)');
  await dbWiki.exec('CREATE INDEX IF NOT EXISTS idx_guias_categoria ON guias(categoria)');
  
  const seedCategorias = fs.readFileSync(path.resolve(__dirname, 'seeds/categorias.sql'), 'utf8');
  await dbWiki.exec(seedCategorias);

  // Popular Termos e DicionÃ¡rio via Javascript
  const categoriasRows = await dbWiki.all("SELECT id, nome FROM categorias");
  const categoriasMap = {};
  categoriasRows.forEach(c => { categoriasMap[c.nome] = c.id; });

  const dicionarioData = [
    ["bdsm", "BDSM", "BDSM", "AcrÃ´nimo que engloba as prÃ¡ticas de Bondage/Disciplina, DominaÃ§Ã£o/SubmissÃ£o e Sadismo/Masoquismo.", "Fundamentos", "Fundamentos", "conceito"],
    ["ssc", "SSC", "Safe, Sane, Consensual", "Filosofia que rege que as prÃ¡ticas devem ser seguras para a saÃºde, realizadas de forma sÃ£ e com consentimento mÃºtuo.", "SeguranÃ§a", "SeguranÃ§a", "protocolo"],
    ["rack", "RACK", "Risk-Aware Consensual Kink", "Filosofia que assume que toda prÃ¡tica envolve risco, focando na conscientizaÃ§Ã£o mÃºtua e consentimento sobre tais riscos.", "SeguranÃ§a", "SeguranÃ§a", "protocolo"],
    ["prick", "PRICK", "Personal Responsibility, Informed, Consensual Kink", "Filosofia que incentiva a responsabilidade pessoal de cada praticante pela seguranÃ§a comum.", "SeguranÃ§a", "SeguranÃ§a", "protocolo"],
    ["safeword", "Safeword", "Safeword", "Palavra ou sinal de emergÃªncia acordado para interromper (Vermelho) ou desacelerar (Amarelo) instantaneamente uma cena.", "SeguranÃ§a", "SeguranÃ§a", "protocolo"],
    ["aftercare", "Aftercare", "Aftercare", "PerÃ­odo de acolhimento fÃ­sico e psicolÃ³gico imediato apÃ³s uma cena intensa.", "SeguranÃ§a", "SeguranÃ§a", "conceito"],
    ["dominante", "Dominante", "Dominant", "Parceiro que assume o comando geral da cena ou dinÃ¢mica de poder.", "PapÃ©is", "PapÃ©is", "papel"],
    ["submisso", "Submisso", "Submissive", "Parceiro que entrega voluntariamente o controle de suas reaÃ§Ãµes e aÃ§Ãµes.", "PapÃ©is", "PapÃ©is", "papel"],
    ["switch", "Switch", "Switch", "Pessoa versÃ¡til que transita entre o papel de Top/Dom e Bottom/sub.", "PapÃ©is", "PapÃ©is", "papel"],
    ["top", "Top", "Top", "Aquele que aplica a aÃ§Ã£o ou estÃ­mulo fÃ­sico durante a cena.", "SensaÃ§Ã£o", "SensaÃ§Ã£o", "papel"],
    ["bottom", "Bottom", "Bottom", "Aquele que recebe a aÃ§Ã£o ou estÃ­mulo fÃ­sico durante a cena.", "SensaÃ§Ã£o", "SensaÃ§Ã£o", "papel"],
    ["keyholding", "Keyholding", "Keyholding", "CustÃ³dia das chaves de dispositivos de castidade erÃ³tica do parceiro, exercendo controle e dominÃ¢ncia sobre o orgasmo.", "PapÃ©is", "PapÃ©is", "papel"],
    ["bratting", "Bratting", "Bratting", "SubmissÃ£o expressa de forma rebelde ou pirracenta, onde o sub tenta desafiar as regras para provocar uma reaÃ§Ã£o firme do Dom.", "PapÃ©is", "PapÃ©is", "papel"],
    ["podofilia", "Podofilia", "Podophilia / Foot Fetish", "AtraÃ§Ã£o intensa por pÃ©s, dedos e solas, envolvendo massagens e beijos.", "Corporais", "Corporais", "fetiche"],
    ["tricofilia", "Tricofilia", "Trichophilia", "AtraÃ§Ã£o erÃ³tica por cabelos em geral, cortes ou ato de puxar.", "Corporais", "Corporais", "fetiche"],
    ["retifismo", "Retifismo", "Retifism", "Fetiche por sapatos em geral, calÃ§ados e saltos altos.", "VestuÃ¡rio", "VestuÃ¡rio", "fetiche"],
    ["maschalagnia", "Maschalagnia", "Maschalagnia / Armpit Fetish", "Fetiche e atraÃ§Ã£o erÃ³tica pelas axilas, envolvendo o odor corporal ou estimulaÃ§Ã£o tÃ¡til.", "Corporais", "Corporais", "fetiche"],
    ["alvinofilia", "Alvinofilia", "Alvinophilia / Navel Fetish", "ExcitaÃ§Ã£o erÃ³tica direcionada especificamente ao umbigo humano e sua regiÃ£o circundante.", "Corporais", "Corporais", "fetiche"],
    ["pigofilia", "Pigofilia", "Pygophilia / Butt Fetish", "AtraÃ§Ã£o intensa e erotizaÃ§Ã£o das nÃ¡degas.", "Corporais", "Corporais", "fetiche"],
    ["mazofilia", "Mazofilia", "Mazophilia / Breast Fetish", "Fetiche e atraÃ§Ã£o erÃ³tica direcionados aos seios femininos.", "Corporais", "Corporais", "fetiche"],
    ["couro", "Couro", "Leather", "AtraÃ§Ã£o estÃ©tica e sensorial por vestimentas e itens feitos de couro legÃ­timo ou sintÃ©tico.", "Materiais", "Materiais", "fetiche"],
    ["latex", "LÃ¡tex", "Latex / Rubber", "Fetiche por vestuÃ¡rio de borracha ou lÃ¡tex colado ao corpo e com odor caracterÃ­stico.", "Materiais", "Materiais", "fetiche"],
    ["spandex", "Spandex", "Spandex / Lycra", "Fetiche por roupas extremamente colantes feitas de lycra ou elastano.", "Materiais", "Materiais", "fetiche"],
    ["sploshing", "Sploshing", "Sploshing / WAM (Wet And Messy)", "Prazer sensorial e erÃ³tico em derramar substÃ¢ncias viscosas, molhadas ou bagunÃ§adas (como lama, chantilly ou chocolate) sobre o corpo.", "Sensorial", "Sensorial", "pratica"],
    ["urofilia", "Urofilia", "Urophilia / Golden Shower", "Fetiche que envolve a excitaÃ§Ã£o erÃ³tica com a urina, seja assistindo, recebendo ou urinando no parceiro.", "Sensorial", "Sensorial", "fetiche"],
    ["lactofilia", "Lactofilia", "Lactophilia", "Fetiche focado na amamentaÃ§Ã£o de adultos ou consumo erÃ³tico de leite materno.", "Sensorial", "Sensorial", "fetiche"],
    ["dacrifilia", "Dacrifilia", "Dacryphilia", "AtraÃ§Ã£o em ver o parceiro chorar ou expressar sofrimento emocional/fÃ­sico consensual.", "Sensorial", "Sensorial", "fetiche"],
    ["bondage", "Bondage", "Bondage", "PrÃ¡tica consensual de restringir a mobilidade atravÃ©s de cordas, algemas ou faixas.", "ContenÃ§Ã£o", "ContenÃ§Ã£o", "pratica"],
    ["shibari", "Shibari", "Shibari / Kinbaku", "Arte japonesa tradicional de amarraÃ§Ã£o com cordas focada na beleza, tÃ©cnica e entrega.", "ContenÃ§Ã£o", "ContenÃ§Ã£o", "tecnica"],
    ["impact-play", "Impact Play", "Impact Play", "PrÃ¡tica que envolve impacto fÃ­sico controlado como spanking (palmadas), flogging (chicote de tiras) e paddles.", "Impacto", "Impacto", "pratica"],
    ["wax-play", "Wax Play", "Wax Play", "Uso sensorial de cera de vela de baixa fusÃ£o derretida sobre a pele para estimulaÃ§Ã£o tÃ©rmica.", "Sensorial", "Sensorial", "pratica"],
    ["edgeplay", "Edgeplay", "Edgeplay", "PrÃ¡ticas que beiram limites biolÃ³gicos ou psicolÃ³gicos de alto risco (ex: breath play, fire play).", "AvanÃ§ado", "AvanÃ§ado", "pratica"],
    ["pet-play", "Pet Play", "Pet Play", "InterpretaÃ§Ã£o lÃºdica em que um adulto assume o papel de um animal de estimaÃ§Ã£o (Puppy/Pony play).", "Roleplay", "Roleplay", "pratica"],
    ["age-play", "Age Play", "Age Play", "DinÃ¢mica theatrical e consensual de regressÃ£o a uma idade estÃ©tica mais jovem entre adultos.", "Roleplay", "Roleplay", "pratica"],
    ["catsuit", "Catsuit", "Catsuit", "MacacÃ£o inteiriÃ§o e extremamente justo feito de lÃ¡tex, vinil, couro ou lycra que envolve todo o corpo.", "VestuÃ¡rio", "VestuÃ¡rio", "fetiche"],
    ["zentai", "Zentai", "Zentai", "Traje de corpo inteiro feito de lycra ou nylon elÃ¡stico que cobre inclusive o rosto e a cabeÃ§a, eliminando traÃ§os faciais.", "VestuÃ¡rio", "VestuÃ¡rio", "fetiche"],
    ["mummification", "Mummification", "Mummification", "PrÃ¡tica avanÃ§ada de bondage em que o corpo Ã© inteiramente envolto com faixas, plÃ¡stico ou tiras, restringindo totalmente a mobilidade.", "ContenÃ§Ã£o", "ContenÃ§Ã£o", "pratica"],
    ["chastity-play", "Chastity Play", "Chastity Play", "Uso de dispositivos de castidade (gaiolas ou cintos) para negar o orgasmo fÃ­sico ou delegar o controle do prazer a terceiros.", "SensaÃ§Ã£o", "SensaÃ§Ã£o", "pratica"],
    ["tease-and-denial", "Tease and Denial", "Tease and Denial", "EstimulaÃ§Ã£o constante seguida pela negaÃ§Ã£o repetida do orgasmo para elevar a submissÃ£o e a tensÃ£o.", "SensaÃ§Ã£o", "SensaÃ§Ã£o", "pratica"],
    ["cnc", "CNC", "Consensual Non-Consent", "Cena de simulaÃ§Ã£o consensual de nÃ£o-consentimento previamente negociada sob estrito controle e termos de seguranÃ§a.", "AvanÃ§ado", "AvanÃ§ado", "pratica"]
  ];

  for (const [slug, termo, termoEn, significado, tagNome, catNome, tipo] of dicionarioData) {
    const catId = categoriasMap[catNome] || null;
    await dbWiki.run(
      `INSERT OR REPLACE INTO dicionario (slug, termo, termo_ingles, resumo, descricao_markdown, categoria_id, tipo, nivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, termo, termoEn, significado.slice(0, 120), significado, catId, tipo, "BÃ¡sico"]
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
      "PrincÃ­pios de SeguranÃ§a FÃ­sica e Ãreas de Impacto",
      "SeguranÃ§a",
      `No **Impact Play**, a seguranÃ§a anatÃ´mica Ã© inegociÃ¡vel. A escolha das Ã¡reas corretas evita danos permanentes aos Ã³rgÃ£os e nervos.

### Zonas Seguras (Verde)
*   **NÃ¡degas:** Camadas de gordura e mÃºsculos volumosos amortecem perfeitamente o impacto sem lesar Ã³rgÃ£os vitais.
*   **Coxas (posterior e lateral):** RegiÃ£o muscular forte, ideal para receber estÃ­mulos e marcas temporÃ¡rias.

### Zonas de AtenÃ§Ã£o (Amarelo)
*   **Costas Superiores:** Evite impacto direto na coluna. Laterais da escÃ¡pula podem ser exploradas com leveza.

### Zonas Proibidas (Vermelho - Nunca!)
*   **Coluna Vertebral:** Risco extremo de lesÃµes neurolÃ³gicas.
*   **Rins (lombar baixa):** Ã“rgÃ£os vitais desprotegidos. Golpes podem causar sangramento interno e insuficiÃªncia renal.
*   **CÃ³ccix e ArticulaÃ§Ãµes:** Risco de fraturas dolorosas e danos permanentes.
*   **PescoÃ§o e CabeÃ§a:** Risco de desmaios e lesÃµes vasculares graves.

*Mantenha sempre tesouras de ponta redonda (safety scissors) ao alcance no bondage e revise a circulaÃ§Ã£o sanguÃ­nea das extremidades a cada 10 minutos.*`,
      5,
      "MÃ©dio"
    ],
    [
      "filosofias-de-consentimento-e-safewords",
      "Filosofias de Consentimento e o SemÃ¡foro das Safewords",
      "NegociaÃ§Ã£o",
      `O estabelecimento de acordos explÃ­citos Ã© a chave para o BDSM Ã©tico. A utilizaÃ§Ã£o de **Safewords** baseadas no sistema de SemÃ¡foro garante controle e seguranÃ§a contÃ­nua durante as cenas.

### O SemÃ¡foro ClÃ¡ssico
1.  ðŸŸ¢ **Verde (Green):** Ritmo ideal. A cena pode progredir ou continuar com o nÃ­vel de intensidade atual.
2.  ðŸŸ¡ **Amarelo (Yellow):** Alerta de proximidade com limites. Indica a necessidade de diminuir a velocidade, suavizar os golpes ou ajustar a posiÃ§Ã£o fÃ­sica.
3.  ðŸ”´ **Vermelho (Red):** **PARADA IMEDIATA.** Todo estÃ­mulo cessa no mesmo instante, as amarras sÃ£o afrouxadas e o acolhimento comeÃ§a.

### Alternativas NÃ£o-Vocais
Em momentos onde mordaÃ§as impossibilitam a fala, o parceiro passivo deve segurar um objeto pesado (como chaves de metal) na mÃ£o suspensa. Se o objeto cair no chÃ£o, equivale instantaneamente a uma Safeword Vermelha, sinalizando cansaÃ§o extremo ou perda de consciÃªncia.`,
      4,
      "FÃ¡cil"
    ],
    [
      "saude-mental-e-hormonal-drop",
      "SaÃºde Mental e Emocional: Entendendo o Sub Drop e o Dom Drop",
      "SeguranÃ§a",
      `O BDSM de alta intensidade fÃ­sica ou psicolÃ³gica promove grandes descargas hormonais no cÃ©rebro (endorfina, adrenalina, oxitocina e cortisol). O esgotamento repentino dessas substÃ¢ncias apÃ³s a cena pode causar um fenÃ´meno conhecido como **Drop** (Queda).

### O que Ã© o Sub Drop?
Ocorre com o parceiro submisso/passivo horas ou atÃ© dias apÃ³s a cena. Sintomas comuns incluem:
*   Tristeza inexplicÃ¡vel, choro fÃ¡cil ou sentimento de vazio.
*   Calafrios, cansaÃ§o fÃ­sico servo ou dores musculares.
*   InseguranÃ§a em relaÃ§Ã£o Ã  prÃ³pria dinÃ¢mica ou medo de rejeiÃ§Ã£o pelo parceiro.

### O que Ã© o Dom Drop?
Ocorre com o parceiro dominante/ativo, frequentemente motivado pela sobrecarga de responsabilidade e autocontrole exigidos durante a conduÃ§Ã£o da cena. Sintomas comuns:
*   Sentimento de culpa ou medo de ter machucado ou cruzado limites do sub.
*   SensaÃ§Ã£o de exaustÃ£o e vazio emocional.

### Como Prevenir e Tratar?
1.  **Aftercare Atencioso:** NÃ£o pule o acolhimento imediato (mantas aquecidas, hidrataÃ§Ã£o, doces rÃ¡pidos para glicose e abraÃ§o de acolhimento).
2.  **DiÃ¡logo PÃ³s-Cena (Feedback):** Conversas abertas reforÃ§am que tudo ocorreu dentro da consensualidade e do afeto, acalmando a mente.
3.  **Descanso Adequado:** Durma bem, beba Ã¡gua e evite cobranÃ§as fÃ­sicas nas 48 horas seguintes.`,
      6,
      "MÃ©dio"
    ],
    [
      "o-que-bdsm-consensual-nao-e",
      "O que BDSM Consensual NÃƒO Ã‰ (Desmistificando Mitos)",
      "Fundamentos",
      `Existem muitos estereÃ³tipos sobre o BDSM que distorcem sua verdadeira natureza Ã©tica e consensual. Ã‰ fundamental saber separar o kink da violÃªncia domÃ©stica e das patologias de saÃºde mental.

### Mitigando EstereÃ³tipos
*   âŒ **BDSM nÃ£o Ã© Abuso:** O abuso e a violÃªncia domÃ©stica sÃ£o caracterizados pela ausÃªncia de consentimento, manipulaÃ§Ã£o coercitiva e dor imposta sem limites ou safewords. No BDSM, o consentimento Ã© a base fundamental e a pessoa passiva mantÃ©m o controle da cena com a Safeword.
*   âŒ **BDSM nÃ£o Ã© Patologia:** A OrganizaÃ§Ã£o Mundial da SaÃºde (CID-11) e a AssociaÃ§Ã£o PsiquiÃ¡trica Americana (DSM-5) retiraram as preferÃªncias kinky e sadomasoquistas consensuais da lista de doenÃ§as mentais. Elas sÃ³ sÃ£o tratadas como distÃºrbio se causarem sofrimento clÃ­nico ao prÃ³prio indivÃ­duo ou envolverem menores/terceiros nÃ£o consententes.
*   âŒ **BDSM nÃ£o exige obrigatoriedade de Dor:** Muitas dinÃ¢micas de dominaÃ§Ã£o e submissÃ£o sÃ£o estritamente psicolÃ³gicas ou focadas em protocolos de etiqueta e rotinas (como D/s geral e M/s de serviÃ§o), sem envolver qualquer tipo de dor fÃ­sica.`,
      4,
      "FÃ¡cil"
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
  
  console.log('âœ… MigraÃ§Ã£o do bdsm_wiki.db (Wiki) + Seeds completa!');
  console.log('ðŸŽ‰ Todas as migraÃ§Ãµes foram aplicadas com sucesso!');
}

runMigrate().catch(err => {
  console.error('âŒ Falha na execuÃ§Ã£o das migraÃ§Ãµes:', err);
  process.exit(1);
});

