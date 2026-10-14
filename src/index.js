const { conectar } = require('./database');
const { criarTerminal } = require('./terminal');
const { executarMenu } = require('./menu');
const { registrarErro } = require('./logger');
const ProductRepository = require('./repositories/ProductRepository');
const CategoryRepository = require('./repositories/CategoryRepository');
const SellerRepository = require('./repositories/SellerRepository');

async function main() {
  let cliente;
  const terminal = criarTerminal();
  try {
    cliente = await conectar();
    // Ping verifica a comunicação; não insere nem consulta documentos.
    try {
      await cliente.db().command({ ping: 1 });
    } catch (erro) {
      await registrarErro('conexao.ping', erro);
      throw erro;
    }
    console.log('TecnoLab: conexão com MongoDB verificada com sucesso.');
    const db = cliente.db();
    await executarMenu(terminal, {
      produtos: new ProductRepository(db),
      categorias: new CategoryRepository(db),
      vendedores: new SellerRepository(db),
    });
  } finally {
    terminal.fechar();
    if (cliente) {
      try {
        await cliente.close();
      } catch (erro) {
        await registrarErro('conexao.fechar', erro);
        throw erro;
      }
      console.log('Conexão encerrada.');
    }
  }
}

main().catch((erro) => {
  // Não exibe a mensagem do driver, que pode conter detalhes da URI.
  const mensagem = erro.message.startsWith('Defina a variável')
    ? erro.message
    : 'Falha na comunicação com MongoDB. Confira a URI, o servidor, a rede e as permissões.';
  console.error(mensagem);
  process.exitCode = 1;
});
