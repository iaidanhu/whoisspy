# Next.js + Better Auth Template

English | [中文](./README.zh.md)

A production-ready authentication template using Next.js 16, Better Auth, Drizzle ORM, and Neon PostgreSQL. Deployed to Cloudflare Workers.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Authentication:** Better Auth v1.4 (email/password)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Email:** Resend
- **Deployment:** Cloudflare Workers (via OpenNext)

## Features

- **Email/Password Authentication**
  - User registration with optional email verification
  - Secure login/logout
  - Password reset flow
  - Protected routes

- **Email Verification (Toggleable)**
  - Set `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false` to skip email verification
  - Set `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` to require email verification

- **Database**
  - PostgreSQL with Neon
  - Type-safe queries with Drizzle ORM
  - Migration support

- **UI Components**
  - Modern auth pages with shadcn/ui
  - Responsive design
  - Loading states and error handling

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-name>

# Install dependencies
pnpm install
```

### 2. Environment Variables

Create a `.env` file:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
# App URL (shared between server and client)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Verification Toggle
# Set to "false" to skip email verification during signup
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION="true"

# Resend Email Service
RESEND_API_KEY="re_your_api_key"
FROM_EMAIL="onboarding@resend.dev"
```

**Generate a secret key:**
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm drizzle-kit push
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts  # Better Auth API routes
│   ├── auth/
│   │   ├── layout.tsx              # Auth layout (redirects if logged in)
│   │   ├── sign-in/page.tsx        # Login page
│   │   ├── sign-up/page.tsx        # Register page
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── page.tsx                    # Home page (shows user info or login button)
│   └── layout.tsx                  # Root layout
├── components/
│   └── ui/                         # shadcn/ui components
├── db/
│   ├── index.ts                    # Database connection
│   ├── schema/
│   │   ├── auth.ts                 # Better Auth schema (user, session, account, verification)
│   │   └── index.ts
│   └── migrations/                 # Drizzle migrations
├── lib/
│   ├── auth.ts                     # Better Auth configuration
│   ├── auth-client.ts              # Client-side auth hooks
│   └── email.ts                    # Email sending functions
├── types/
│   └── cloudflare-env.d.ts         # Cloudflare types (auto-generated)
```

## Configuration Guide

### Email Verification

Control whether users need to verify their email before accessing the app:

```bash
# .env
REQUIRE_EMAIL_VERIFICATION="false"  # Skip verification
REQUIRE_EMAIL_VERIFICATION="true"   # Require verification
```

When disabled:
- Users can register with just email + password
- Automatically logged in after registration
- Redirected to home page

When enabled:
- Verification email sent after registration
- User must click link in email
- Then redirected to login

### Database Schema

Better Auth requires 4 tables:

| Table | Description |
|-------|-------------|
| `user` | User accounts (id, email, name, emailVerified) |
| `session` | Active sessions |
| `account` | OAuth accounts (if using social login) |
| `verification` | Email verification & password reset tokens |

### Email Templates

Customize email templates in `src/lib/email.ts`:

- `sendResetPasswordEmail()` - Password reset email
- `sendVerificationEmail()` - Email verification

## Available Scripts

```bash
# Development
pnpm dev                 # Start dev server

# Production
pnpm build               # Build for production
pnpm deploy              # Deploy to Cloudflare Workers
pnpm preview             # Preview on Cloudflare locally

# Database
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Run migrations
pnpm drizzle-kit push    # Push schema changes directly

# Code Quality
pnpm lint                # Run ESLint

# Cloudflare
pnpm cf-typegen          # Generate Cloudflare types
```

## Deployment

### Cloudflare Workers

1. Set secrets in Cloudflare Dashboard or via Wrangler:

```bash
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY
```

2. Deploy:

```bash
pnpm deploy
```

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL` (your production URL, e.g., https://your-app.com)
- `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION` (set to "false" to skip email verification)
- `RESEND_API_KEY`
- `FROM_EMAIL`

## Customization

### Adding Social Login

Edit `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

### Protected Routes

Create a middleware or layout for protected pages:

```typescript
// src/app/dashboard/layout.tsx
'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }) {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    router.push('/auth/sign-in')
    return null
  }

  return children
}
```

### Customize UI Theme

Edit `src/app/globals.css` to customize colors:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... */
}
```

## Troubleshooting

### 500 Error on Sign Up/In

1. Check database connection string
2. Ensure tables are created: `pnpm drizzle-kit push`
3. Check Better Auth URL is correct
4. Verify environment variables are loaded

### Email Not Sending

1. Verify Resend API key
2. Check `FROM_EMAIL` is verified in Resend
3. Check spam folders
4. Review server logs

### Session Not Persisting

1. Ensure `BETTER_AUTH_SECRET` is set
2. Check browser cookies are enabled
3. Verify `NEXT_PUBLIC_APP_URL` matches your domain

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [Neon Documentation](https://neon.tech/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## License

MIT License - feel free to use this template for your own projects!

---

**Need Help?** Open an issue or check the Better Auth documentation for advanced features like two-factor auth, organization support, and more.
