# SemStress

Uma aplicação para gerir tarefas de estágios. Porque toda a gente precisa de mais stress, mas de forma organizada.

---

## 🎉 NOVIDADE! Autenticação Avançada (08/02/2026)

Acabámos de implementar uma **reforma completa do sistema de autenticação**:

### ✨ Novos Métodos de Autenticação
- **Email + Password com 2FA** - Código de verificação de 6 dígitos
- **Login com Google** - Um clique e está dentro
- **Login com GitHub** - Um clique e está dentro

### 📚 Como Começar

1. **Leia primeiro**: [AUTH_READY.md](AUTH_READY.md) (2 minutos)
2. **Configure**: [OAUTH_SETUP.md](OAUTH_SETUP.md) (se quer Google/GitHub)
3. **Teste**: [QUICK_TEST_GUIDE.md](QUICK_TEST_GUIDE.md) (5 minutos)
4. **Detalhes técnicos**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## PT - Português de Portugal

### O que é isto?

SemStress é um sistema de gestão de tarefas e registos de tempo para programas de estágio. Foi criado com a firme convicção de que os estagiários trabalham melhor quando sabem exatamente quantas horas já desperdiçaram naquele dia.

### Funcionalidades

- **Autenticação Avançada**: Login com email (2FA), Google e GitHub
- **Dashboard**: Aquele sítio onde vê tudo de uma vez e sente-se produtivo por alguns segundos.
- **Tarefas**: Cria, edita e marca como concluídas. A parte de "marca como concluída" é a favorita de toda a gente.
- **Registos de Tempo**: Porque se não contar, não aconteceu.
- **Relatórios**: Transformar números em mais números, mas com mais cores.
- **Papéis de Utilizador**: Admin para quem gosta de ter control issues, e user para o resto.

### Stack Técnico

**Backend**: NestJS com TypeScript. Porque Node.js puro seria demasiado fácil.

**Frontend**: Next.js com React. É o que toda a gente usa, portanto há de funcionar.

**Base de Dados**: PostgreSQL via Prisma. Gostamos de SQL, mas com menos digitação.

**Autenticação**: JWT + OAuth 2.0 + 2FA por Email. Tokens mágicos, segurança extra, emails chatos.

### Como Executar

1. Clone o repositório (aquele comando `git clone` que nunca se lembra de cor)
2. `npm install` na raiz e em `frontend/`
3. Configure o ficheiro `.env` com a base de dados (copie o `.env.example`, naturalmente)
4. `npx prisma migrate dev` para aplicar migrações
5. Execute `npm run start:dev` na raiz para o backend
6. Execute `npm run dev` em `frontend/` para o frontend
7. Abra `http://localhost:3001` e procure alguma coisa que se pareça com uma interface

### Estrutura do Projeto

```
semstress/
├── src/              # Backend (NestJS)
│   └── auth/         # ← Autenticação avançada (NOVO!)
├── frontend/         # Frontend (Next.js)
├── prisma/           # Schemas da base de dados
├── test/             # E2E tests (teoricamente)
├── 📄 AUTH_READY.md                 ← COMECE AQUI!
├── 📄 OAUTH_SETUP.md
├── 📄 QUICK_TEST_GUIDE.md
├── 📄 IMPLEMENTATION_SUMMARY.md
└── 📄 EXECUTIVE_SUMMARY_PT.md
```

### Documentação Rápida

| Documento | Para | Tempo |
|-----------|------|-------|
| [AUTH_READY.md](AUTH_READY.md) | Entender o que foi feito | 2 min |
| [QUICK_TEST_GUIDE.md](QUICK_TEST_GUIDE.md) | Testar tudo | 5 min |
| [OAUTH_SETUP.md](OAUTH_SETUP.md) | Configurar Google/GitHub | 15 min |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Detalhes técnicos | 10 min |
| [EXECUTIVE_SUMMARY_PT.md](EXECUTIVE_SUMMARY_PT.md) | Resumo completo em português | 10 min |
| [ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md) | Mapa de mudanças | 5 min |

### Variáveis de Ambiente Necessárias

