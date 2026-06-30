// ============================================================
// BDSM Test — i18n Module (Internationalization)
// Suporta: pt (Português BR), en (English), es (Español)
// ============================================================

export const LANG_NAMES = {
  pt: '🇧🇷 Português',
  en: '🇺🇸 English',
  es: '🇪🇸 Español'
};

export const ARCHETYPE_NAMES = {
  'Dominant':       { pt: 'Dominante',         en: 'Dominant',         es: 'Dominante' },
  'Submissive':     { pt: 'Submisso(a)',        en: 'Submissive',       es: 'Sumiso/a' },
  'Master/Mistress':{ pt: 'Mestre/Senhora',     en: 'Master/Mistress',  es: 'Amo/Señora' },
  'Slave':          { pt: 'Escravo(a)',          en: 'Slave',            es: 'Esclavo/a' },
  'Owner':          { pt: 'Dono/Dona',           en: 'Owner',            es: 'Dueño/a' },
  'Pet':            { pt: 'Pet (Animal)',        en: 'Pet',              es: 'Pet (Mascota)' },
  'Rigger':         { pt: 'Rigger (Amarrador)',  en: 'Rigger',           es: 'Rigger (Atador)' },
  'Rope bunny':     { pt: 'Rope Bunny (Amarrado)', en: 'Rope Bunny',    es: 'Rope Bunny' },
  'Sadist':         { pt: 'Sádico(a)',           en: 'Sadist',           es: 'Sádico/a' },
  'Masochist':      { pt: 'Masoquista',          en: 'Masochist',        es: 'Masoquista' },
  'Voyeur':         { pt: 'Voyeur',              en: 'Voyeur',           es: 'Voyeur' },
  'Exhibitionist':  { pt: 'Exibicionista',       en: 'Exhibitionist',    es: 'Exhibicionista' },
  'Daddy/Mommy':    { pt: 'Daddy/Mommy',         en: 'Daddy/Mommy',      es: 'Daddy/Mommy' },
  'Little':         { pt: 'Little (Bebê)',       en: 'Little',           es: 'Little (Pequeño/a)' },
  'Degrader':       { pt: 'Degradador(a)',        en: 'Degrader',         es: 'Degradador/a' },
  'Degradee':       { pt: 'Degradado(a)',         en: 'Degradee',         es: 'Degradado/a' },
  'Brat tamer':     { pt: 'Domador(a) de Brat',  en: 'Brat Tamer',       es: 'Domador de Brat' },
  'Brat':           { pt: 'Brat (Rebelde)',       en: 'Brat',             es: 'Brat (Rebelde)' },
  'Experimentalist':{ pt: 'Experimentalista',     en: 'Experimentalist',  es: 'Experimentalista' },
  'Vanilla':        { pt: 'Vanilla (Convencional)',en:'Vanilla',          es: 'Vainilla' },
  'Primal (Hunter)':{ pt: 'Primal Caçador',      en: 'Primal (Hunter)',  es: 'Primal Cazador' },
  'Primal (Presa)': { pt: 'Primal Presa',        en: 'Primal (Prey)',    es: 'Primal Presa' },
  'Non-monogamist': { pt: 'Não-Monogâmico(a)',   en: 'Non-Monogamist',   es: 'No-Monógamo/a' },
  'Ageplayer':      { pt: 'Ageplayer',            en: 'Ageplayer',        es: 'Ageplayer' },
  'Switch':         { pt: 'Switch (Versátil)',    en: 'Switch',           es: 'Switch (Versátil)' }
};

export const PILAR_NAMES = {
  'Sensorial': { pt: 'Sensorial',   en: 'Sensory',    es: 'Sensorial' },
  'Hierarquia':{ pt: 'Hierarquia',  en: 'Hierarchy',  es: 'Jerarquía' },
  'Psicológico':{ pt: 'Psicológico', en: 'Psychological', es: 'Psicológico' },
  'Emocional': { pt: 'Emocional',   en: 'Emotional',  es: 'Emocional' },
  'Estético':  { pt: 'Estético',    en: 'Aesthetic',  es: 'Estético' }
};

