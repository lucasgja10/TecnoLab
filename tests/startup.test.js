const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function executarComFalha(etapa) {
  // Substitui apenas a conexão e o logger no processo filho, sem acessar MongoDB.
  const script = `
    const etapa = ${JSON.stringify(etapa)};
    const banco = { collection() { return {}; }, async command() {
      if (etapa === 'ping') throw new Error('Falha de ping simulada');
    } };
    const cliente = { db() { return banco; }, async close() {
      console.log('FECHAMENTO_TENTADO');
      if (etapa === 'fechar') throw new Error('Falha de fechamento simulada');
    } };
    require.cache[require.resolve('./src/database')] = {
      exports: { async conectar() { return cliente; } }
    };
    require.cache[require.resolve('./src/logger')] = {
      exports: { async registrarErro(operacao, erro) {
        console.log('LOG:' + operacao + ':' + erro.message);
      } }
    };
    require('./src/index');
  `;
  return spawnSync(process.execPath, ['-e', script], {
    cwd: path.join(__dirname, '..'), input: '0\n', encoding: 'utf8', timeout: 10000,
  });
}

test('falha no ping é registrada e ainda tenta fechar o cliente', () => {
  const resultado = executarComFalha('ping');
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.status, 1);
  assert.match(resultado.stdout, /LOG:conexao.ping:Falha de ping simulada/);
  assert.match(resultado.stdout, /FECHAMENTO_TENTADO/);
});

test('falha ao fechar o cliente é registrada e encerra com erro tratado', () => {
  const resultado = executarComFalha('fechar');
  assert.equal(resultado.error, undefined);
  assert.equal(resultado.status, 1);
  assert.match(resultado.stdout, /LOG:conexao.fechar:Falha de fechamento simulada/);
  assert.match(resultado.stderr, /Falha na comunicação com MongoDB/);
});
