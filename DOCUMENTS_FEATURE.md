# Sistema de Documentos Markdown

## Visão Geral

O sistema de documentos permite criar, editar e organizar documentação em formato Markdown com suporte GitHub Flavored Markdown (GFM). Os documentos podem ser associados a projetos, tarefas ou permanecer independentes.

## Funcionalidades

### ✨ Principais Features

- **Editor Markdown Rico**: Editor com preview em tempo real
- **GitHub Flavored Markdown**: Suporte completo a GFM (tabelas, task lists, etc.)
- **Syntax Highlighting**: Destaque de sintaxe para blocos de código
- **Associação Flexível**: Vincular documentos a projetos ou tarefas
- **Tags e Organização**: Sistema de tags para categorização
- **Documentos Fixados**: Destacar documentos importantes
- **Controle de Visibilidade**: Documentos públicos ou privados
- **Slug Personalizado**: URLs amigáveis

### 🔒 Segurança e Permissões

- Apenas o autor pode editar/apagar documentos
- Documentos públicos são visíveis para membros do projeto/tarefa associado
- Documentos privados são visíveis apenas para o autor
- Validação de acesso a projetos e tarefas antes de criar associações

## Estrutura

### Backend (`/src/documents`)

```
documents/
├── dto/
│   ├── create-document.dto.ts    # DTO para criar documentos
│   └── update-document.dto.ts    # DTO para atualizar documentos
├── documents.controller.ts        # Endpoints REST
├── documents.service.ts           # Lógica de negócio
└── documents.module.ts            # Módulo NestJS
```

### Frontend (`/frontend/app/documents`)

```
documents/
├── page.tsx                       # Lista de documentos
├── new/page.tsx                   # Criar novo documento
└── [id]/
    ├── page.tsx                   # Visualizar documento
    └── edit/page.tsx              # Editar documento
```

### Componentes (`/frontend/components`)

```
components/
├── MarkdownEditor.tsx             # Editor Markdown com preview
├── MarkdownViewer.tsx             # Visualizador de Markdown
└── DocumentsList.tsx              # Lista de documentos (reutilizável)
```

## API Endpoints

### Documentos

```
GET    /documents                  # Listar todos os documentos
GET    /documents?projectId=:id    # Filtrar por projeto
GET    /documents?taskId=:id       # Filtrar por tarefa
GET    /documents/:id              # Ver documento específico
POST   /documents                  # Criar novo documento
PATCH  /documents/:id              # Atualizar documento
DELETE /documents/:id              # Apagar documento
```

### Exemplo de Request (Criar Documento)

```json
POST /documents
{
  "title": "README do Projeto",
  "content": "# Projeto XYZ\n\n## Setup\n\n```bash\nnpm install\n```",
  "slug": "readme-projeto-xyz",
  "projectId": "uuid-do-projeto",
  "isPublic": true,
  "isPinned": true,
  "tags": ["readme", "setup", "docs"]
}
```

## Uso

### 1. Criar Documento Independente

1. Ir para `/documents`
2. Clicar em "Novo Documento"
3. Preencher título e conteúdo em Markdown
4. Adicionar tags (opcional)
5. Salvar

### 2. Criar Documento para Projeto

**Opção A - Através da lista de documentos:**
1. Ir para `/documents/new?projectId=UUID`
2. O documento já estará associado ao projeto

**Opção B - Através do componente DocumentsList:**
```tsx
import { DocumentsList } from '@/components/DocumentsList';

<DocumentsList projectId={projectId} />
```

### 3. Criar Documento para Tarefa

Similar ao projeto, usar `taskId` em vez de `projectId`:
```tsx
<DocumentsList taskId={taskId} />
```

### 4. Usar o Editor Markdown

O editor suporta:

- **Headers**: `# H1`, `## H2`, etc.
- **Listas**: `- item` ou `1. item`
- **Task Lists**: `- [ ] Todo` ou `- [x] Feito`
- **Código inline**: `` `código` ``
- **Blocos de código**:
  ````markdown
  ```javascript
  const hello = 'world';
  ```
  ````