export const I18N = {
  pt: {
    // Menu
    menu_profile: 'Meu Perfil / Histórico',
    menu_new_test: 'Novo Teste',
    menu_library: 'Biblioteca BDSM',
    menu_logout: 'Sair da Conta',
    menu_language: 'Idioma',

    // Login
    login_title: 'Nebulosa',
    login_subtitle: 'Descubra. Conecte. Explore.',
    login_access: 'Acessar Conta',
    login_register: 'Registrar Nova Conta',
    login_id_label: 'Instagram (@) ou E-mail',
    login_id_placeholder: 'Ex: @seu_perfil ou email@link.com',
    login_pronome_label: 'Seu Pronome',
    login_pass_label: 'Senha',
    login_pass_placeholder: 'Sua senha secreta',
    login_btn: 'Entrar',
    login_btn_register: 'Cadastrar Conta',
    login_toggle_to_register: 'Não tem uma conta? Crie uma aqui',
    login_toggle_to_login: 'Já possui uma conta? Entre aqui',
    login_lang_label: 'Escolha o idioma / Choose language / Elige el idioma',

    // Index
    index_title: 'Nebulosa',
    index_subtitle: 'Descubra suas afinidades e fetiches',
    index_quick_access: 'Acesso Rápido',
    index_enter_btn: 'Entrar / Registrar',
    index_configure: 'Configurar Teste',
    index_level_label: 'Tamanho do Questionário',
    index_level_basic: 'Nível Básico (30 Perguntas)',
    index_level_medium: 'Nível Médio (60 Perguntas)',
    index_level_full: 'Nível Completo (100 Perguntas)',
    index_profile_label: 'Você se considera atualmente...',
    index_profile_notsure: 'Não sei / Quero descobrir',
    index_profile_dom: 'Mais Dominante',
    index_profile_sub: 'Mais Submisso(a)',
    index_start_btn: 'Iniciar Novo Teste ➔',

    // Test
    test_title: 'Nebulosa',
    test_level_prefix: 'Teste Nível:',
    test_loading: 'Carregando perguntas...',
    test_question_counter: 'Pergunta {current} de {total}',
    test_back_btn: '⬅ Voltar Pergunta',
    likert_6: 'Concordo Totalmente',
    likert_5: 'Concordo',
    likert_4: 'Concordo Parcialmente',
    likert_3: 'Neutro',
    likert_2: 'Discordo Parcialmente',
    likert_1: 'Discordo',
    likert_0: 'Discordo Totalmente',

    // Results
    results_title: 'Seu Diagnóstico',
    results_persona_label: 'Sua Persona BDSM',
    results_pilares_title: 'Seus Pilares de Energia',
    results_pilares_desc: 'Mapeamento psicológico agrupando seus fetiches nas 5 energias kinky dominantes.',
    results_chart_title: 'Gráfico de Afinidades',
    results_diag_title: 'Seu Diagnóstico Kink',
    results_token_label: 'Código de Compartilhamento',
    results_token_desc: 'Copie este código para comparar compatibilidade com parceiros!',
    results_declared: 'Autodeclaração:',
    results_tab_report: 'Relatório',
    results_tab_compat: 'Compatibilidade',
    results_compat_title: 'Testar Sinergia',
    results_compat_desc: 'Insira o código de compartilhamento de outra pessoa para calcular a compatibilidade.',
    results_compat_label: 'Código do Parceiro(a)',
    results_compat_btn: 'Calcular Compatibilidade',
    results_download_btn: '⬇ Baixar Resultado',
    results_processing: 'Processando Persona...',

    // Profile
    profile_title: 'Meu Perfil',
    profile_new_test: 'Fazer o Teste BDSM',
    profile_new_test_desc: 'Você pode realizar um novo questionário a qualquer momento.',
    profile_new_test_btn: 'Novo Teste ➔',
    profile_form_title: 'Ficha Cadastral',
    profile_expand: '▼ Expandir',
    profile_collapse: '▲ Recolher',
    profile_nick: 'Nick de Acesso (Insta ou Identificador)',
    profile_pronome: 'Meu Pronome',
    profile_name: 'Nome Completo',
    profile_age: 'Idade',
    profile_city: 'Cidade / UF',
    profile_email: 'E-mail',
    profile_orientation: 'Orientação Sexual',
    profile_gender: 'Gênero',
    profile_instagram: 'Instagram Adicional',
    profile_save_btn: 'Salvar Alterações',
    profile_history: 'Resultados Anteriores',
    profile_view: 'Visualizar',
    profile_delete: 'Remover',
    profile_no_tests: 'Nenhum teste concluído localizado.',

    // Wiki
    wiki_title: 'Dicionário BDSM',
    wiki_subtitle: 'Enciclopédia Kinky & Termos',
    wiki_search: '🔍 Buscar termo (ex: SSC, Aftercare...)',
    wiki_loading: 'Carregando termos...',
    wiki_not_found: 'Nenhum termo localizado.',
    wiki_test_badge: 'Principal do Teste',
    wiki_english: 'Inglês:',

    // Pronomes
    pronome_ele: 'Ele / Dele (Masculino)',
    pronome_ela: 'Ela / Dela (Feminino)',
    pronome_elu: 'Elu / Delu (Neutro / Inclusivo)',

    // Personas
    persona_free_spirit: 'O Espírito Livre',
    persona_free_spirit_desc: 'Você possui um estilo versátil e fluido, não se prendendo a rótulos rígidos. Sua curiosidade natural te guia a explorar o BDSM de forma ampla e criativa, dosando afeto e técnica.',
    persona_control_architect: 'O Arquiteto do Controle',
    persona_control_architect_desc: 'A precisão técnica é sua maior aliada. Você desenha sessões BDSM perfeitamente arquitetadas, controlando a mente e o corpo do seu parceiro através de amarras firmes e estímulos sensoriais certeiros.',
    persona_devoted_protected: 'O Protegido Devoto',
    persona_devoted_protected_desc: 'Sua entrega é pura, focada na segurança e no acolhimento do Aftercare. Você ama desligar-se do mundo real, vestindo um papel lúdico e sentindo-se protegido(a) pelo carinho do seu guia.',
    persona_alchemist: 'O Explorador Alquimista',
    persona_alchemist_desc: 'Para você, o BDSM é um laboratório de sensações físicas. A alquimia entre dor consensual e prazer te atrai tanto no papel de quem aplica quanto no de quem recebe.',
    persona_mind_tamer: 'O Domador de Mentes',
    persona_mind_tamer_desc: 'As dinâmicas psicológicas e jogos mentais são onde você brilha. Adora impor ordens firmes, lidar com o desafio de quem te provoca e ver o controle ser aceito de bom grado.',
    persona_temple: 'O Templo Sensorial',
    persona_temple_desc: 'Seu corpo é um altar para receber a intensidade. O calor do impacto, o aperto das cordas e a entrega psicológica são seu caminho para alcançar o êxtase e a transcendência.',
    persona_vanilla: 'O Explorador Afetuoso',
    persona_vanilla_desc: 'Você valoriza a intimidade tradicional, o calor do toque e a conexão afetiva acima de dinâmicas de poder extremas. O carinho e a segurança mútua são os pilares da sua excitação.',

    // Profile map
    profile_nao_sabe: 'Não sabe / Quero descobrir',
    profile_dominante: 'Dominante',
    profile_submisso: 'Submisso(a)',
  },

  en: {
    // Menu
    menu_profile: 'My Profile / History',
    menu_new_test: 'New Test',
    menu_library: 'BDSM Library',
    menu_logout: 'Log Out',
    menu_language: 'Language',

    // Login
    login_title: 'Nebulosa',
    login_subtitle: 'Discover. Connect. Explore.',
    login_access: 'Sign In',
    login_register: 'Create New Account',
    login_id_label: 'Instagram (@) or Email',
    login_id_placeholder: 'Ex: @your_profile or email@mail.com',
    login_pronome_label: 'Your Pronoun',
    login_pass_label: 'Password',
    login_pass_placeholder: 'Your secret password',
    login_btn: 'Sign In',
    login_btn_register: 'Create Account',
    login_toggle_to_register: "Don't have an account? Create one here",
    login_toggle_to_login: 'Already have an account? Sign in here',
    login_lang_label: 'Choose language / Elige el idioma / Escolha o idioma',

    // Index
    index_title: 'Nebulosa',
    index_subtitle: 'Discover your kinks and affinities',
    index_quick_access: 'Quick Access',
    index_enter_btn: 'Sign In / Register',
    index_configure: 'Configure Test',
    index_level_label: 'Questionnaire Size',
    index_level_basic: 'Basic Level (30 Questions)',
    index_level_medium: 'Medium Level (60 Questions)',
    index_level_full: 'Full Level (100 Questions)',
    index_profile_label: 'You currently identify as...',
    index_profile_notsure: "Not sure / I want to discover",
    index_profile_dom: 'More Dominant',
    index_profile_sub: 'More Submissive',
    index_start_btn: 'Start New Test ➔',

    // Test
    test_title: 'Nebulosa',
    test_level_prefix: 'Test Level:',
    test_loading: 'Loading questions...',
    test_question_counter: 'Question {current} of {total}',
    test_back_btn: '⬅ Previous Question',
    likert_6: 'Strongly Agree',
    likert_5: 'Agree',
    likert_4: 'Partially Agree',
    likert_3: 'Neutral',
    likert_2: 'Partially Disagree',
    likert_1: 'Disagree',
    likert_0: 'Strongly Disagree',

    // Results
    results_title: 'Your Diagnosis',
    results_persona_label: 'Your BDSM Persona',
    results_pilares_title: 'Your Energy Pillars',
    results_pilares_desc: 'Psychological mapping grouping your kinks into 5 dominant energy archetypes.',
    results_chart_title: 'Affinity Chart',
    results_diag_title: 'Your Kink Diagnosis',
    results_token_label: 'Sharing Code',
    results_token_desc: 'Copy this code to compare compatibility with partners!',
    results_declared: 'Self-declaration:',
    results_tab_report: 'Report',
    results_tab_compat: 'Compatibility',
    results_compat_title: 'Test Synergy',
    results_compat_desc: "Enter someone else's sharing code to calculate compatibility.",
    results_compat_label: "Partner's Code",
    results_compat_btn: 'Calculate Compatibility',
    results_download_btn: '⬇ Download Result',
    results_processing: 'Processing Persona...',

    // Profile
    profile_title: 'My Profile',
    profile_new_test: 'Take the BDSM Test',
    profile_new_test_desc: 'You can take a new questionnaire at any time.',
    profile_new_test_btn: 'New Test ➔',
    profile_form_title: 'Profile Details',
    profile_expand: '▼ Expand',
    profile_collapse: '▲ Collapse',
    profile_nick: 'Login Handle (Insta or Identifier)',
    profile_pronome: 'My Pronoun',
    profile_name: 'Full Name',
    profile_age: 'Age',
    profile_city: 'City / State',
    profile_email: 'Email',
    profile_orientation: 'Sexual Orientation',
    profile_gender: 'Gender',
    profile_instagram: 'Additional Instagram',
    profile_save_btn: 'Save Changes',
    profile_history: 'Previous Results',
    profile_view: 'View',
    profile_delete: 'Remove',
    profile_no_tests: 'No completed tests found.',

    // Wiki
    wiki_title: 'BDSM Dictionary',
    wiki_subtitle: 'Kinky Encyclopedia & Terms',
    wiki_search: '🔍 Search term (e.g.: SSC, Aftercare...)',
    wiki_loading: 'Loading terms...',
    wiki_not_found: 'No terms found.',
    wiki_test_badge: 'Test Archetype',
    wiki_english: 'English:',

    // Pronouns
    pronome_ele: 'He / Him (Male)',
    pronome_ela: 'She / Her (Female)',
    pronome_elu: 'They / Them (Neutral / Inclusive)',

    // Personas
    persona_free_spirit: 'The Free Spirit',
    persona_free_spirit_desc: "You have a versatile and fluid style, not bound by rigid labels. Your natural curiosity guides you to explore BDSM broadly and creatively, balancing affection and technique.",
    persona_control_architect: 'The Control Architect',
    persona_control_architect_desc: "Technical precision is your greatest ally. You design perfectly crafted BDSM sessions, controlling your partner's mind and body through firm restraints and precise sensory stimulation.",
    persona_devoted_protected: 'The Devoted Protégé',
    persona_devoted_protected_desc: "Your surrender is pure, focused on safety and the comfort of Aftercare. You love disconnecting from reality, embracing a playful role and feeling protected by your guide's warmth.",
    persona_alchemist: 'The Alchemist Explorer',
    persona_alchemist_desc: "For you, BDSM is a laboratory of physical sensations. The alchemy of consensual pain and pleasure attracts you whether you're applying or receiving it.",
    persona_mind_tamer: 'The Mind Tamer',
    persona_mind_tamer_desc: "Psychological dynamics and mind games are where you shine. You love issuing firm commands, dealing with bratty challenges, and watching control be willingly accepted.",
    persona_temple: 'The Sensory Temple',
    persona_temple_desc: "Your body is an altar to receive intensity. The heat of impact, the tightness of ropes, and psychological surrender are your path to ecstasy and transcendence.",
    persona_vanilla: 'The Affectionate Explorer',
    persona_vanilla_desc: "You value traditional intimacy, the warmth of touch, and emotional connection above extreme power dynamics. Mutual affection and safety are the pillars of your arousal.",

    // Profile map
    profile_nao_sabe: "Not sure / I want to discover",
    profile_dominante: 'Dominant',
    profile_submisso: 'Submissive',
  },

  es: {
    // Menu
    menu_profile: 'Mi Perfil / Historial',
    menu_new_test: 'Nuevo Test',
    menu_library: 'Biblioteca BDSM',
    menu_logout: 'Cerrar Sesión',
    menu_language: 'Idioma',

    // Login
    login_title: 'Nebulosa',
    login_subtitle: 'Descubre. Conecta. Explora.',
    login_access: 'Iniciar Sesión',
    login_register: 'Crear Nueva Cuenta',
    login_id_label: 'Instagram (@) o Email',
    login_id_placeholder: 'Ej: @tu_perfil o email@correo.com',
    login_pronome_label: 'Tu Pronombre',
    login_pass_label: 'Contraseña',
    login_pass_placeholder: 'Tu contraseña secreta',
    login_btn: 'Entrar',
    login_btn_register: 'Crear Cuenta',
    login_toggle_to_register: '¿No tienes cuenta? Crea una aquí',
    login_toggle_to_login: '¿Ya tienes cuenta? Entra aquí',
    login_lang_label: 'Elige el idioma / Choose language / Escolha o idioma',

    // Index
    index_title: 'Nebulosa',
    index_subtitle: 'Descubre tus fetiches y afinidades',
    index_quick_access: 'Acceso Rápido',
    index_enter_btn: 'Entrar / Registrarse',
    index_configure: 'Configurar Test',
    index_level_label: 'Tamaño del Cuestionario',
    index_level_basic: 'Nivel Básico (30 Preguntas)',
    index_level_medium: 'Nivel Medio (60 Preguntas)',
    index_level_full: 'Nivel Completo (100 Preguntas)',
    index_profile_label: 'Actualmente te consideras...',
    index_profile_notsure: 'No sé / Quiero descubrir',
    index_profile_dom: 'Más Dominante',
    index_profile_sub: 'Más Sumiso/a',
    index_start_btn: 'Iniciar Nuevo Test ➔',

    // Test
    test_title: 'Nebulosa',
    test_level_prefix: 'Nivel del Test:',
    test_loading: 'Cargando preguntas...',
    test_question_counter: 'Pregunta {current} de {total}',
    test_back_btn: '⬅ Pregunta Anterior',
    likert_6: 'Totalmente de Acuerdo',
    likert_5: 'De Acuerdo',
    likert_4: 'Parcialmente de Acuerdo',
    likert_3: 'Neutral',
    likert_2: 'Parcialmente en Desacuerdo',
    likert_1: 'En Desacuerdo',
    likert_0: 'Totalmente en Desacuerdo',

    // Results
    results_title: 'Tu Diagnóstico',
    results_persona_label: 'Tu Persona BDSM',
    results_pilares_title: 'Tus Pilares de Energía',
    results_pilares_desc: 'Mapa psicológico que agrupa tus fetiches en las 5 energías kink dominantes.',
    results_chart_title: 'Gráfico de Afinidades',
    results_diag_title: 'Tu Diagnóstico Kink',
    results_token_label: 'Código de Compatibilidad',
    results_token_desc: '¡Copia este código para comparar compatibilidad con tu pareja!',
    results_declared: 'Autodeclaración:',
    results_tab_report: 'Reporte',
    results_tab_compat: 'Compatibilidad',
    results_compat_title: 'Probar Sinergía',
    results_compat_desc: 'Ingresa el código de otra persona para calcular la compatibilidad.',
    results_compat_label: 'Código de tu Pareja',
    results_compat_btn: 'Calcular Compatibilidad',
    results_download_btn: '⬇ Descargar Resultado',
    results_processing: 'Procesando Persona...',

    // Profile
    profile_title: 'Mi Perfil',
    profile_new_test: 'Hacer el Test BDSM',
    profile_new_test_desc: 'Puedes hacer un nuevo cuestionario en cualquier momento.',
    profile_new_test_btn: 'Nuevo Test ➔',
    profile_form_title: 'Datos del Perfil',
    profile_expand: '▼ Expandir',
    profile_collapse: '▲ Colapsar',
    profile_nick: 'Apodo de Acceso (Insta o Identificador)',
    profile_pronome: 'Mi Pronombre',
    profile_name: 'Nombre Completo',
    profile_age: 'Edad',
    profile_city: 'Ciudad / Estado',
    profile_email: 'Email',
    profile_orientation: 'Orientación Sexual',
    profile_gender: 'Género',
    profile_instagram: 'Instagram Adicional',
    profile_save_btn: 'Guardar Cambios',
    profile_history: 'Resultados Anteriores',
    profile_view: 'Ver',
    profile_delete: 'Eliminar',
    profile_no_tests: 'No se encontraron tests completados.',

    // Wiki
    wiki_title: 'Diccionario BDSM',
    wiki_subtitle: 'Enciclopedia Kink & Términos',
    wiki_search: '🔍 Buscar término (ej: SSC, Aftercare...)',
    wiki_loading: 'Cargando términos...',
    wiki_not_found: 'No se encontraron términos.',
    wiki_test_badge: 'Del Test',
    wiki_english: 'Inglés:',

    // Pronouns
    pronome_ele: 'Él / De él (Masculino)',
    pronome_ela: 'Ella / De ella (Femenino)',
    pronome_elu: 'Elle / De elle (Neutro / Inclusivo)',

    // Personas
    persona_free_spirit: 'El Espíritu Libre',
    persona_free_spirit_desc: 'Tienes un estilo versátil y fluido, sin atarte a etiquetas rígidas. Tu curiosidad natural te guía a explorar el BDSM de forma amplia y creativa, equilibrando afecto y técnica.',
    persona_control_architect: 'El Arquitecto del Control',
    persona_control_architect_desc: 'La precisión técnica es tu mayor aliado. Diseñas sesiones BDSM perfectamente orquestadas, controlando la mente y el cuerpo de tu pareja a través de ataduras firmes y estimulación sensorial precisa.',
    persona_devoted_protected: 'El Protegido Devoto',
    persona_devoted_protected_desc: 'Tu entrega es pura, centrada en la seguridad y el confort del Aftercare. Amas desconectarte del mundo real, adoptando un rol lúdico y sintiéndote protegido/a por el cariño de tu guía.',
    persona_alchemist: 'El Explorador Alquimista',
    persona_alchemist_desc: 'Para ti, el BDSM es un laboratorio de sensaciones físicas. La alquimia entre dolor consensuado y placer te atrae tanto en el rol de quien aplica como en el de quien recibe.',
    persona_mind_tamer: 'El Domador de Mentes',
    persona_mind_tamer_desc: 'Las dinámicas psicológicas y los juegos mentales son donde brillas. Adoras dar órdenes firmes, lidiar con el desafío de quien te provoca y ver el control ser aceptado de buen grado.',
    persona_temple: 'El Templo Sensorial',
    persona_temple_desc: 'Tu cuerpo es un altar para recibir la intensidad. El calor del impacto, la tensión de las cuerdas y la entrega psicológica son tu camino al éxtasis y la trascendencia.',
    persona_vanilla: 'El Explorador Afectuoso',
    persona_vanilla_desc: 'Valoras la intimidad tradicional, el calor del tacto y la conexión afectiva por encima de dinámicas de poder extremas. El cariño y la seguridad mutua son los pilares de tu excitación.',

    // Profile map
    profile_nao_sabe: 'No sé / Quiero descubrir',
    profile_dominante: 'Dominante',
    profile_submisso: 'Sumiso/a',
  }
};

export function getLang() {
  return localStorage.getItem('bdsm_lang') || 'pt';
}

export function setLang(lang) {
  localStorage.setItem('bdsm_lang', lang);
}

export function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) || (I18N['pt'] && I18N['pt'][key]) || key;
}

export function translateArchetype(name) {
  const lang = getLang();
  return (ARCHETYPE_NAMES[name] && ARCHETYPE_NAMES[name][lang]) || name;
}

export function translatePilar(name) {
  const lang = getLang();
  return (PILAR_NAMES[name] && PILAR_NAMES[name][lang]) || name;
}
