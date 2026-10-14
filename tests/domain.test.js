const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const Product = require('../src/Product');
const Category = require('../src/Category');
const Seller = require('../src/Seller');

function dadosProduto() {
  return {
    nome: 'Resistor', preco: 0.5, estoque: 0,
    categoriaId: new ObjectId(), vendedorId: new ObjectId(),
  };
}

test('classes preservam os campos válidos e aceitam descricao omitida', () => {
  const dados = dadosProduto();
  const produto = new Product(dados);
  for (const [campo, valor] of Object.entries(dados)) {
    assert.equal(produto[campo], valor);
  }
  assert.equal(produto.descricao, '');
  assert.equal(new Category({ nome: 'Componentes' }).descricao, '');
  assert.equal(new Seller({ nome: 'Ana', contato: 'telefone' }).contato, 'telefone');
  assert.equal(new Product({ ...dados, descricao: '100 ohms', estoque: 5 }).descricao, '100 ohms');
  assert.equal(new Category({ nome: 'Componentes', descricao: 'Peças' }).descricao, 'Peças');
});

test('nomes e contato obrigatórios rejeitam ausência, texto vazio e outros tipos', () => {
  for (const valor of [undefined, null, '', '   ', 123]) {
    assert.throws(() => new Category({ nome: valor }), /nome/);
    assert.throws(() => new Seller({ nome: valor, contato: 'telefone' }), /nome/);
    assert.throws(() => new Seller({ nome: 'Ana', contato: valor }), /contato/);
    assert.throws(() => new Product({ ...dadosProduto(), nome: valor }), /nome/);
  }
  assert.throws(() => new Category(), /nome/);
  assert.throws(() => new Seller(), /nome/);
  assert.throws(() => new Product(), /nome/);
});

test('preco deve ser número finito positivo, sem conversão de texto', () => {
  for (const preco of [undefined, null, 0, -1, NaN, Infinity, -Infinity, '10', true]) {
    assert.throws(() => new Product({ ...dadosProduto(), preco }), /preco/);
  }
});

test('estoque é obrigatório, aceita zero e rejeita negativos e frações', () => {
  for (const estoque of [undefined, null, -1, 0.5, NaN, Infinity, '0', true]) {
    assert.throws(() => new Product({ ...dadosProduto(), estoque }), /estoque/);
  }
});

test('referências devem ser ObjectId, sem consultar sua existência no banco', () => {
  for (const campo of ['categoriaId', 'vendedorId']) {
    for (const valor of [undefined, null, '', '507f1f77bcf86cd799439011', {}, 1]) {
      assert.throws(() => new Product({ ...dadosProduto(), [campo]: valor }), new RegExp(campo));
    }
  }
});

test('descricao opcional deve ser texto quando fornecida', () => {
  for (const descricao of [null, 1, {}]) {
    assert.throws(() => new Category({ nome: 'Componentes', descricao }), /descricao/);
    assert.throws(() => new Product({ ...dadosProduto(), descricao }), /descricao/);
  }
});

test('validar pode conferir novamente os campos após uma alteração em memória', () => {
  const produto = new Product(dadosProduto());
  produto.preco = -1;
  assert.throws(() => produto.validar(), /preco/);
  const categoria = new Category({ nome: 'Componentes' });
  categoria.nome = '';
  assert.throws(() => categoria.validar(), /nome/);
  const vendedor = new Seller({ nome: 'Ana', contato: 'telefone' });
  vendedor.contato = '';
  assert.throws(() => vendedor.validar(), /contato/);
});

test('fabricante é opcional, aceita texto e rejeita outros tipos', () => {
  assert.equal(new Product(dadosProduto()).fabricante, '');
  assert.equal(new Product({ ...dadosProduto(), fabricante: 'TecnoLab' }).fabricante, 'TecnoLab');
  assert.equal(new Product({ ...dadosProduto(), fabricante: '' }).fabricante, '');
  for (const fabricante of [null, 123, true, {}, []]) {
    assert.throws(() => new Product({ ...dadosProduto(), fabricante }), /fabricante/);
  }
  const produto = new Product(dadosProduto());
  produto.fabricante = 123;
  assert.throws(() => produto.validar(), /fabricante/);
});
