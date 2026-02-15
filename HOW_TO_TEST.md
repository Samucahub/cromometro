# 🧪 How to Test the Implementation

This guide shows you how to verify that all the new features (Refresh Tokens + Security Headers) are working correctly.

---

## ✅ Prerequisites

- Backend running: `npm run start:dev`
- Port 3001 available
- curl or Postman installed

---

## Test 1: Verify Security Headers

### Command
```bash
curl -I http://localhost:3001/auth/login
```

### Expected Output (Contains these headers)
```
Content-Security-Policy: default-src 'self'...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### ✅ Success Criteria
- At least 7+ security headers present
- No X-Powered-By header (server fingerprinting prevented)
- HSTS header present with 1-year max-age

---

## Test 2: Password Validation

### Test with Weak Password
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser1",
    "email":"test1@example.com",
    "password":"weak",
    "name":"Test User"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "message": ["A password deve ter: mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial (!@#$%^&*)"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Test with Strong Password
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser2",
    "email":"test2@example.com",
    "password":"StrongPass123!",
    "name":"Test User"
  }'
```

### Expected Response (201 Created)
```json
{
  "message": "Conta criada com sucesso. Verifica o teu email para completar o registo.",
  "requiresVerification": true,
  "email": "test2@example.com",
  "username": "testuser2"
}
```

### ✅ Success Criteria
- Weak password rejected with 400 status
- Strong password accepted with 201 status
- Clear error messages about password requirements

---

## Test 3: Rate Limiting

### Test Login Rate Limit (5 attempts per 15 minutes)
```bash
# Attempt 1-5 should succeed
for i in {1..5}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"InvalidPass123!"}' \
    -w "\nStatus: %{http_code}\n"
done

# Attempt 6 should be rate limited
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"InvalidPass123!"}'
```

### Expected Response (429 Too Many Requests)
```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 900
```

### ✅ Success Criteria
- First 5 requests return 401 or 200 (auth response)
- 6th request returns 429 (rate limited)
- RateLimit-* headers present

---

## Test 4: Refresh Token Endpoints

### Step 1: Create a user (if not exists)
```bash
# Register with strong password
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"refreshtest",
    "email":"refresh@test.com",
    "password":"RefreshTest123!",
    "name":"Refresh Test"
  }')

echo $REGISTER_RESPONSE
```

### Step 2: Test Refresh Token Endpoint
```bash
# Try to refresh with invalid token
curl -X POST http://localhost:3001/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"invalid-token"}'
```

### Expected Response (401 Unauthorized)
```json
{
  "message": "Refresh token inválido ou expirado",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### ✅ Success Criteria
- Endpoint exists (not 404)
- Invalid token rejected (401)
- Error message clear

---

## Test 5: Logout Endpoint

### Test Logout
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"invalid-token"}'
```

### Expected Response (200 or 201 OK)
```json
{
  "message": "Logout realizado com sucesso"
}
```

### ✅ Success Criteria
- Endpoint exists (not 404)
- Returns success message
- HTTP 200 or 201 status

---

## Test 6: Unit Tests

### Run All Tests
```bash
npm test
```

### Expected Output
```
Test Suites: 5 passed, 5 total
Tests:       59 passed, 59 total
Snapshots:   0 total
Time:        ~2-3 seconds
```

### Run Specific Test Suite
```bash
# Refresh Token Service tests
npm test -- refresh-token.service.spec

# Auth Service tests
npm test -- auth.service.spec

# Password Validator tests
npm test -- strong-password.validator.spec

# Rate Limit tests
npm test -- rate-limit.middleware.spec
```

### ✅ Success Criteria
- All 59 tests passing
- 0 test failures
- Execution time < 10 seconds

---

## Test 7: Build Verification

### Compile Code
```bash
npm run build
```

### Expected Output
```
> semstress@0.0.1 build
> nest build

[No errors]
```

### Check Compiled Output
```bash
ls -la dist/
```

### ✅ Success Criteria
- Build completes without errors
- dist/ folder created
- No TypeScript errors

---

## Test 8: Database Migration

### Verify Migration Applied
```bash
# Check Prisma migrations
ls -la prisma/migrations/ | grep add_refresh_tokens
```

### Expected Output
```
20260215203713_add_refresh_tokens
```

### ✅ Success Criteria
- Migration folder exists
- RefreshToken table created in database
- Indexes created on userId and expiresAt

---

## Test 9: Integration Test Script

### Run Full Integration Test
```bash
./test-refresh-tokens.sh
```

### Expected Output
```
✓ CSP Header Present
✓ HSTS Header Present
✓ X-Frame-Options Header Present
✓ X-Content-Type-Options Header Present
✓ Referrer-Policy Header Present
✓ Password Strength Validation Working
✓ Rate-Limit Headers Present
✓ POST /auth/refresh-token Endpoint Exists
✓ POST /auth/logout Endpoint Exists
✓ RefreshToken Model Defined in Schema
✓ All systems operational! 🚀
```

### ✅ Success Criteria
- All checks passing
- All endpoints verified
- All security features active

---

## Manual Testing with Postman

### Collection URL
You can import these requests into Postman:

#### 1. Register User
```
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!",
  "name": "Test User"
}
```

#### 2. Verify Email (requires code from DB)
```
POST http://localhost:3001/auth/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "verificationCode": "123456"
}
```

#### 3. Login
```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

Response will include:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "role": "USER"
}
```

#### 4. Refresh Token
```
POST http://localhost:3001/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 5. Logout
```
POST http://localhost:3001/auth/logout
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 6. Logout All Devices
```
POST http://localhost:3001/auth/logout-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

---

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `npm install`

### Issue: Database errors
**Solution**: 
```bash
npm run build
npx prisma migrate deploy
```

### Issue: Port 3001 already in use
**Solution**: 
```bash
# Find process using port
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Issue: Tests failing
**Solution**: 
```bash
# Clear jest cache
npm test -- --clearCache
# Run specific test
npm test -- <test-name>.spec
```

---

## Security Verification Checklist

- [ ] Security headers present (run Test 1)
- [ ] Password validation working (run Test 2)
- [ ] Rate limiting active (run Test 3)
- [ ] Refresh token endpoint exists (run Test 4)
- [ ] Logout endpoint exists (run Test 5)
- [ ] All tests passing (run Test 6)
- [ ] Build successful (run Test 7)
- [ ] Database migrated (run Test 8)
- [ ] Integration tests passing (run Test 9)

---

## Performance Verification

### Measure Login Response Time
```bash
time curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

**Expected**: 100-150ms total

### Measure Refresh Token Time
```bash
time curl -X POST http://localhost:3001/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"..."}'
```

**Expected**: 50-100ms total

---

## Success Criteria Summary

✅ **All Tests**: 59/59 passing
✅ **Compilation**: 0 errors
✅ **Security Headers**: 10+ active
✅ **Rate Limiting**: Working
✅ **Refresh Tokens**: Implemented
✅ **Password Validation**: Active
✅ **Database**: Migrated
✅ **API**: Responding

---

**Status**: 🟢 ALL SYSTEMS OPERATIONAL

If all tests pass, the implementation is ready for production! 🚀
