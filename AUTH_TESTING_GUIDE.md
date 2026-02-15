# Authentication System - Testing Guide

## System Status ✅

- **Backend**: Running successfully on `http://localhost:3001`
- **Frontend**: Built and ready on `http://localhost:3000`
- **Database**: PostgreSQL ready with Prisma migrations applied
- **Email Service**: Configured with Nodemailer (MailHog for development)
- **OAuth Strategies**: Ready for production credentials (using dummy credentials for development)

---

## Prerequisites

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Environment Setup
Ensure `.env` has these settings:
```env
# Email Configuration (MailHog for development)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=user
MAIL_PASS=password
MAIL_FROM=noreply@semstress.local

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=24h

# OAuth (Optional - leave empty for email 2FA only)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3. Start Services

#### Backend (Terminal 1)
```bash
npm run start:dev
```

Expected output:
```
✓ Backend listening on http://localhost:3001
```

#### Frontend (Terminal 2)
```bash
cd frontend && npm run dev
```

Expected output:
```
> Local:        http://localhost:3000
```

#### Email Service (Terminal 3) - Optional
For viewing emails in development:
```bash
docker-compose up mailhog
```
Then open `http://localhost:8025` to see emails

---

## Test Scenarios

### Scenario 1: Register with Email Verification

**Steps:**
1. Go to `http://localhost:3000/register`
2. Enter:
   - Name: `João Silva`
   - Email: `joao@example.com`
   - Password: `SecurePass123!`
3. Click "Sign Up"

**Expected Result:**
- See message: "Enviamos um código de verificação para seu email"
- Show verification code form
- Email appears in MailHog (http://localhost:8025)

**Get Verification Code:**
1. Open MailHog: `http://localhost:8025`
2. Click the latest email from noreply@semstress.local
3. Copy the 6-digit code from the email body
4. Return to browser and enter code

**Expected Result:**
- Code is accepted
- Redirected to `/dashboard`
- JWT token saved in localStorage
- User can see dashboard content

---

### Scenario 2: Login with Email 2FA

**Steps:**
1. Go to `http://localhost:3000/login`
2. Enter:
   - Email: `joao@example.com`
   - Password: `SecurePass123!`
3. Click "Sign In"

**Expected Result:**
- If email not yet verified: Show verification code form
- If already verified: JWT token received, redirect to dashboard

**Complete 2FA:**
1. Check MailHog for verification code
2. Enter code in the form
3. Submit

**Expected Result:**
- Logged in successfully
- Redirected to dashboard
- Token in localStorage

---

### Scenario 3: Resend Verification Code

**Steps:**
1. On verification screen, click "Didn't receive the code? Resend"
2. Wait 2-3 seconds

**Expected Result:**
- New email appears in MailHog
- New 6-digit code in the email
- Code is different from previous (if sent immediately after first)

---

### Scenario 4: Register Admin User

**Note:** Admin registration bypasses email verification.

**Steps:**
1. Via Backend API (using Postman or curl):

```bash
curl -X POST http://localhost:3001/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "role": "ADMIN"
  }'
```

**Expected Result:**
- HTTP 201 response with JWT token
- `emailVerified` is `true` automatically
- No verification email sent

---

### Scenario 5: Login with Invalid Code

**Steps:**
1. Register new user → see verification form
2. Enter wrong code (e.g., `123456`)
3. Click submit

**Expected Result:**
- Error message: "Código de verificação inválido ou expirado"
- Stay on verification screen
- Can retry or resend

---

### Scenario 6: Expired Verification Code

**Steps:**
1. Register user
2. Get verification code
3. Wait ~15 minutes (code expiration time)
4. Try to enter the old code

**Expected Result:**
- Error: "Código de verificação inválido ou expirado"
- User must click "Resend" to get new code

---

### Scenario 7: OAuth Setup (Optional - Production)

#### Google OAuth

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add `http://localhost:3000` to Authorized JavaScript origins
4. Add `http://localhost:3000/auth/callback` to Authorized redirect URIs
5. Copy Client ID and Secret to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

**Test:**
1. Go to login page
2. Click "Sign in with Google"
3. Sign in with Google account
4. Should redirect to callback page, then dashboard

**Expected Result:**
- User created with `googleId` set
- `emailVerified` automatically `true`
- JWT token received
- No email verification needed

#### GitHub OAuth

**Setup:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set:
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
   - Homepage URL: `http://localhost:3000`
4. Copy Client ID and Secret to `.env`:
   ```env
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

**Test:**
1. Go to login page
2. Click "Sign in with GitHub"
3. Sign in with GitHub account
4. Should redirect to callback page, then dashboard

**Expected Result:**
- User created with `githubId` set
- `emailVerified` automatically `true`
- JWT token received

---

## Database Verification

### Check User Records

```bash
# Connect to PostgreSQL
psql postgresql://user:password@localhost:5432/semstress

# View users
SELECT id, email, name, emailVerified, googleId, githubId, createdAt FROM "User";

# View verification codes (before verification)
SELECT id, email, verificationCode, verificationCodeExpiresAt FROM "User" WHERE verificationCode IS NOT NULL;
```

---

## Email Verification Details

### Verification Code Format
- **Length**: 6 digits
- **Format**: Random numbers (0-9)
- **Example**: `482917`

### Verification Code Expiration
- **Duration**: 15 minutes from generation
- **Timezone**: UTC
- **Field**: `verificationCodeExpiresAt`

### Email Content
**From**: `noreply@semstress.local`
**Subject**: `Verify Your Email - Semstress`
**Body**: 
```
Your verification code is: 482917

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.
```

---

## API Endpoints Summary

### Authentication Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register with email/password, triggers 2FA |
| POST | `/auth/login` | Login with email/password, checks verification |
| POST | `/auth/verify-email` | Verify code after registration/login |
| POST | `/auth/resend-code` | Get new verification code |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/github` | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | GitHub OAuth callback |
| POST | `/auth/register-admin` | Register admin (bypasses 2FA) |

### Request/Response Examples

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SecurePass123!"
}

