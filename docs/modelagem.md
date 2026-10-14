# Modelagem do catálogo TecnoLab

## Objetivo

Aplicação de terminal para cadastrar e consultar produtos, categorias e vendedores usando Node.js e o MongoDB Driver.

## Entidades e coleções

### Produto — coleção `produtos`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `nome` | texto | Sim | Não pode ficar vazio |
| `descricao` | texto | Não | — |
| `fabricante` | texto | Não | Deve ser texto quando informado; pode ficar vazio |
| `preco` | número | Sim | Deve ser maior que zero |
| `categoriaId` | ObjectId | Sim | Deve identificar uma categoria cadastrada |
| `vendedorId` | ObjectId | Sim | Deve identificar um vendedor cadastrado |
| `estoque` | número inteiro | Sim | Deve ser zero ou maior; valor inicial pode ser zero |

### Categoria — coleção `categorias`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `nome` | texto | Sim | Não pode ficar vazio |
| `descricao` | texto | Não | — |

### Vendedor — coleção `vendedores`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `nome` | texto | Sim | Não pode ficar vazio |
| `contato` | texto | Sim | Não pode ficar vazio |

## Relacionamentos

- Uma categoria pode estar associada a vários produtos.
- Um vendedor pode anunciar vários produtos.
- Cada produto guarda `categoriaId` e `vendedorId`, que apontam para documentos nas coleções correspondentes.
- Antes de cadastrar ou atualizar um produto, a aplicação deve confirmar que a categoria e o vendedor existem.
- Não é permitido excluir uma categoria ou vendedor enquanto houver produtos associados. Primeiro exclua ou reassocie os produtos.

## Consultas previstas

- Listar e consultar produtos pelo identificador ou nome.
- Buscar produtos por categoria.
- Listar e consultar categorias e vendedores.
- Atualizar e excluir cada tipo de registro.

## Limites do escopo

O projeto não terá carrinho, pagamento, autenticação, interface web ou bibliotecas externas não autorizadas. A interação será pelo terminal e a persistência será feita pelo MongoDB Driver para Node.js.
