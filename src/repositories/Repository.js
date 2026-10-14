const { ObjectId } = require('mongodb');
const { registrarErro } = require('../logger');

function converterId(id, campo = 'id') {
  if (id instanceof ObjectId) return id;
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
    throw new Error(`${campo} deve ser um ObjectId ou um texto hexadecimal de 24 caracteres.`);
  }
  return new ObjectId(id);
}

class Repository {
  constructor(db, colecao, Classe, campos) {
    this.db = db;
    this.colecao = db.collection(colecao);
    this.Classe = Classe;
    this.campos = campos;
  }

  async executar(operacao, tarefa) {
    try {
      return await tarefa();
    } catch (erro) {
      await registrarErro(`${this.colecao.collectionName}.${operacao}`, erro);
      throw erro;
    }
  }

  conferirCampos(dados) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      throw new Error('Informe um objeto com os campos da entidade.');
    }
    for (const campo of Object.keys(dados)) {
      if (!this.campos.includes(campo)) {
        throw new Error(`Campo não permitido: ${campo}.`);
      }
    }
  }

  async preparar(dados) {
    // O construtor da classe de domínio executa todas as validações.
    return { ...new this.Classe(dados) };
  }

  async encontrar(id) {
    const documento = await this.colecao.findOne({ _id: id });
    if (!documento) throw new Error(`Registro não encontrado em ${this.colecao.collectionName}.`);
    return documento;
  }

  async cadastrar(dados) {
    return this.executar('cadastrar', async () => {
      this.conferirCampos(dados);
      const documento = await this.preparar(dados);
      const resultado = await this.colecao.insertOne(documento);
      return { ...documento, _id: resultado.insertedId };
    });
  }

  async listar() {
    return this.executar('listar', () => this.colecao.find({}).toArray());
  }

  async buscarPorId(id) {
    return this.executar('buscarPorId', () => this.encontrar(converterId(id)));
  }

  async atualizar(id, alteracoes) {
    return this.executar('atualizar', async () => {
      const objectId = converterId(id);
      this.conferirCampos(alteracoes);
      if (Object.keys(alteracoes).length === 0) throw new Error('Informe ao menos um campo para atualizar.');
      const atual = await this.encontrar(objectId);
      const dados = {};
      for (const campo of this.campos) dados[campo] = atual[campo];
      const documento = await this.preparar({ ...dados, ...alteracoes });
      const resultado = await this.colecao.updateOne({ _id: objectId }, { $set: documento });
      // matchedCount também aceita uma atualização que mantém o mesmo valor.
      if (resultado.matchedCount === 0) throw new Error('Registro não encontrado ao atualizar.');
      return { ...documento, _id: objectId };
    });
  }

  async excluir(id) {
    return this.executar('excluir', async () => {
      const objectId = converterId(id);
      await this.antesDeExcluir(objectId);
      const resultado = await this.colecao.deleteOne({ _id: objectId });
      if (resultado.deletedCount === 0) throw new Error('Registro não encontrado ao excluir.');
      return true;
    });
  }

  async antesDeExcluir() {
    // Repositórios específicos podem conferir relacionamentos antes da exclusão.
  }
}

module.exports = { Repository, converterId };