Copia `.env.example` para `.env` e configura:

```env
# Base de Dados
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Email (para 2FA)
MAIL_HOST=localhost
MAIL_PORT=1025

# OAuth (opcional)
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
```

Para desenvolvimento, o MailHog (localhost:8025) já está configurado no docker-compose.

---

## EN - English

### What is this?

SemStress is a task management and time tracking system for internship programs. Built with the firm belief that interns work better when they know exactly how many hours they've wasted today.

### Features

- **Advanced Authentication**: Email login with 2FA, Google OAuth, GitHub OAuth
- **Dashboard**: That place where you see everything at once and feel productive for a few seconds.
- **Tasks**: Create, edit and mark as complete. The "mark as complete" part is everyone's favorite.
- **Time Tracking**: Because if you don't count it, it didn't happen.
- **Reports**: Turning numbers into more numbers, but with more colors.
- **User Roles**: Admin for people with control issues, and user for everyone else.

### Tech Stack

**Backend**: NestJS with TypeScript. Because pure Node.js would be too easy.

**Frontend**: Next.js with React. It's what everyone uses, so it has to work.

**Database**: PostgreSQL via Prisma. We like SQL, but with less typing.

**Authentication**: JWT + OAuth 2.0 + Email 2FA. Magic tokens, extra security, annoying emails.

### Quick Start

1. Clone the repository
2. `npm install` in root and `frontend/`
3. Copy `.env.example` to `.env` and configure
4. `npx prisma migrate dev` to apply migrations
5. `npm run start:dev` for backend
6. `npm run dev` in `frontend/` for frontend
7. Open `http://localhost:3001`

### Documentation

| Document | Purpose | Time |
|----------|---------|------|
| [AUTH_READY.md](AUTH_READY.md) | Understand what's new | 2 min |
| [QUICK_TEST_GUIDE.md](QUICK_TEST_GUIDE.md) | Test everything | 5 min |
| [OAUTH_SETUP.md](OAUTH_SETUP.md) | Setup Google/GitHub OAuth | 15 min |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Technical details | 10 min |


### Notas

- O servidor backend executa na porta 3001
- O servidor frontend na 3000
- Se alguma coisa não funcionar, tente apagar `node_modules` e `npm install` de novo
- Se isso não funcionar também, feche o computador e vá fazer uma caminhada

---

## EN - English

### What is This?

SemStress is a task and time tracking management system for internship programs. Built on the principle that interns work better when they know exactly how many hours they've already wasted today.

### Features

- **Authentication**: You know the drill. Login and registration. If you can remember your password.
- **Dashboard**: That place where you see everything at once and feel productive for a few seconds.
- **Tasks**: Create, edit, and mark as done. The "mark as done" part is everyone's favorite.
- **Time Entries**: Because if you don't track it, it didn't happen.
- **Reports**: Turning numbers into more numbers, but with better colors.
- **User Roles**: Admin for control enthusiasts, and user for the rest of us.

### Tech Stack

**Backend**: NestJS with TypeScript. Because vanilla Node.js would be too easy.

**Frontend**: Next.js with React. It's what everyone uses, so it's probably fine.

**Database**: PostgreSQL via Prisma. We like SQL, but with less typing.

**Authentication**: JWT. Magic tokens that expire and make you angry.

### How to Run

1. Clone the repository (that `git clone` command you never remember)
2. `npm install` in the root and in `frontend/`
3. Set up your `.env` file with the database (copy `.env.example`, obviously)
4. Run `npm run start:dev` in the root for the backend
5. Run `npm run dev` in `frontend/` for the frontend
6. Open `http://localhost:3000` and look for something that resembles an interface

### Project Structure

```
semstress/
├── src/              # Backend (NestJS)
├── frontend/         # Frontend (Next.js)
├── prisma/           # Database schemas
└── test/             # E2E tests (theoretically)
```

### Notes

- Backend server runs on port 3001
- Frontend server on 3000
- If something doesn't work, try deleting `node_modules` and running `npm install` again
- If that doesn't work either, close the laptop and go for a walk