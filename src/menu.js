const { registrarErro } = require('./logger');

const campos = {
  produtos: ['nome', 'descricao', 'fabricante', 'preco', 'categoriaId', 'vendedorId', 'estoque'],
  categorias: ['nome', 'descricao'],
  vendedores: ['nome', 'contato'],
};

function converterEntrada(campo, texto) {
  if (campo === 'preco' || campo === 'estoque') {
    // Vazio não vira zero. Valores inválidos seguem para a validação de domínio.
    if (texto === '') return undefined;
    const numero = texto.replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numero) ? Number(numero) : NaN;
  }
  return texto;
}

function exibir(terminal, resultado) {
  if (Array.isArray(resultado) && resultado.length === 0) {
    terminal.mostrar('Nenhum registro encontrado.');
  } else {
    terminal.mostrar(JSON.stringify(resultado, null, 2));
  }
}

async function lerCampos(terminal, entidade, atualizar = false) {
  const dados = {};
  if (atualizar) terminal.mostrar('Enter mantém o valor. Para limpar descricao/fabricante, digite /limpar.');
  for (const campo of campos[entidade]) {
    const texto = await terminal.perguntar(`${campo}: `);
    if (texto === null) return null;
    if (atualizar && texto === '') continue;
    dados[campo] = atualizar && texto === '/limpar' && ['descricao', 'fabricante'].includes(campo)
      ? '' : converterEntrada(campo, texto);
  }
  return dados;
}

async function submenu(terminal, entidade, repo) {
  while (true) {
    terminal.mostrar(`\n${entidade}\n1 Cadastrar\n2 Listar\n3 Buscar por ID\n4 Atualizar\n5 Excluir`
      + (entidade === 'produtos' ? '\n6 Buscar por nome\n7 Buscar por categoria' : '') + '\n0 Voltar');
    const opcao = await terminal.perguntar('Opção: ');
    if (opcao === null) return false;
    if (opcao === '0') return true;
    try {
      let resultado;
      if (opcao === '1') {
        const dados = await lerCampos(terminal, entidade);
        if (dados === null) return false;
        resultado = await repo.cadastrar(dados);
      } else if (opcao === '2') {
        resultado = await repo.listar();
      } else if (['3', '4', '5'].includes(opcao)) {
        const id = await terminal.perguntar('ID: ');
        if (id === null) return false;
        if (opcao === '3') resultado = await repo.buscarPorId(id);
        if (opcao === '4') {
          // Mostra os valores atuais antes de pedir as alterações.
          exibir(terminal, await repo.buscarPorId(id));
          const dados = await lerCampos(terminal, entidade, true);
          if (dados === null) return false;
          if (Object.keys(dados).length === 0) {
            terminal.mostrar('Nenhuma alteração informada.');
            continue;
          }
          resultado = await repo.atualizar(id, dados);
        }
        if (opcao === '5') {
          await repo.excluir(id);
          terminal.mostrar('Registro excluído.');
          continue;
        }
      } else if (entidade === 'produtos' && ['6', '7'].includes(opcao)) {
        const valor = await terminal.perguntar(opcao === '6' ? 'Nome exato: ' : 'ID da categoria: ');
        if (valor === null) return false;
        resultado = opcao === '6' ? await repo.buscarPorNome(valor) : await repo.buscarPorCategoria(valor);
      } else {
        terminal.mostrar('Opção inválida.');
        continue;
      }
      exibir(terminal, resultado);
    } catch (erro) {
      // Repositórios já registram suas falhas. O menu mantém a sessão aberta.
      const mensagem = erro.name === 'Error' ? erro.message : 'Falha ao executar operação. Confira logs/errors.log.';
      terminal.mostrar(`Erro: ${mensagem}`);
    }
  }
}

async function executarMenu(terminal, repositorios) {
  const entidades = { '1': 'produtos', '2': 'categorias', '3': 'vendedores' };
  try {
    while (true) {
      terminal.mostrar('\nTecnoLab\n1 Produtos\n2 Categorias\n3 Vendedores\n0 Sair');
      const opcao = await terminal.perguntar('Opção: ');
      if (opcao === null || opcao === '0') return;
      const entidade = entidades[opcao];
      if (!entidade) {
        terminal.mostrar('Opção inválida.');
        continue;
      }
      if (!await submenu(terminal, entidade, repositorios[entidade])) return;
    }
  } catch (erro) {
    await registrarErro('terminal.menu', erro);
    throw erro;
  }
}

module.exports = { executarMenu, converterEntrada };
