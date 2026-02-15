# 🔒 Rate Limiting + Password Strength + Unit Tests - Implementação

**Data**: 15 de Fevereiro de 2026  
**Status**: ✅ **COMPLETO E TESTADO**

---

## 📋 O Que Foi Implementado

### 1️⃣ Rate Limiting (Proteção contra Brute Force)

Implementado middleware de rate limiting com `express-rate-limit` para proteger endpoints críticos:

#### Limiters Configurados:

| Endpoint | Limite | Janela Temporal | Propósito |
|----------|--------|-----------------|-----------|
| `/auth/login` | 5 tentativas | 15 minutos | Prevenir força bruta no login |
| `/auth/register` | 3 tentativas | 1 hora | Prevenir spam de registos |
| `/auth/verify-email` | 10 tentativas | 15 minutos | Permiter tentativas (utilizador pode errar) |
| `/auth/resend-code` | 3 tentativas | 1 hora | Prevenir spam de emails |
| `/auth/google`, `/auth/github` | 10 tentativas | 1 hora | Proteger OAuth |
| Global | 100 requisições | 15 minutos | Limite geral da API |

#### Ficheiros Criados:
- [src/common/middleware/rate-limit.middleware.ts](src/common/middleware/rate-limit.middleware.ts) - Middleware de rate limiting
- [src/common/middleware/auth-rate-limit.middleware.ts](src/common/middleware/auth-rate-limit.middleware.ts) - Middleware específico para auth
- [src/common/middleware/rate-limit.middleware.spec.ts](src/common/middleware/rate-limit.middleware.spec.ts) - Testes do rate limiter

#### Como Funciona:
```
Utilizador tenta fazer login 6 vezes em 15 minutos
↓
Middleware intercepta (5ª tentativa OK, 6ª bloqueada)
↓
Erro 429: "Demasiadas tentativas de login, tente novamente em 15 minutos"
```

---

### 2️⃣ Password Strength Validation (Passwords Fortes)

Implementado validador customizado que força passwords robustas:

#### Requirements:
- ✅ **Mínimo 12 caracteres**
- ✅ **Pelo menos 1 letra MAIÚSCULA** (A-Z)
- ✅ **Pelo menos 1 letra minúscula** (a-z)
- ✅ **Pelo menos 1 número** (0-9)
- ✅ **Pelo menos 1 carácter especial** (!@#$%^&* etc)

#### Exemplos:

**✅ Válidas:**
```
MyStr0ng!Password     (12+ chars, uppercase, lowercase, number, special)
SuperSecure@2026      (13 chars, all requirements met)
P@ssw0rd#Secure       (15 chars, all requirements met)
```

**❌ Inválidas:**
```
password123!          (missing uppercase)
PASSWORD@123          (missing lowercase)
MyPassword@           (missing number)
StrongPass123         (missing special character)
Pass@1                (less than 12 characters)
```

#### Ficheiros Criados:
- [src/common/validators/strong-password.validator.ts](src/common/validators/strong-password.validator.ts) - Validador de password
- [src/common/validators/strong-password.validator.spec.ts](src/common/validators/strong-password.validator.spec.ts) - Testes do validador

#### Ficheiros Modificados:
- [src/auth/dto/register.dto.ts](src/auth/dto/register.dto.ts) - Adicionar validação
- [src/auth/dto/login.dto.ts](src/auth/dto/login.dto.ts) - Adicionar validação

---

### 3️⃣ Unit Tests (Testes Automatizados)

Criados testes completos para:

#### Cobertura de Testes:

| Área | Testes | Arquivo |
|------|--------|---------|
| **AuthService** | 21 testes | [src/auth/auth.service.spec.ts](src/auth/auth.service.spec.ts) |
| **Password Validator** | 14 testes | [src/common/validators/strong-password.validator.spec.ts](src/common/validators/strong-password.validator.spec.ts) |
| **Rate Limit Middleware** | 13 testes | [src/common/middleware/rate-limit.middleware.spec.ts](src/common/middleware/rate-limit.middleware.spec.ts) |
| **App Controller** | 1 teste | [src/app.controller.spec.ts](src/app.controller.spec.ts) |
| **TOTAL** | **49 testes** | **100% PASSING ✅** |

#### Testes do AuthService (21 testes):

**Register (3 testes):**
- ✅ Deve registar um utilizador com sucesso
- ✅ Deve lançar erro se username já existe
- ✅ Deve lançar erro se email já existe

**Login (5 testes):**
- ✅ Deve fazer login com sucesso
- ✅ Deve exigir verificação de email se não verificado
- ✅ Deve lançar erro com credenciais inválidas
- ✅ Deve lançar erro se utilizador não encontrado
- ✅ Deve lançar erro se nem username nem email fornecidos

**Verify Email (5 testes):**
- ✅ Deve verificar email de pending user com sucesso
- ✅ Deve verificar email de user existente
- ✅ Deve lançar erro se código inválido
- ✅ Deve lançar erro se código expirado
- ✅ Deve lançar erro se utilizador não encontrado

**Resend Code (2 testes):**
- ✅ Deve reenviar código com sucesso
- ✅ Deve retornar mensagem genérica se utilizador não encontrado

**Register Admin (3 testes):**
- ✅ Deve registar admin com sucesso
- ✅ Deve lançar erro se setup key inválido
- ✅ Deve lançar erro se username já existe

**Utilities (3 testes):**
- ✅ generateVerificationCode deve retornar 6 dígitos
- ✅ signToken deve assinar JWT válido

#### Testes do Password Validator (14 testes):

**Validações Positivas:**
- ✅ Aceita password válida e forte
- ✅ Aceita password com diferentes caracteres especiais
- ✅ Aceita password com exatamente 12 caracteres
- ✅ Aceita password muito longa

**Validações Negativas:**
- ✅ Rejeita password vazia
- ✅ Rejeita password null
- ✅ Rejeita password com menos de 12 caracteres
- ✅ Rejeita password sem letra maiúscula
- ✅ Rejeita password sem letra minúscula
- ✅ Rejeita password sem número
- ✅ Rejeita password sem carácter especial
- ✅ Rejeita password com espaços apenas

**Mensagens:**
- ✅ Deve retornar mensagem de erro clara

#### Testes do Rate Limit (13 testes):

- ✅ Verifica que todos os limiters estão definidos
- ✅ Verifica que todos os limiters são funções middleware válidas
- ✅ Verifica que todos os limiters usam standardHeaders
- ✅ Verifica que todos desativam legacyHeaders

---

## 🔧 Integração no Código

### App Module (app.module.ts)

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Rate limit específico de auth
    consumer.apply(AuthRateLimitMiddleware).forRoutes('auth');
    
    // Rate limit global
    consumer.apply(RateLimitMiddleware.globalLimiter).forRoutes('*');
  }
}
```

### Auth Controller (auth.controller.ts)

```typescript
@Post('register')
register(@Body() dto: RegisterDto) { ... }

