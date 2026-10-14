class Seller {
  constructor({ nome, contato } = {}) {
    this.nome = nome;
    this.contato = contato;
    this.validar();
  }

  validar() {
    if (typeof this.nome !== 'string' || this.nome.trim() === '') {
      throw new Error('Vendedor: nome é obrigatório e deve ser um texto não vazio.');
    }
    if (typeof this.contato !== 'string' || this.contato.trim() === '') {
      throw new Error('Vendedor: contato é obrigatório e deve ser um texto não vazio.');
    }
  }
}

module.exports = Seller;
