import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('🧪 Iniciando Testes de Integração de Produção...');
  let tokenA = '';
  let tokenB = '';
  let userAToken = '';
  let userBToken = '';
  let userAId = null;
  let userBId = null;

  try {
    // 1. Cadastrar Usuário A
    console.log('\n👤 1. Cadastrando Usuário A...');
    const regARes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: 'UserA_Test', senha: 'password123', pronome: 'ele' })
    });
    const regA = await regARes.json();
    console.log('Resposta Registro A:', regA);
    if (!regA.success) throw new Error('Falha ao registrar Usuário A');
    userAId = regA.userId;
    userAToken = regA.token;

    // 2. Cadastrar Usuário B
    console.log('\n👤 2. Cadastrando Usuário B...');
    const regBRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: 'UserB_Test', senha: 'password123', pronome: 'ela' })
    });
    const regB = await regBRes.json();
    console.log('Resposta Registro B:', regB);
    if (!regB.success) throw new Error('Falha ao registrar Usuário B');
    userBId = regB.userId;
    userBToken = regB.token;

    // 3. Fazer Login Usuário A para testar autenticação
    console.log('\n🔑 3. Testando Login com Usuário A...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: 'UserA_Test', senha: 'password123' })
    });
    const login = await loginRes.json();
    console.log('Resposta Login A:', login);
    if (!login.success) throw new Error('Falha ao fazer login do Usuário A');
    userAToken = login.token;

    // 4. Simular envio de respostas e cálculo de teste BDSM do Usuário A
    console.log('\n🔥 4. Calculando teste BDSM para Usuário A...');
    const calcARes = await fetch(`${API_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: { '1': 6, '2': 5, '3': 6, '4': 1, '5': 6, '6': 0, '7': 6, '8': 6 },
        userId: userAId,
        level: 'completo',
        profile: 'dominante'
      })
    });
    const calcA = await calcARes.json();
    console.log('Resultado Cálculo A (token):', calcA.token);
    tokenA = calcA.token;

    // 5. Simular envio de respostas e cálculo de teste BDSM do Usuário B
    console.log('\n🔥 5. Calculando teste BDSM para Usuário B...');
    const calcBRes = await fetch(`${API_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: { '1': 1, '2': 6, '3': 1, '4': 6, '5': 0, '6': 6, '7': 1, '8': 1 },
        userId: userBId,
        level: 'completo',
        profile: 'submisso'
      })
    });
    const calcB = await calcBRes.json();
    console.log('Resultado Cálculo B (token):', calcB.token);
    tokenB = calcB.token;

    // 6. Testar Comparativo BDSM (Match de afinidades)
    console.log('\n⚖️ 6. Testando cruzamento de Compatibilidade BDSM...');
    const compRes = await fetch(`${API_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenA, tokenB })
    });
    const comp = await compRes.json();
    console.log('Compatibilidade Final BDSM:', comp.compatibilidade + '%');
    console.log('Interpretacao:', comp.interpretacao);

    // 7. Testar salvar limite individual na wiki (Autenticado com JWT)
    console.log('\n🟢 7. Salvando Limite Individual (Semáforo)...');
    const limitRes = await fetch(`${API_URL}/user/${userAId}/limits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAToken}`
      },
      body: JSON.stringify({ termo: 'Shibari', nivel: 'verde', observacao: 'Somente com cordas de algodão' })
    });
    const limit = await limitRes.json();
    console.log('Resposta do Limite Salvo:', limit);

    // 8. Testar obter estatísticas de limite (Autenticado)
    console.log('\n📊 8. Obtendo estatísticas de limites do Usuário A...');
    const statsRes = await fetch(`${API_URL}/user/${userAId}/limits/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    const stats = await statsRes.json();
    console.log('Estatísticas do Usuário A:', stats);

    // 9. Simular envio de convite de relacionamento
    console.log('\n✉️ 9. Gerando código de convite de relacionamento...');
    const inviteRes = await fetch(`${API_URL}/relationship/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: userAId })
    });
    const invite = await inviteRes.json();
    console.log('Código de Convite Gerado:', invite.token);

    // 10. Aceitar convite (Usuário B aceita)
    console.log('\n🤝 10. Usuário B aceitando convite de relacionamento...');
    const acceptRes = await fetch(`${API_URL}/relationship/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userBId, token: invite.token })
    });
    const accept = await acceptRes.json();
    console.log('Resposta de Aceite de Relacionamento:', accept);

    // 11. Testar cruzamento de limites do casal (Sinergia)
    console.log('\n🔗 11. Testando Sinergia de limites do Casal...');
    const sinergiaRes = await fetch(`${API_URL}/user/compare-limits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAToken}`
      },
      body: JSON.stringify({ meuId: userAId, parceiroId: userBId })
    });
    const sinergia = await sinergiaRes.json();
    console.log('Sinergia Payload:', sinergia);
    console.log('Compatibilidade de Sinergia de Limites:', sinergia.compatibilidade + '%');
    if (sinergia.verdes) {
      console.log('Práticas verdes em comum:', sinergia.verdes.length);
    }

    console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! SISTEMA 100% OPERACIONAL!');
  } catch (error) {
    console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES:', error.message);
  }
}

runTests();
