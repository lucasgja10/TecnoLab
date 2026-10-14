const Product = require('../Product');
const { Repository, converterId } = require('./Repository');

class ProductRepository extends Repository {
  constructor(db) {
    super(db, 'produtos', Product, ['nome', 'descricao', 'fabricante', 'preco', 'categoriaId', 'vendedorId', 'estoque']);
  }

  async buscarPorNome(nome) {
    return this.executar('buscarPorNome', async () => {
      if (typeof nome !== 'string' || nome.trim() === '') {
        throw new Error('Informe um nome como texto não vazio para buscar produtos.');
      }
      // Igualdade literal: não interpreta o nome como expressão regular.
      return this.colecao.find({ nome }).toArray();
    });
  }

  async buscarPorCategoria(categoriaId) {
    return this.executar('buscarPorCategoria', () => {
      const id = converterId(categoriaId, 'categoriaId');
      return this.colecao.find({ categoriaId: id }).toArray();
    });
  }

  async preparar(dados) {
    const produto = new Product({
      ...dados,
      categoriaId: converterId(dados.categoriaId, 'categoriaId'),
      vendedorId: converterId(dados.vendedorId, 'vendedorId'),
    });
    const categoria = await this.db.collection('categorias').findOne({ _id: produto.categoriaId });
    if (!categoria) throw new Error('Categoria informada não existe.');
    const vendedor = await this.db.collection('vendedores').findOne({ _id: produto.vendedorId });
    if (!vendedor) throw new Error('Vendedor informado não existe.');
    return { ...produto };
  }
}

module.exports = ProductRepository;
