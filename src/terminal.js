const readline = require('node:readline');

function criarTerminal() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const linhas = rl[Symbol.asyncIterator]();
  rl.on('SIGINT', () => rl.close());
  return {
    async perguntar(texto) {
      process.stdout.write(texto);
      const linha = await linhas.next();
      // EOF e Ctrl+C usam o mesmo fluxo de saída do menu.
      return linha.done ? null : linha.value.trim();
    },
    mostrar(texto) { console.log(texto); },
    fechar() { rl.close(); },
  };
}

module.exports = { criarTerminal };
