class Category {
  constructor({ nome, descricao = '' } = {}) {
    this.nome = nome;
    this.descricao = descricao;
    this.validar();
  }

  validar() {
    if (typeof this.nome !== 'string' || this.nome.trim() === '') {
      throw new Error('Categoria: nome é obrigatório e deve ser um texto não vazio.');
    }
    if (typeof this.descricao !== 'string') {
      throw new Error('Categoria: descricao deve ser um texto.');
    }
  }
}

module.exports = Category;
