const { MongoClient } = require('mongodb');
const { registrarErro } = require('./logger');

// A URI é lida apenas ao conectar, sem credenciais fixas no código.
async function conectar() {
  let cliente;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || !uri.trim()) {
      throw new Error('Defina a variável de ambiente MONGODB_URI antes de executar.');
    }
    cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await cliente.connect();
    return cliente;
  } catch (erro) {
    // Libera recursos também quando a tentativa de conexão falha.
    if (cliente) {
      try {
        await cliente.close();
      } catch (erroFechamento) {
        await registrarErro('conexao.fechar', erroFechamento);
      }
    }
    await registrarErro('conexao.conectar', erro);
    throw erro;
  }
}

module.exports = { conectar };
