# Plano de Implementação - Projetos Colaborativos

## Progresso

### ✅ Fase 1 - Banco de Dados (COMPLETO)
- [x] Atualizar schema Prisma com novos modelos:
  - ProjectMember
  - ProjectInvitation
  - Enums: ProjectRole, InvitationStatus
  - Relações e campos adicionais em Task, Project, User
- [x] Executar migração do Prisma

### ✅ Fase 2 - Páginas Frontend (COMPLETO)
- [x] Criar `/app/simple-tasks/page.tsx` - Tarefas simples sem prioridades
- [x] Criar `/app/projects/page.tsx` - Lista de projetos com create dialog
- [x] Criar `/app/projects/[id]/page.tsx` - Detalhes do projeto com kanban
- [x] Atualizar Sidebar com novos links

### 🔄 Fase 3 - Backend (EM PROGRESSO)
- [ ] Atualizar ProjectsService para suportar:
  - Criação de projetos colaborativos
  - Gerenciamento de membros
  - Convites
- [ ] Atualizar ProjectsController com novos endpoints:
  - POST /projects (criar)
  - GET /projects (listar)
  - GET /projects/:id (detalhes)
  - GET /projects/:id/members (membros)
  - GET /projects/:id/statuses (status do projeto)
  - GET /projects/:id/tasks (tarefas do projeto)
  - POST /projects/:id/statuses (criar status)
  - POST /projects/:id/tasks (criar tarefa)
  - PATCH /projects/:id (atualizar)
  - DELETE /projects/:id (deletar)
- [ ] TasksService - adicionar suporte para prioridades opcionais
- [ ] Criar MembersService para gerenciar membros/convites

### 🔄 Fase 4 - DTOs
- [ ] Atualizar/criar CreateProjectDto
- [ ] Criar CreateProjectMemberDto
- [ ] Criar AcceptInvitationDto

### 🔄 Fase 5 - Testes e Refinamentos
- [ ] Testar fluxo completo de criação de projeto
- [ ] Testar convites
- [ ] Testar permissões
- [ ] Adicionar validações

## Status Atual
Estrutura frontend completa, migrations feitas. Próximo passo: implementar endpoints backend.
