const { conectar } = require('../src/database');
const CategoryRepository = require('../src/repositories/CategoryRepository');
const SellerRepository = require('../src/repositories/SellerRepository');
const ProductRepository = require('../src/repositories/ProductRepository');

async function exemplo() {
  const cliente = await conectar();
  try {
    // Usa um banco separado para demonstração, sem alterar o catálogo TecnoLab.
    const db = cliente.db('tecnolab_exemplo');
    const categorias = new CategoryRepository(db);
    const vendedores = new SellerRepository(db);
    const produtos = new ProductRepository(db);

    const categoria = await categorias.cadastrar({ nome: 'Resistores', descricao: 'Componentes passivos' });
    const vendedor = await vendedores.cadastrar({ nome: 'TecnoLab', contato: 'contato@exemplo.com' });
    const produto = await produtos.cadastrar({
      nome: 'Resistor 100 ohms', preco: 0.5, estoque: 10,
      categoriaId: categoria._id.toHexString(), vendedorId: vendedor._id.toHexString(),
    });
    console.log('Cadastrados:', categoria, vendedor, produto);

    for (const [nome, repo, documento, alteracoes] of [
      ['Produto', produtos, produto, { preco: 0.75, estoque: 20 }],
      ['Categoria', categorias, categoria, { descricao: 'Resistores e capacitores' }],
      ['Vendedor', vendedores, vendedor, { contato: 'novo@exemplo.com' }],
    ]) {
      const id = documento._id.toHexString();
      console.log(nome, 'listar:', await repo.listar());
      console.log(nome, 'buscar:', await repo.buscarPorId(id));
      console.log(nome, 'atualizar:', await repo.atualizar(id, alteracoes));
      console.log(nome, 'excluir:', await repo.excluir(id));
    }
  } finally {
    await cliente.close();
  }
}

exemplo().catch(() => {
  console.error('O exemplo falhou. Confira a configuração e logs/errors.log.');
  process.exitCode = 1;
});
