# GUIA DE TESTE RÁPIDO - Autenticação Avançada

## 🚀 Setup Inicial (5 minutos)

### 1. Verificar Dependências
```bash
cd /home/samu/semstress
npm list passport-google-oauth20 passport-github2 nodemailer
```

### 2. Build Backend
```bash
npm run build
```

Deve compilar sem erros.

### 3. Iniciar Serviços Docker
```bash
docker-compose up -d
```

Verifica que:
- PostgreSQL: `localhost:5432`
- MailHog: `http://localhost:8025`

### 4. Atualizar .env (se necessário)
```bash
cp .env.example .env
# Edita para adicionar Google/GitHub credentials (opcional para teste básico)
```

## ✅ Testes de Funcionalidade

### Teste 1: Registro com Email Verification

**URL**: `http://localhost:3001/register`

1. Clica "Criar conta"
2. Preenche:
   - Nome: `João Silva`
   - Email: `joao@test.com`
   - Password: `Password123`
3. Clica "Criar conta"
4. Deve aparecer: "Enviámos um código de verificação"
5. Abre `http://localhost:8025` (MailHog)
6. Procura o email com assunto "Código de Verificação - SEMSTRESS"
7. Copia o código (6 dígitos)
8. Cola o código no campo
9. Clica "Verificar Email"
10. ✅ Deve ser redirecionado para login

### Teste 2: Login com Email Verification

**URL**: `http://localhost:3001/login`

1. Preenche email da conta criada
2. Preenche password correcta
3. Clica "Entrar"
4. Se email foi verificado em Teste 1, deve fazer login direto
5. Se não: vai para tela de verificação
6. ✅ Deve chegar ao dashboard

### Teste 3: Login com Password Incorreta

**URL**: `http://localhost:3001/login`

1. Preenche email correto
2. Preenche password errada
3. Clica "Entrar"
4. ✅ Deve mostrar erro "Credenciais inválidas"

### Teste 4: Resend Code

**URL**: `http://localhost:3001/register` (se ainda na tela de verificação)

1. Clica "Não recebeste o código? Reenviar"
2. ✅ Deve mostrar "Novo código enviado para o teu email"
3. Verifica MailHog novamente
4. Deve ter novo email

### Teste 5: Voltar no Register

**URL**: `http://localhost:3001/register`

1. Preenche dados
2. Clica "Criar conta"
3. Na tela de verificação, clica "Voltar"
4. ✅ Deve voltar para form de registro

### Teste 6: Email Já Registado

**URL**: `http://localhost:3001/register`

1. Usa email já registado de Teste 1
2. Preenche outros campos
3. Clica "Criar conta"
4. ✅ Deve mostrar erro "Email já registado"

## 🔵 Testes OAuth (Opcional)

### Teste 7: Login com Google

**Pré-requisito**: Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` em `.env`

**URL**: `http://localhost:3001/login`

1. Clica no botão Google
2. Faz login com conta Google
3. ✅ Deve chegar ao dashboard

### Teste 8: Login com GitHub

**Pré-requisito**: Configurar `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` em `.env`

**URL**: `http://localhost:3001/login`

1. Clica no botão GitHub
2. Faz login com conta GitHub
3. ✅ Deve chegar ao dashboard

## 🐛 Troubleshooting

### Erro: "Cannot POST /auth/register"
- Verifica que backend está rodando: `curl http://localhost:3000/`
- Verifica que CORS está permitido

### Erro: "MAIL_HOST not found"
```bash
# Verifica .env
cat .env | grep MAIL_HOST

# Se não existe, configura:
echo "MAIL_HOST=localhost" >> .env
echo "MAIL_PORT=1025" >> .env
```

### Erro: "Invalid redirect_uri" (Google/GitHub)
- Verifica URLs no `.env`
- Verifica que URLs estão registadas no provider console
- Para Google: https://console.cloud.google.com/apis/credentials
- Para GitHub: https://github.com/settings/developers

### Email não aparece em MailHog
1. Abre http://localhost:8025/
2. Verifica se há emails lá
3. Se não, verifica logs: `docker logs -f semstress_app`
4. Se houver erro de conexão, verifica `MAIL_HOST` em `.env`

### Código expirou
- Código expira em 15 minutos
- Clica "Reenviar" para obter novo código

## 📊 Checklist de Testes

```
[ ] Teste 1: Registro com Email Verification
[ ] Teste 2: Login com Email Verification
[ ] Teste 3: Login com Password Incorreta
[ ] Teste 4: Resend Code
[ ] Teste 5: Voltar no Register
[ ] Teste 6: Email Já Registado
[ ] Teste 7: Login com Google (opcional)
[ ] Teste 8: Login com GitHub (opcional)
```

## 🔍 Verificar Dados na Base de Dados

```bash
# Acede à base de dados
docker-compose exec postgres psql -U semstress -d semstress

# Verifica utilizadores criados
SELECT id, name, email, "emailVerified", "googleId", "githubId" FROM "User";

# Verifica um utilizador específico
SELECT * FROM "User" WHERE email = 'joao@test.com';

# Sai
\q
```

## 🎯 Resultado Esperado

Após todos os testes:

1. ✅ Podes registar com email/password
2. ✅ Recebes código de verificação por email
3. ✅ Podes fazer login após verificar email
4. ✅ Podes fazer login com Google (se configurado)
5. ✅ Podes fazer login com GitHub (se configurado)
6. ✅ Estás no dashboard

## 📝 Notas

- Passwords precisam de 6+ caracteres
- Código de verificação é 6 dígitos
- Código expira em 15 minutos
- Email é único
- Para OAuth, email é auto-verificado
- Cada método de OAuth cria conta separada se email não existe
