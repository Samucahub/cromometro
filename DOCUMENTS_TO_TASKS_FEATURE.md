# Documentação: Anexar Documentos a Tarefas

## Objetivo
Permitir que usuários anexem documentos existentes a tarefas (simples ou de projeto), visualizem os documentos anexados nos detalhes da tarefa e naveguem para a página de visualização do documento.

## Fluxo Implementado

### 1. Criar/Editar Documento
- Navegue até **Documentos** → **+ Novo Documento**
- Preencha o título, conteúdo em Markdown
- Opcionalmente, selecione uma tarefa ao criar (via query param `?taskId=...`)
- Clique em **Criar Documento**

### 2. Anexar Documento a uma Tarefa
- Na página **Project Board**, clique em uma tarefa para editar
- Na seção **Documentos**, clique em **+ Adicionar**
- Selecione um documento disponível na lista suspensa
- O documento será anexado à tarefa automaticamente

### 3. Ver Documentos Anexados
- Quando editar uma tarefa, você verá a seção **Documentos**
- Cada documento mostra:
  - Título
  - Autor e data de criação
  - Botão para **visualizar** (olho 👁️)
  - Botão para **remover** (X)

### 4. Visualizar Documento
- Clique no ícone de visualização (👁️) ao lado do documento
- Ou acesse diretamente via URL: `/documents/[id]`
- A página de visualização mostra:
  - Breadcrumb navegável (Documentos → Projeto/Tarefa → Documento)
  - Título, autor e data de criação
  - Conteúdo em Markdown (somente leitura)
  - Tags do documento
  - Status (fixado/privado)
  - Botões de Editar e Apagar (apenas para o autor)

## Alterações Técnicas

### Backend (NestJS)

#### 1. **TasksController** (`src/tasks/tasks.controller.ts`)
- Novo endpoint: `GET /tasks/:id`
- Retorna dados da tarefa com documentos relacionados

#### 2. **TasksService** (`src/tasks/tasks.service.ts`)
- Novo método: `findOne(userId: string, id: string)`
- Inclui relações: documents com autor, status, project e assignees

### Frontend (Next.js/React)

#### 1. **TaskDialog Component** (`frontend/components/TaskDialog.tsx`)
- Novo componente reutilizável para criar/editar tarefas
- **Modo edição:** exibe seção de documentos
- **Modo criação:** sem seção de documentos
- Funcionalidades:
  - Adicionar documentos disponíveis
  - Remover documentos anexados
  - Visualizar documentos (botão olho)
  - Carregamento dinâmico de documentos disponíveis

#### 2. **Página de Tarefas** (`frontend/app/tasks/page.tsx`)
- Importa novo componente `TaskDialog` de `components/TaskDialog.tsx`
- Remove duplicação da função TaskDialog

#### 3. **Página de Visualização de Documento** (`frontend/app/documents/[id]/page.tsx`)
- Já existente, mantém funcionalidade de visualização
- Possibilita navegação via breadcrumb
- Somente leitura (sem edição visual na página view)

#### 4. **Página de Novo Documento** (`frontend/app/documents/new/page.tsx`)
- Corrigido: envolvido em Suspense boundary para `useSearchParams()`
- Permite criar documento vinculado a tarefa via query param

## Database (Prisma Schema)

A relação `documents → Task` já estava configurada:
```prisma
model Document {
  // ...
  taskId    String?
  task      Task? @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Task {
  // ...
  documents Document[]
}
```

## Fluxo de Dados

```
1. Usuário cria documento (opcional: vincula a tarefa aqui)
   └─> POST /documents

2. Usuário vai editar tarefa
   └─> Modal TaskDialog abre
   └─> Carrega documentos disponíveis: GET /documents

3. Usuário seleciona documento para anexar
   └─> PATCH /documents/:id { taskId: taskId }

4. Usuário clica para visualizar documento
   └─> Navega para /documents/:id (somente leitura)
   └─> GET /documents/:id (já existente)

5. Usuário remove documento da tarefa
   └─> PATCH /documents/:id { taskId: null }
```

## Validações de Segurança

### Backend
- `TasksService.findOne()` valida se o usuário é proprietário ou assignado na tarefa
- `DocumentsService` já valida acesso antes de vincular a tarefa

### Frontend
- Só exibe seção de documentos em modo edição (quando task.id existe)
- Valida se usuário tem permissão antes de exibir botões de edição/exclusão

## Arquivos Modificados

1. `src/tasks/tasks.controller.ts` - ✅ Adicionado GET /:id
2. `src/tasks/tasks.service.ts` - ✅ Adicionado findOne()
3. `frontend/components/TaskDialog.tsx` - ✅ Criado novo componente
4. `frontend/app/tasks/page.tsx` - ✅ Importa TaskDialog, remove duplicação
5. `frontend/app/documents/new/page.tsx` - ✅ Corrigido Suspense boundary

## Próximos Passos (Opcional)

- [ ] Adicionar filtro de documentos por tipo (ex: somente PDFs, Markdown, etc)
- [ ] Implementar pré-visualização de documento no modal de tarefa
- [ ] Adicionar versioning de documentos
- [ ] Implementar compartilhamento de documentos entre usuários
- [ ] Adicionar anexos/uploads diretos de arquivos
