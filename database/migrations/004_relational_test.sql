-- ============================================================
-- MIGRATION 004: TESTE DE MAPA RELACIONAL
-- 60 perguntas, 5 eixos, 6 perfis
-- eixos: exclusividade, seguranca, estrutura, posse, rede
-- direcao: +1 concordar = nao-monogamia | -1 concordar = monogamia
-- ============================================================

CREATE TABLE IF NOT EXISTS perguntas_relacional (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bloco INTEGER NOT NULL,
    bloco_nome TEXT NOT NULL,
    texto TEXT NOT NULL UNIQUE,
    eixo1 TEXT NOT NULL,
    eixo2 TEXT,
    direcao INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS perfis_relacionais (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    emoji TEXT NOT NULL,
    descricao TEXT NOT NULL,
    diagnostico TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_relacionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    usuario_id INTEGER,
    perfil_id TEXT NOT NULL,
    score_exclusividade INTEGER DEFAULT 50,
    score_seguranca INTEGER DEFAULT 50,
    score_estrutura INTEGER DEFAULT 50,
    score_posse INTEGER DEFAULT 50,
    score_rede INTEGER DEFAULT 50,
    respostas_json TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- BLOCO 1
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(1,'Visao sobre Amor','Acredito que exclusividade e essencial para que um amor seja verdadeiro.','exclusividade',NULL,-1),
(1,'Visao sobre Amor','Acho que uma pessoa pode suprir todas as minhas necessidades emocionais.','exclusividade','rede',-1),
(1,'Visao sobre Amor','Vejo o amor como algo expansivel, capaz de crescer para mais de uma pessoa.','rede','exclusividade',1),
(1,'Visao sobre Amor','Me sinto mais confortavel com estruturas relacionais tradicionais.','estrutura','exclusividade',-1),
(1,'Visao sobre Amor','Para mim, compromisso significa exclusividade automatica.','exclusividade','posse',-1),
(1,'Visao sobre Amor','Sentir desejo por outras pessoas nao invalida um relacionamento.','exclusividade','posse',1),
(1,'Visao sobre Amor','Consigo separar amor, sexo e intimidade emocional como coisas distintas.','posse','exclusividade',1),
(1,'Visao sobre Amor','Prefiro liberdade e negociacao constante a regras fixas no relacionamento.','estrutura','seguranca',1);

-- BLOCO 2
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(2,'Desejo e Sexualidade','Sinto curiosidade sexual por outras pessoas mesmo em uma relacao estavel.','exclusividade','posse',1),
(2,'Desejo e Sexualidade','Me sentiria confortavel sabendo que meu parceiro(a) teve experiencias sexuais com outras pessoas.','posse','exclusividade',1),
(2,'Desejo e Sexualidade','Me sinto mais confortavel com exclusividade sexual.','exclusividade',NULL,-1),
(2,'Desejo e Sexualidade','Consigo separar sexo de vinculo emocional sem dificuldade.','posse','exclusividade',1),
(2,'Desejo e Sexualidade','Ja senti vontade de explorar sexualmente sem encerrar um relacionamento.','exclusividade','seguranca',1),
(2,'Desejo e Sexualidade','Acho que sexo cria automaticamente um vinculo emocional entre as pessoas.','posse','exclusividade',-1),
(2,'Desejo e Sexualidade','A ideia de compartilhar experiencias sexuais com outras pessoas me parece interessante.','exclusividade','rede',1),
(2,'Desejo e Sexualidade','Me sentiria mais livre do que inseguro(a) com liberdade sexual no relacionamento.','seguranca','posse',1);

-- BLOCO 3
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(3,'Vinculo Afetivo','Consigo imaginar amar mais de uma pessoa ao mesmo tempo.','rede','exclusividade',1),
(3,'Vinculo Afetivo','Sinto que o amor diminui se for dividido com mais de uma pessoa.','exclusividade','rede',-1),
(3,'Vinculo Afetivo','Preciso me sentir unico(a) na vida de alguem para me sentir amado(a).','exclusividade','posse',-1),
(3,'Vinculo Afetivo','Ja tive sentimentos por mais de uma pessoa ao mesmo tempo.','rede','exclusividade',1),
(3,'Vinculo Afetivo','Acredito na existencia de um amor principal com vinculos secundarios possiveis.','estrutura','rede',1),
(3,'Vinculo Afetivo','Me incomodo quando meu parceiro(a) cria vinculos emocionais proximos com outras pessoas.','posse','exclusividade',-1),
(3,'Vinculo Afetivo','Consigo separar amor romantico de conexao afetiva profunda.','posse','estrutura',1);

-- BLOCO 4
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(4,'Ciume e Seguranca','Sinto ciume com facilidade em relacionamentos.','seguranca','posse',-1),
(4,'Ciume e Seguranca','Meu ciume e mais sobre conexao emocional do que sobre sexo.','exclusividade','posse',-1),
(4,'Ciume e Seguranca','Sinto inseguranca quando nao tenho controle sobre o que acontece na relacao.','seguranca','estrutura',-1),
(4,'Ciume e Seguranca','Consigo falar sobre ciume abertamente sem me fechar emocionalmente.','seguranca','estrutura',1),
(4,'Ciume e Seguranca','Prefiro evitar situacoes que possam gerar ciume a enfrenta-las.','seguranca','estrutura',-1),
(4,'Ciume e Seguranca','Consigo ver o ciume como algo gerenciavel e nao como uma ameaca.','seguranca',NULL,1),
(4,'Ciume e Seguranca','Precisaria de muitas regras para me sentir seguro(a) em uma relacao aberta.','estrutura','seguranca',-1),
(4,'Ciume e Seguranca','Consigo sentir felicidade genuina quando meu parceiro(a) esta bem com outra pessoa.','posse','seguranca',1);

-- BLOCO 5
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(5,'Estrutura Relacional','Prefiro relacoes com regras fixas e bem definidas.','estrutura','seguranca',-1),
(5,'Estrutura Relacional','Me sinto confortavel renegociando acordos com frequencia.','estrutura','seguranca',1),
(5,'Estrutura Relacional','Preciso de previsibilidade para me sentir bem em um relacionamento.','seguranca','estrutura',-1),
(5,'Estrutura Relacional','Me adapto bem a mudancas no formato da relacao.','estrutura','seguranca',1),
(5,'Estrutura Relacional','Me sentiria confortavel em uma relacao sem rotulos definidos.','estrutura','exclusividade',1),
(5,'Estrutura Relacional','Acho importante definir claramente o tipo de relacao logo no inicio.','estrutura','exclusividade',-1),
(5,'Estrutura Relacional','Me incomodo com ambiguidades emocionais em relacionamentos.','estrutura','seguranca',-1);

-- BLOCO 6
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(6,'Autonomia e Identidade','Preciso de muito espaco individual dentro de um relacionamento.','posse','estrutura',1),
(6,'Autonomia e Identidade','Sinto que relacionamentos podem limitar minha identidade pessoal.','posse','seguranca',1),
(6,'Autonomia e Identidade','Consigo manter minha individualidade mesmo em relacoes muito intensas.','posse',NULL,1),
(6,'Autonomia e Identidade','Gosto da ideia de nao depender emocionalmente de uma unica pessoa.','rede','posse',1),
(6,'Autonomia e Identidade','Sinto necessidade alta de independencia emocional.','posse','rede',1),
(6,'Autonomia e Identidade','Me sinto mais completo(a) quando estou em um relacionamento exclusivo.','exclusividade','posse',-1);

-- BLOCO 7
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(7,'Outros Vinculos','Me incomodo quando meu parceiro(a) tem amizades muito intimas com outras pessoas.','posse','exclusividade',-1),
(7,'Outros Vinculos','Aceitaria que meu parceiro(a) tivesse outros relacionamentos amorosos.','exclusividade','rede',1),
(7,'Outros Vinculos','Me sentiria confortavel conhecendo os outros parceiros do meu parceiro(a).','rede','seguranca',1),
(7,'Outros Vinculos','Preferiria nao saber detalhes de outros vinculos do meu parceiro(a).','seguranca','posse',-1),
(7,'Outros Vinculos','Aceitaria participar de uma rede de relacoes onde todos se conhecem.','rede','exclusividade',1),
(7,'Outros Vinculos','Sinto necessidade de ser prioridade absoluta na vida do meu parceiro(a).','exclusividade','posse',-1);

-- BLOCO 8
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(8,'Reacao a Cenarios','Se meu parceiro(a) quisesse explorar outras pessoas sem me perder, eu tentaria entender.','exclusividade','seguranca',1),
(8,'Reacao a Cenarios','Se meu parceiro(a) se apaixonasse por outra pessoa, isso encerraria nossa relacao.','exclusividade','posse',-1),
(8,'Reacao a Cenarios','Se eu me apaixonasse por outra pessoa, seria honesto(a) sobre isso.','estrutura','posse',1),
(8,'Reacao a Cenarios','Se meu parceiro(a) propusesse abrir a relacao, eu consideraria seriamente.','exclusividade','estrutura',1),
(8,'Reacao a Cenarios','Me sinto mais ameacado(a) por conexao emocional externa do que por sexo.','exclusividade','posse',-1),
(8,'Reacao a Cenarios','Consigo imaginar felicidade genuina do meu parceiro(a) ao lado de outra pessoa.','posse','seguranca',1);

-- BLOCO 9
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(9,'Flexibilidade Emocional','Mudo minha visao sobre relacionamentos com facilidade a partir de novas experiencias.','estrutura','seguranca',1),
(9,'Flexibilidade Emocional','Lido bem com incerteza emocional em relacionamentos.','seguranca','estrutura',1),
(9,'Flexibilidade Emocional','Consigo aceitar formatos diferentes de amor sem desconforto.','estrutura','exclusividade',1),
(9,'Flexibilidade Emocional','Me imagino em relacoes multiplas no futuro.','rede','exclusividade',1);

-- BLOCO 10
INSERT OR IGNORE INTO perguntas_relacional (bloco,bloco_nome,texto,eixo1,eixo2,direcao) VALUES
(10,'Filosofia Relacional','Para mim, o amor precisa de exclusividade para ser pleno.','exclusividade',NULL,-1),
(10,'Filosofia Relacional','Acredito que estruturas relacionais tradicionais limitam o amor.','estrutura','exclusividade',1),
(10,'Filosofia Relacional','Vejo relacionamento como uma parceria que pode ter multiplas formas.','estrutura','rede',1),
(10,'Filosofia Relacional','Acredito que existem varias formas igualmente validas de amar.','rede','exclusividade',1);

-- PERFIS
INSERT OR IGNORE INTO perfis_relacionais (id,nome,emoji,descricao,diagnostico) VALUES
('mono-estrutural','Mono-Estrutural','👑','Exclusividade profunda, amor como escolha unica e total.','Voce possui uma arquitetura emocional construida sobre exclusividade, previsibilidade e estrutura. Para voce, amor e compromisso caminham juntos como um unico pacote — e isso nao e limitacao, e sua forma de ser inteiro(a) em uma relacao. Voce precisa se sentir unico(a) para se sentir amado(a), e isso faz sentido: sua seguranca afetiva nasce da certeza de ser a escolha principal. O seu modelo ideal valoriza profundidade sobre multiplicidade: uma conexao total com uma pessoa, em vez de multiplas conexoes superficiais. Sua clareza sobre o que quer e um ativo emocional imenso.'),
('aberto-controlado','Aberto Controlado','🔓','Aceita abertura com regras claras e um casal-base solido.','Voce esta em um ponto interessante do espectro: consegue imaginar abertura e liberdade, mas precisa de estrutura para se sentir seguro(a). Seu modelo ideal e uma relacao com base solida — um casal central — com acordos claros para experiencias externas. Voce nao rejeita a ideia de liberdade sexual, mas ela precisa ter regras e transparencia. Isso revela maturidade emocional: voce sabe que liberdade sem estrutura vira caos. Voce consegue conversar, negociar e adaptar acordos, desde que a base permaneca firme.'),
('poliamor','Poliamor Relacional','💞','Multiplos vinculos afetivos com consentimento e profundidade.','Voce tem uma capacidade genuina de amar multiplas pessoas ao mesmo tempo — nao como fuga ou aventura, mas como expressao real de como voce sente e se conecta. Para voce, amor nao se divide: ele se multiplica. Voce consegue ver a felicidade do seu parceiro(a) com outra pessoa sem sentir ameaca, e isso exige autoconhecimento consideravel. Voce valoriza honestidade radical, acordos explicitos e comunicacao constante, porque sabe que multiplos vinculos exigem mais presenca emocional, nao menos.'),
('explorador','Explorador Fluido','🌪️','Alta curiosidade, baixa rigidez, relacoes em constante transformacao.','Voce e movido(a) pela curiosidade e pela fluidez. Nao gosta de rotulos fixos, regras engessadas ou formatos que nao cabem mais no que voce esta vivendo. Relacionamentos para voce sao processos vivos — crescem, mudam, as vezes encerram e se reinventam. Seu maior ativo e a abertura genuina ao novo. O desafio pode estar em dar estabilidade suficiente para que outras pessoas se sintam seguras ao seu lado.'),
('anarquico','Anarquico Relacional','🧭','Rejeita hierarquias de vinculo, define tudo caso a caso com maxima autonomia.','Voce nao acredita em hierarquias de afeto. Para voce, cada vinculo existe por si mesmo, com seu proprio valor, sem precisar ser encaixado em uma categoria pre-definida. Voce tem altissima autonomia emocional e baixa necessidade de validacao por estruturas externas. Quando funciona, esse modelo cria redes afetivas extraordinariamente autenticas, onde cada vinculo e exatamente o que foi acordado.'),
('hibrido','Hibrido Adaptativo','⚖️','Muda com o contexto, mistura seguranca e liberdade conforme a relacao.','Voce e o perfil mais comum na pratica real — e talvez o mais complexo. Voce nao se encaixa em um unico modelo: dependendo do contexto, da pessoa e do momento, voce se aproxima mais da exclusividade ou da abertura. Isso nao e indecisao — e sensibilidade ao que cada relacao pede. Sua capacidade de transito entre modelos relacionais e uma habilidade rara que, quando usada com consciencia, cria conexoes excepcionalmente autenticas.');
