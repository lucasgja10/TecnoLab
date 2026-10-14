const Category = require('../Category');
const { Repository } = require('./Repository');

class CategoryRepository extends Repository {
  constructor(db) {
    super(db, 'categorias', Category, ['nome', 'descricao']);
  }

  async antesDeExcluir(id) {
    const produto = await this.db.collection('produtos').findOne({ categoriaId: id });
    if (produto) throw new Error('Não é possível excluir categoria associada a produtos.');
  }
}

module.exports = CategoryRepository;
