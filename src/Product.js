// ObjectId é apenas um tipo de identificador; este arquivo não conecta ao banco.
const { ObjectId } = require('mongodb');

class Product {
  constructor({ nome, descricao = '', fabricante = '', preco, categoriaId, vendedorId, estoque } = {}) {
    this.nome = nome;
    this.descricao = descricao;
    this.fabricante = fabricante;
    this.preco = preco;
    this.categoriaId = categoriaId;
    this.vendedorId = vendedorId;
    this.estoque = estoque;
    this.validar();
  }

  validar() {
    if (typeof this.nome !== 'string' || this.nome.trim() === '') {
      throw new Error('Produto: nome é obrigatório e deve ser um texto não vazio.');
    }
    if (typeof this.descricao !== 'string') {
      throw new Error('Produto: descricao deve ser um texto.');
    }
    if (typeof this.fabricante !== 'string') {
      throw new Error('Produto: fabricante deve ser um texto.');
    }
    if (!Number.isFinite(this.preco) || this.preco <= 0) {
      throw new Error('Produto: preco é obrigatório e deve ser um número finito maior que zero.');
    }
    if (!(this.categoriaId instanceof ObjectId)) {
      throw new Error('Produto: categoriaId é obrigatório e deve ser um ObjectId.');
    }
    if (!(this.vendedorId instanceof ObjectId)) {
      throw new Error('Produto: vendedorId é obrigatório e deve ser um ObjectId.');
    }
    if (!Number.isInteger(this.estoque) || this.estoque < 0) {
      throw new Error('Produto: estoque é obrigatório e deve ser um número inteiro zero ou maior.');
    }
  }
}

module.exports = Product;