- **Tabelas**:
  ```markdown
  | Coluna 1 | Coluna 2 |
  |----------|----------|
  | Valor 1  | Valor 2  |
  ```
- **Links**: `[texto](url)`
- **Imagens**: `![alt](url)`
- **Bold/Italic**: `**bold**`, `*italic*`

## Integração com Projetos e Tarefas

### Em Páginas de Projeto

Adicionar na página do projeto:

```tsx
import { DocumentsList } from '@/components/DocumentsList';

// Dentro do componente
<div className="mt-8">
  <DocumentsList projectId={project.id} />
</div>
```

### Em Páginas de Tarefa

Similar:

```tsx
<DocumentsList taskId={task.id} />
```

## Modelo de Dados

### Document Schema (Prisma)

```prisma
model Document {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text
  slug        String?
  
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  authorId    String
  author      User     @relation("DocumentAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  
  isPublic    Boolean  @default(true)
  isPinned    Boolean  @default(false)
  
  tags        String[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Casos de Uso

### 📋 README de Projeto
```markdown
# Projeto Sistema de Gestão

## Descrição
Sistema para gestão de projetos e tarefas...

## Setup
1. Clone o repositório
2. Execute `npm install`
3. Configure `.env`
4. Execute `npm run dev`
```

### 📝 Especificações Técnicas
```markdown
# Especificação: API de Autenticação

## Requisitos
- OAuth 2.0
- JWT tokens
- 2FA opcional

## Endpoints
- POST /auth/login
- POST /auth/register
- POST /auth/verify
```

### 🐛 Troubleshooting Guide
```markdown
# Guia de Resolução de Problemas

## Erro: Database Connection Failed
**Solução**: Verificar se PostgreSQL está a correr...

## Erro: Module not found
**Solução**: Executar `npm install`...
```

### 📖 Onboarding
```markdown
# Bem-vindo ao Projeto!

## Primeiro Dia
- [ ] Setup do ambiente
- [ ] Ler documentação
- [ ] Criar conta de teste

## Recursos Úteis
- [Wiki](link)
- [Slack](link)
```

## Próximas Melhorias Sugeridas

- [ ] **Versionamento**: Histórico de alterações
- [ ] **Templates**: Templates pré-definidos (README, Spec, etc.)
- [ ] **Comentários**: Discussões nos documentos
- [ ] **Anexos**: Upload de imagens/ficheiros
- [ ] **Pesquisa Full-Text**: Pesquisar em todos os documentos
- [ ] **Export**: Export para PDF ou HTML
- [ ] **Colaboração**: Edição colaborativa em tempo real
- [ ] **Aprovações**: Workflow de aprovação de documentos

## Tecnologias Utilizadas

### Backend
- NestJS
- Prisma ORM
- PostgreSQL

### Frontend
- Next.js 14
- React
- TypeScript
- @uiw/react-md-editor (Editor Markdown)
- react-markdown (Renderização)
- remark-gfm (GitHub Flavored Markdown)
- react-syntax-highlighter (Syntax highlighting)
- Tailwind CSS

## Notas Importantes

1. **Associação Exclusiva**: Um documento só pode estar associado a UM projeto OU UMA tarefa (não ambos)
2. **Cascata de Exclusão**: Se um projeto/tarefa for apagado, os documentos associados também são apagados
3. **Permissões**: Documentos públicos são visíveis para todos os membros do projeto/tarefa associado
4. **Tags**: As tags são case-sensitive e armazenadas como array de strings
5. **Markdown**: Todo o conteúdo é armazenado como texto plano em Markdown

## Troubleshooting

### Editor não carrega
- Verificar se as dependências estão instaladas: `npm install`
- O editor é carregado dinamicamente com `next/dynamic` para evitar SSR

### Syntax highlighting não funciona
- Verificar se `react-syntax-highlighter` está instalado
- Importar o tema correto (vscDarkPlus)

### Documento não aparece para outros utilizadores
- Verificar se `isPublic` está `true`
- Verificar se o utilizador tem acesso ao projeto/tarefa associado
