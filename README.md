# TecnoLab

Aplicação de terminal para gerenciamento de um catálogo de componentes eletrônicos e kits acadêmicos. O projeto aplica Node.js, Orientação a Objetos e MongoDB em uma solução de back-end inspirada em um e-commerce.

## Equipe

- Lucas de Lima Quaglia
- João Vitor Angelim Nogueira

## Funcionalidades

- Cadastro, listagem, consulta por ID, atualização e exclusão de produtos, categorias e vendedores.
- Busca de produtos pelo nome e pela categoria.
- Validação dos dados antes de salvar no banco.
- Verificação das referências de categoria e vendedor associadas a cada produto.
- Bloqueio da exclusão de categorias e vendedores que ainda possuem produtos associados.
- Registro de erros em `logs/errors.log`.
- Menus interativos no terminal.

O sistema gerencia dados pelo terminal; não inclui interface web, carrinho, pagamentos ou autenticação.

## Entidades

| Entidade | Campos principais | Coleção MongoDB |
|---|---|---|
| Produto | nome, descrição, fabricante, preço, estoque, categoria e vendedor | `produtos` |
| Categoria | nome e descrição | `categorias` |
| Vendedor | nome e contato | `vendedores` |

Nome é obrigatório para todas as entidades. Produto também exige preço maior que zero, estoque inteiro igual ou maior que zero, categoria e vendedor existentes. A descrição e o fabricante do produto são opcionais. A modelagem completa está em [`docs/modelagem.md`](docs/modelagem.md).

## Requisitos

- Node.js 22 ou superior e npm.
- MongoDB em execução localmente ou uma conta configurada no MongoDB Atlas.

O projeto usa o MongoDB Driver oficial para Node.js. A instalação das dependências do projeto não instala o servidor MongoDB.

## Instalação e configuração

Na pasta raiz do projeto, instale as dependências:

```powershell
npm ci
```

Para MongoDB local, configure a URI no PowerShell e inicie a aplicação:

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/tecnolab'
npm start
```

Para usar o MongoDB Atlas, configure um usuário de banco e o acesso de rede no Atlas e atribua a URI de conexão à variável `MONGODB_URI`. Não compartilhe a URI nem inclua credenciais nos arquivos entregues.

Como alternativa, é possível criar um `.env` a partir do modelo e iniciar com o suporte nativo do Node.js:

```powershell
Copy-Item .env.example .env
# Edite .env e informe sua URI em MONGODB_URI.
node --env-file=.env src/index.js
```

`npm start` usa a variável definida na sessão do terminal e não carrega `.env` automaticamente. O arquivo `.env` está no `.gitignore`.

## Uso

No menu principal, escolha Produtos, Categorias ou Vendedores. Os submenus oferecem as operações de cadastro, listagem, busca, atualização e exclusão. Produtos também podem ser buscados por nome exato ou pelo ID da categoria. Digite `0` para voltar ou sair, conforme o menu exibido.

Cadastre primeiro uma categoria e um vendedor para depois cadastrar produtos. Os IDs aparecem nas listagens. Durante a atualização, pressione Enter para manter o valor atual; use `/limpar` para apagar a descrição ou o fabricante.

Ao iniciar, a aplicação verifica a conexão com o MongoDB. Essa verificação não cria coleções nem documentos; os dados são criados quando os cadastros são realizados. Ao sair pelo menu, a conexão é encerrada.

## Testes

Os testes de domínio, menus e inicialização podem ser executados sem habilitar a integração com o banco:

```powershell
node --test tests/domain.test.js tests/menu.test.js tests/startup.test.js
```

Para incluir os testes de integração, inicie o MongoDB e execute:

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/tecnolab_teste'
$env:TEST_MONGODB = '1'
node --test tests/domain.test.js tests/menu.test.js tests/startup.test.js tests/crud.integration.test.js
Remove-Item Env:TEST_MONGODB
```

Os testes de integração usam um banco temporário com nome aleatório e removem esse banco ao terminar. Eles não alteram o banco `tecnolab`.

## Organização do projeto

- `src/`: classes de domínio, conexão, menus, logger e repositórios de acesso ao MongoDB.
- `tests/`: testes de domínio, menu, inicialização e integração.
- `examples/crud.js`: exemplo de uso dos repositórios.
- `docs/modelagem.md`: entidades, campos e relacionamentos.
- `logs/errors.log`: arquivo criado automaticamente quando ocorre um erro.

