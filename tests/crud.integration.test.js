const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { ObjectId } = require('mongodb');
const { conectar } = require('../src/database');
const CategoryRepository = require('../src/repositories/CategoryRepository');
const SellerRepository = require('../src/repositories/SellerRepository');
const ProductRepository = require('../src/repositories/ProductRepository');

const arquivoLog = path.join(__dirname, '..', 'logs', 'errors.log');

async function lerLog() {
  try {
    return await readFile(arquivoLog, 'utf8');
  } catch (erro) {
    if (erro.code === 'ENOENT') return '';
    throw erro;
  }
}

test('CRUD real das três entidades, validações e logs', {
  skip: process.env.TEST_MONGODB !== '1',
}, async () => {
  const cliente = await conectar();
  // Só este banco temporário, com nome gerado aqui, será removido ao final.
  const db = cliente.db(`tecnolab_teste_${randomUUID().replaceAll('-', '')}`);
  try {
    const inicioLog = (await lerLog()).length;
    const categorias = new CategoryRepository(db);
    const vendedores = new SellerRepository(db);
    const produtos = new ProductRepository(db);
    assert.deepEqual(await categorias.listar(), []);
    assert.deepEqual(await vendedores.listar(), []);
    assert.deepEqual(await produtos.listar(), []);

    const categoria = await categorias.cadastrar({ nome: 'Componentes' });
    const vendedor = await vendedores.cadastrar({ nome: 'Ana', contato: 'telefone' });
    const dados = {
      nome: 'Resistor', preco: 0.5, estoque: 0,
      categoriaId: categoria._id.toHexString(), vendedorId: vendedor._id.toHexString(),
    };
    const produto = await produtos.cadastrar(dados);
    assert.ok(produto.categoriaId instanceof ObjectId);
    assert.ok(produto.vendedorId instanceof ObjectId);
    // O bloqueio pertence à persistência, mesmo sem usar o menu.
    await assert.rejects(categorias.excluir(categoria._id.toHexString()), /categoria associada/);
    await assert.rejects(vendedores.excluir(vendedor._id.toHexString()), /vendedor associado/);
    assert.ok(await categorias.buscarPorId(categoria._id));
    assert.ok(await vendedores.buscarPorId(vendedor._id));

    for (const [repo, documento] of [[categorias, categoria], [vendedores, vendedor], [produtos, produto]]) {
      const id = documento._id.toHexString();
      assert.equal((await repo.listar()).length, 1);
      assert.equal((await repo.buscarPorId(id)).nome, documento.nome);
      assert.equal((await repo.atualizar(id, { nome: 'Novo nome' })).nome, 'Novo nome');
      assert.equal((await repo.buscarPorId(id)).nome, 'Novo nome');
      await repo.atualizar(id, { nome: 'Novo nome' });
      await assert.rejects(repo.atualizar(id, { nome: ' ' }), /nome/);
      await assert.rejects(repo.atualizar(id, { _id: new ObjectId() }), /Campo não permitido/);
      await assert.rejects(repo.atualizar(id, {}), /ao menos/);
      await assert.rejects(repo.buscarPorId('invalido'), /24 caracteres/);
      await assert.rejects(repo.atualizar(new ObjectId(), { nome: 'Ausente' }), /não encontrado/);
      await assert.rejects(repo.buscarPorId(new ObjectId()), /não encontrado/);
      await assert.rejects(repo.excluir(new ObjectId()), /não encontrado/);
    }

    await assert.rejects(categorias.cadastrar({ nome: '' }), /nome/);
    await assert.rejects(vendedores.cadastrar({ nome: 'Ana' }), /contato/);
    await assert.rejects(produtos.cadastrar({ ...dados, preco: 0 }), /preco/);
    await assert.rejects(produtos.atualizar(produto._id, { estoque: -1 }), /estoque/);
    await assert.rejects(produtos.cadastrar({ ...dados, categoriaId: 'erro' }), /categoriaId/);
    await assert.rejects(produtos.cadastrar({ ...dados, categoriaId: new ObjectId().toHexString() }), /Categoria informada/);
    await assert.rejects(produtos.cadastrar({ ...dados, vendedorId: new ObjectId().toHexString() }), /Vendedor informado/);
    await assert.rejects(produtos.atualizar(produto._id, { categoriaId: new ObjectId().toHexString() }), /Categoria informada/);
    await assert.rejects(produtos.atualizar(produto._id, { vendedorId: new ObjectId().toHexString() }), /Vendedor informado/);

    const outraCategoria = await categorias.cadastrar({ nome: 'Kits' });
    const outroVendedor = await vendedores.cadastrar({ nome: 'Bia', contato: 'email' });
    const atualizado = await produtos.atualizar(produto._id.toHexString(), {
      categoriaId: outraCategoria._id.toHexString(), vendedorId: outroVendedor._id.toHexString(),
      preco: 2, estoque: 5,
    });
    assert.ok(atualizado.categoriaId.equals(outraCategoria._id));
    assert.ok(atualizado.vendedorId.equals(outroVendedor._id));
    assert.equal((await produtos.buscarPorId(produto._id)).estoque, 5);
    await assert.rejects(categorias.excluir(outraCategoria._id), /categoria associada/);
    await assert.rejects(vendedores.excluir(outroVendedor._id), /vendedor associado/);

    // Simula falha de comunicação do driver sem desligar o servidor local.
    const repoFalha = new CategoryRepository(db);
    repoFalha.colecao = {
      collectionName: 'categorias',
      find() { throw new Error('Falha de comunicação simulada'); },
    };
    await assert.rejects(repoFalha.listar(), /comunicação simulada/);
    const registros = (await lerLog()).slice(inicioLog)
      .trim().split('\n').map((linha) => JSON.parse(linha));
    assert.ok(registros.some((r) => r.operacao === 'produtos.atualizar' && /estoque/.test(r.mensagem)));
    assert.ok(registros.some((r) => r.operacao === 'categorias.listar' && /simulada/.test(r.mensagem)));
    assert.ok(registros.some((r) => r.operacao === 'categorias.excluir' && /categoria associada/.test(r.mensagem)));
    assert.ok(registros.some((r) => r.operacao === 'vendedores.excluir' && /vendedor associado/.test(r.mensagem)));
    assert.ok(registros.every((r) => r.data && r.tipo && r.operacao && r.mensagem));

    assert.equal(await produtos.excluir(produto._id.toHexString()), true);
    assert.equal(await categorias.excluir(categoria._id), true);
    assert.equal(await categorias.excluir(outraCategoria._id), true);
    assert.equal(await vendedores.excluir(vendedor._id), true);
    assert.equal(await vendedores.excluir(outroVendedor._id), true);
    assert.deepEqual(await produtos.listar(), []);
    assert.deepEqual(await categorias.listar(), []);
    assert.deepEqual(await vendedores.listar(), []);
  } finally {
    try {
      await db.dropDatabase();
    } finally {
      await cliente.close();
    }
  }
});

