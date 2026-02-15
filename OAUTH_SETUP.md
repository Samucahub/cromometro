# Configuração de OAuth e Autenticação por Email

Este guia mostra como configurar Google OAuth, GitHub OAuth e autenticação de 2 passos por email no SEMSTRESS.

## 1. Google OAuth Configuration

### Passo 1: Criar um projeto no Google Cloud Console

1. Acede a [Google Cloud Console](https://console.cloud.google.com/)
2. Cria um novo projeto
3. Vai para "APIs & Services" > "Credentials"
4. Clica em "Create Credentials" > "OAuth Client ID"
5. Selecciona "Web application"
6. Adiciona as seguintes URIs:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback`

### Passo 2: Configurar variáveis de ambiente

No teu ficheiro `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

## 2. GitHub OAuth Configuration

### Passo 1: Registar a aplicação no GitHub

1. Vai para [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Clica em "New OAuth App"
3. Preenche os seguintes campos:
   - **Application name**: SEMSTRESS
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`

### Passo 2: Configurar variáveis de ambiente

No teu ficheiro `.env`:

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

## 3. Email Verification (2FA)

O sistema de autenticação agora inclui verificação de email obrigatória.

### Configurar Nodemailer

Para desenvolvimento, recomenda-se usar MailHog (já pré-configurado no docker-compose):

```env
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@semstress.com
```

#### Para ambiente de produção com um serviço real:

Exemplo com Gmail:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-specific-password
MAIL_FROM=your-email@gmail.com
```

## 4. Fluxo de Autenticação

### Registro (Register)

1. Utilizador preenche nome, email e password
2. Sistema envia código de verificação para o email
3. Utilizador insere o código (6 dígitos)
4. Email é verificado e conta ativada

### Login (Login)

1. **Com email/password**:
   - Se email não foi verificado: envia novo código
   - Utilizador insere código de verificação
   - Login completo

2. **Com Google/GitHub**:
   - Redirecionado para o provider
   - Após autenticação, é criada conta automaticamente se não existir
   - Email é marcado como verificado

## 5. Testar OAuth Localmente

### Usando localhost

Para testar OAuth com localhost, precisas de:

1. **Google OAuth**:
   - Adicionar `http://localhost:3001` (frontend) às originsJavaScript
   - Adicionar `http://localhost:3000/api/auth/google/callback` aos redirect URIs

2. **GitHub OAuth**:
   - Homepage URL: `http://localhost:3001`
   - Authorization callback: `http://localhost:3000/api/auth/github/callback`

### Using ngrok para testes com domínios reais

Se precisas de testar com domínios reais (ex: para verificação de certificados SSL):

```bash
ngrok http 3000  # Backend
ngrok http 3001  # Frontend
```

Depois atualiza as variáveis de ambiente com os URLs do ngrok.

## 6. Endpoints Disponíveis

### Autenticação Simples

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-code
```

### OAuth

```
GET /api/auth/google
GET /api/auth/google/callback

GET /api/auth/github
GET /api/auth/github/callback
```

## 7. Estrutura da Base de Dados

Novos campos adicionados à tabela `User`:

```prisma
emailVerified Boolean              @default(false)
verificationCode String?
verificationCodeExpiresAt DateTime?
googleId String?                   @unique
githubId String?                   @unique
password String?                   // Optional for OAuth users
```

## Troubleshooting

### Erro: "MAIL_HOST not found"

Certifica-te de que a variável `MAIL_HOST` está definida no `.env`. Para desenvolvimento, use `localhost` ou `mailhog`.

### Erro: "Invalid client_id"

Verifica que:
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão correctos
- Os URLs de callback estão registados no Google Cloud Console

### Email não chega

Para desenvolvimento com MailHog:
1. Acede a `http://localhost:8025`
2. Verifica a aba "Messages"
3. Podes ver todos os emails enviados

## Próximas Melhorias

- [ ] Autenticação de 2 passos com TOTP (Google Authenticator)
- [ ] Recuperação de conta por email
- [ ] Ligar múltiplos métodos de autenticação à mesma conta
- [ ] Histórico de login
- [ ] Notificações de login suspeito
