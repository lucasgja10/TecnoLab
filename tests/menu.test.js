const test = require('node:test');
const assert = require('node:assert/strict');
const { executarMenu, converterEntrada } = require('../src/menu');

test('entradas numéricas aceitam decimal com vírgula e preservam erros para validação', () => {
  assert.equal(converterEntrada('preco', '1,50'), 1.5);
  assert.equal(converterEntrada('estoque', '0'), 0);
  assert.equal(converterEntrada('preco', ''), undefined);
  assert.ok(Number.isNaN(converterEntrada('estoque', '10 unidades')));
  assert.ok(Number.isNaN(converterEntrada('preco', '0x10')));
  assert.equal(converterEntrada('estoque', '-1'), -1);
  assert.equal(converterEntrada('nome', 'Resistor'), 'Resistor');
});

function terminalSimulado(entradas) {
  const mensagens = [];
  return {
    mensagens,
    async perguntar() { return entradas.length ? entradas.shift() : null; },
    mostrar(texto) { mensagens.push(texto); },
  };
}

test('menu encaminha CRUD de todas as entidades e buscas específicas de produtos', async () => {
  const chamadas = [];
  const repos = {};
  for (const entidade of ['produtos', 'categorias', 'vendedores']) {
    repos[entidade] = {};
    for (const metodo of ['cadastrar', 'listar', 'buscarPorId', 'atualizar', 'excluir', 'buscarPorNome', 'buscarPorCategoria']) {
      repos[entidade][metodo] = async (...args) => {
        chamadas.push({ entidade, metodo, args });
        return metodo === 'listar' ? [] : { nome: 'Atual' };
      };
    }
  }
  const terminal = terminalSimulado([
    '9', '1', '1', 'Resistor', '', 'Marca', '1,50', 'cat', 'vend', '0',
    '2', '3', 'p1', '4', 'p1', '', '/limpar', '/limpar', '2', '', '', '5',
    '6', 'Resistor', '7', 'cat', '5', 'p1', '0',
    '2', '1', 'Componentes', '', '2', '3', 'c1', '4', 'c1', 'Kits', '', '5', 'c1', '0',
    '3', '1', 'Ana', 'telefone', '2', '3', 'v1', '4', 'v1', '', 'email', '5', 'v1', '0', '0',
  ]);
  await executarMenu(terminal, repos);
  for (const entidade of Object.keys(repos)) {
    for (const metodo of ['cadastrar', 'listar', 'buscarPorId', 'atualizar', 'excluir']) {
      assert.ok(chamadas.some((c) => c.entidade === entidade && c.metodo === metodo));
    }
  }
  const cadastro = chamadas.find((c) => c.entidade === 'produtos' && c.metodo === 'cadastrar').args[0];
  assert.equal(cadastro.preco, 1.5);
  assert.equal(cadastro.estoque, 0);
  const alteracoes = chamadas.find((c) => c.entidade === 'produtos' && c.metodo === 'atualizar').args[1];
  assert.deepEqual(alteracoes, { descricao: '', fabricante: '', preco: 2, estoque: 5 });
  assert.ok(chamadas.some((c) => c.metodo === 'buscarPorNome' && c.args[0] === 'Resistor'));
  assert.ok(chamadas.some((c) => c.metodo === 'buscarPorCategoria' && c.args[0] === 'cat'));
  assert.ok(terminal.mensagens.includes('Opção inválida.'));
  assert.ok(terminal.mensagens.includes('Nenhum registro encontrado.'));
});

test('menu continua após erro de operação e encerra ao acabar a entrada', async () => {
  let listagens = 0;
  const terminal = terminalSimulado(['2', '3', 'invalido', '2']);
  await executarMenu(terminal, {
    categorias: {
      async buscarPorId() { throw new Error('ID inválido'); },
      async listar() { listagens++; return []; },
    },
  });
  assert.equal(listagens, 1);
  assert.ok(terminal.mensagens.includes('Erro: ID inválido'));
});

test('EOF durante cadastro cancela a operação', async () => {
  let cadastrou = false;
  await executarMenu(terminalSimulado(['1', '1', 'Resistor']), {
    produtos: { async cadastrar() { cadastrou = true; } },
  });
  assert.equal(cadastrou, false);
});