test('fabricante e consultas de produtos por nome e categoria', {
  skip: process.env.TEST_MONGODB !== '1',
}, async () => {
  const cliente = await conectar();
  const db = cliente.db(`tecnolab_teste_${randomUUID().replaceAll('-', '')}`);
  try {
    const inicioLog = (await lerLog()).length;
    const categorias = new CategoryRepository(db);
    const vendedores = new SellerRepository(db);
    const produtos = new ProductRepository(db);
    const categoria = await categorias.cadastrar({ nome: 'Componentes' });
    const outraCategoria = await categorias.cadastrar({ nome: 'Kits' });
    const vendedor = await vendedores.cadastrar({ nome: 'Ana', contato: 'telefone' });
    const dados = {
      nome: 'Resistor', preco: 1, estoque: 0,
      categoriaId: categoria._id.toHexString(), vendedorId: vendedor._id.toHexString(),
    };
    const primeiro = await produtos.cadastrar({ ...dados, fabricante: 'Marca A' });
    const segundo = await produtos.cadastrar({ ...dados, categoriaId: outraCategoria._id });
    const terceiro = await produtos.cadastrar({ ...dados, nome: 'Resistor.*' });
    assert.equal((await produtos.buscarPorId(primeiro._id)).fabricante, 'Marca A');
    assert.equal((await produtos.buscarPorId(segundo._id)).fabricante, '');
    await produtos.atualizar(primeiro._id, { fabricante: 'Marca B' });
    await produtos.atualizar(primeiro._id, { estoque: 2 });
    assert.equal((await produtos.buscarPorId(primeiro._id)).fabricante, 'Marca B');
    await produtos.atualizar(primeiro._id, { fabricante: '' });
    assert.equal((await produtos.buscarPorId(primeiro._id)).fabricante, '');
    await assert.rejects(produtos.cadastrar({ ...dados, fabricante: 1 }), /fabricante/);
    await assert.rejects(produtos.atualizar(primeiro._id, { fabricante: null }), /fabricante/);
    assert.equal((await produtos.buscarPorId(primeiro._id)).fabricante, '');

    const ids = (documentos) => documentos.map((d) => d._id.toHexString()).sort();
    assert.deepEqual(ids(await produtos.buscarPorNome('Resistor')), ids([primeiro, segundo]));
    assert.deepEqual(ids(await produtos.buscarPorNome('Resistor.*')), ids([terceiro]));
    assert.deepEqual(await produtos.buscarPorNome('resistor'), []);
    assert.deepEqual(await produtos.buscarPorNome('Ausente'), []);
    assert.deepEqual(ids(await produtos.buscarPorCategoria(categoria._id)), ids([primeiro, terceiro]));
    assert.deepEqual(ids(await produtos.buscarPorCategoria(categoria._id.toHexString())), ids([primeiro, terceiro]));
    assert.deepEqual(ids(await produtos.buscarPorCategoria(outraCategoria._id)), ids([segundo]));
    assert.deepEqual(await produtos.buscarPorCategoria(new ObjectId()), []);
    await produtos.atualizar(primeiro._id, { categoriaId: outraCategoria._id.toHexString() });
    assert.deepEqual(ids(await produtos.buscarPorCategoria(categoria._id)), ids([terceiro]));
    assert.deepEqual(ids(await produtos.buscarPorCategoria(outraCategoria._id)), ids([primeiro, segundo]));

    for (const nome of [undefined, null, '', '   ', 1, {}]) {
      await assert.rejects(produtos.buscarPorNome(nome), /nome/);
    }
    for (const id of [undefined, null, '', 'invalido', 1, {}]) {
      await assert.rejects(produtos.buscarPorCategoria(id), /categoriaId/);
    }
    const registros = (await lerLog()).slice(inicioLog)
      .trim().split('\n').map(JSON.parse);
    assert.ok(registros.some((r) => r.operacao === 'produtos.buscarPorNome'));
    assert.ok(registros.some((r) => r.operacao === 'produtos.buscarPorCategoria'));
  } finally {
    try {
      await db.dropDatabase();
    } finally {
      await cliente.close();
    }
  }
});
