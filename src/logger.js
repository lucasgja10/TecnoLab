const { mkdir, appendFile } = require('node:fs/promises');
const path = require('node:path');

const arquivoLog = path.join(__dirname, '..', 'logs', 'errors.log');

function limparMensagem(mensagem) {
  let texto = String(mensagem);
  if (process.env.MONGODB_URI) {
    texto = texto.split(process.env.MONGODB_URI).join('[URI omitida]');
  }
  return texto.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '[URI omitida]');
}

async function registrarErro(operacao, erro) {
  const registro = {
    data: new Date().toISOString(),
    operacao,
    tipo: erro.name || 'Error',
    mensagem: limparMensagem(erro.message || erro),
  };
  try {
    await mkdir(path.dirname(arquivoLog), { recursive: true });
    await appendFile(arquivoLog, JSON.stringify(registro) + '\n', 'utf8');
  } catch {
    // Uma falha do log não substitui o erro original da operação.
    console.error('Não foi possível registrar o erro em logs/errors.log.');
  }
}

module.exports = { registrarErro };
