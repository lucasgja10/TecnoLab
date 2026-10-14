const Seller = require('../Seller');
const { Repository } = require('./Repository');

class SellerRepository extends Repository {
  constructor(db) {
    super(db, 'vendedores', Seller, ['nome', 'contato']);
  }

  async antesDeExcluir(id) {
    const produto = await this.db.collection('produtos').findOne({ vendedorId: id });
    if (produto) throw new Error('Não é possível excluir vendedor associado a produtos.');
  }
}

module.exports = SellerRepository;