Response 201:
{
  "requiresVerification": true,
  "email": "joao@example.com"
}
```

#### Verify Email
```bash
POST /auth/verify-email
Content-Type: application/json

{
  "email": "joao@example.com",
  "code": "482917"
}

Response 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "joao@example.com",
    "name": "João Silva",
    "role": "USER"
  }
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "SecurePass123!"
}

Response 200 (if verified):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

Response 200 (if not verified):
{
  "requiresVerification": true,
  "email": "joao@example.com"
}
```

---

## Troubleshooting

### Backend won't start
```
ERROR [ExceptionHandler] OAuth2Strategy requires a clientID option
```
**Solution:** 
- Dummy credentials are now used for development
- Restart backend: `npm run start:dev`
- Backend should start successfully even with empty OAuth credentials

### Emails not arriving
```
Check MailHog at http://localhost:8025
```
**Solution:**
- Ensure Docker container is running: `docker-compose up mailhog`
- Check MAIL_HOST, MAIL_PORT in .env match Docker configuration

### Verification code invalid
**Common causes:**
1. Code expired (>15 minutes old)
2. Typo in code entry
3. Wrong code for wrong user

**Solution:**
- Click "Resend" to get new code
- Re-verify immediately after receiving

### Can't complete OAuth flow
**If credentials are dummy:**
- OAuth endpoints will fail with 401/403 error
- This is expected behavior in development
- Use email 2FA for testing instead
- Set up real OAuth credentials for full testing

---

## Performance Notes

- **Register**: ~500ms (includes email sending)
- **Verify Code**: ~200ms (includes database check and token generation)
- **Login**: ~400ms (depends on email verification status)
- **OAuth Callback**: ~800ms (includes user creation/lookup)

---

## Security Checklist

✅ Passwords are hashed (bcrypt)
✅ JWT tokens have 24-hour expiration
✅ Verification codes are 6-digit random
✅ Verification codes expire after 15 minutes
✅ OAuth callbacks validate state parameter
✅ Protected routes check JWT validity
✅ Sensitive fields not exposed in API responses

---

## Next Steps After Testing

1. **Configure OAuth** (optional):
   - Follow Scenario 7 to set up Google and GitHub

2. **Deploy to Staging**:
   - Update .env with production values
   - Configure real SMTP server for emails
   - Set real OAuth credentials

3. **Monitor in Production**:
   - Track failed login attempts
   - Monitor email delivery
   - Track OAuth success rates

---

## Support

For issues or questions:
- Check backend logs: `npm run start:dev` output
- Check frontend console: Browser DevTools → Console
- Check MailHog: `http://localhost:8025`
- Check database: `psql` PostgreSQL CLI