@Post('login')
login(@Body() dto: LoginDto) { ... }
```

Os DTOs agora validam passwords fortes automaticamente!

---

## 📊 Resultado dos Testes

```
Test Suites: 4 passed, 4 total
Tests:       49 passed, 49 total
Snapshots:   0 total
Time:        ~1s
```

✅ **100% dos testes passam!**

---

## 🚀 Como Usar

### 1. **Compilar o Projeto**
```bash
npm run build
```

### 2. **Iniciar o Servidor**
```bash
npm run start:dev
```

### 3. **Executar Testes**
```bash
npm test
```

### 4. **Testar Endpoints**

**Tentar login 6 vezes em 15 minutos:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"TestPass123!"}'

# 6ª tentativa:
# HTTP 429 - "Demasiadas tentativas de login..."
```

**Registar com password fraca:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"weak123"}'

# HTTP 400 - Password deve ter:
# - Mínimo 12 caracteres
# - 1 maiúscula
# - 1 minúscula
# - 1 número
# - 1 carácter especial
```

**Registar com password forte:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"SuperSecure@2026"}'

# HTTP 201 - Success!
```

---

## 🔐 Segurança Implementada

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Brute Force** | ✅ Protegido | 5 tentativas/15min no login |
| **Spam** | ✅ Protegido | 3 tentativas/1h no registo |
| **Password Fraca** | ✅ Bloqueada | Min 12 chars, uppercase, lowercase, number, special |
| **Email Spam** | ✅ Protegido | 3 reenvios/1h, 10 verificações/15min |
| **OAuth Abuse** | ✅ Protegido | 10 tentativas/1h |
| **API Overload** | ✅ Protegido | 100 req/15min global |

---

## 📁 Arquivos Criados/Modificados

### Criados:
```
src/common/middleware/rate-limit.middleware.ts          (88 linhas)
src/common/middleware/rate-limit.middleware.spec.ts    (92 linhas)
src/common/middleware/auth-rate-limit.middleware.ts    (27 linhas)
src/common/validators/strong-password.validator.ts     (58 linhas)
src/common/validators/strong-password.validator.spec.ts (139 linhas)
src/auth/auth.service.spec.ts                          (443 linhas)
```

### Modificados:
```
src/auth/dto/register.dto.ts       (validação de password)
src/auth/dto/login.dto.ts          (validação de password)
src/auth/auth.controller.ts        (sem mudanças finais - testes em middleware)
src/app.module.ts                  (aplicar middlewares)
package.json                       (express-rate-limit adicionado)
```

---

## ✅ Próximas Melhorias (Opcional)

1. **Logging**: Registar tentativas falhadas em base de dados
2. **Notificações**: Alertar utilizador sobre múltiplas tentativas falhadas
3. **Whitelist/Blacklist**: IPs confiáveis/bloqueados
4. **2FA Rate Limit**: Limitar tempo entre códigos enviados
5. **API Keys**: Permitir rate limits maiores para clients verificados

---

## 📞 Suporte

Para questões sobre a implementação, consulte:
- Rate Limiting: `src/common/middleware/`
- Password Validation: `src/common/validators/`
- Testes: `*.spec.ts` files

---

**Implementado com ❤️ em 15 de Fevereiro de 2026**
