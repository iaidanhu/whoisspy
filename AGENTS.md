# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Next.js 16 + React 19 + TypeScript app deployed to Cloudflare Workers. Uses Tailwind CSS v4, shadcn/ui components, Drizzle ORM with Neon PostgreSQL, and better-auth for authentication.

## Build/Lint Commands

```bash
# Development
pnpm dev                 # Start Next.js dev server

# Build
pnpm build               # Build for production
pnpm deploy              # Build and deploy to Cloudflare Workers
pnpm preview             # Build and preview locally on Cloudflare

# Lint/Typecheck
pnpm lint                # Run ESLint

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Run migrations
pnpm drizzle-kit push      # Push schema changes

# Type generation
pnpm cf-typegen          # Generate Cloudflare env types
```

**Note:** This project uses `pnpm` as the package manager. No test framework is currently configured.

## Code Style Guidelines

### TypeScript

- Use strict TypeScript mode (`strict: true`)
- Target ES2024 with modern module resolution (`bundler`)
- Use type imports: `import type { Foo } from "bar"`
- Path alias: `@/` maps to `./src/*`
- No explicit return types required for React components (inferred)

### Imports

Order and group imports:
1. External libraries (React, Next.js)
2. Internal absolute imports (`@/components`, `@/lib`)
3. Relative imports (siblings, parents)

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

### Formatting

- **No semicolons** (except where required by ASI)
- Use **tabs** for indentation
- Use **double quotes** for strings
- **Trailing commas** in objects/arrays

### Naming Conventions

- Components: PascalCase (`Button.tsx`, `SignInPage`)
- Utilities/hooks: camelCase (`useAuth`, `cn`)
- Files: kebab-case for non-component files (`auth-client.ts`)
- Database: Use Drizzle schema with table names in camelCase

### Component Patterns

Use function declarations for components:

```typescript
function Button({ className, variant, ...props }: ButtonProps) {
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />
}
```

For UI components with variants, use `class-variance-authority` (cva):

```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { default: "...", sm: "..." }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)
```

Use the `cn()` utility from `@/lib/utils` for class merging:

```typescript
import { cn } from "@/lib/utils"

className={cn("base", condition && "conditional", className)}
```

### Styling

- Tailwind CSS v4 with CSS variables in `globals.css`
- Use theme tokens: `bg-primary`, `text-primary-foreground`, `rounded-md`
- Support dark mode via `dark:` variants
- Icon sizing: `size-4` for small, `size-9` for icon buttons

### Error Handling

- Environment variables: Validate at runtime with descriptive errors
- Database: Use Drizzle's type-safe queries; handle nullable results
- Auth: Use better-auth's built-in error handling

```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}
```

### Database (Drizzle)

- Schema files in `src/db/schema`
- Migrations in `src/db/migrations`
- Use `drizzle-orm/neon-http` for serverless PostgreSQL
- Export `db` instance from `src/db/index.ts`

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `RESEND_API_KEY` - For email sending
- `BETTER_AUTH_SECRET` - Auth encryption key
- `BETTER_AUTH_URL` - Auth callback URL
- `FROM_EMAIL` - Sender email address

Cloudflare bindings are defined in `wrangler.jsonc` and types generated via `cf-typegen`.

### File Structure

```
src/
  app/              # Next.js App Router pages
    api/            # API routes
    auth/           # Auth-related pages
  components/
    ui/             # shadcn/ui components
  lib/              # Utility functions, auth config
  db/               # Database schema and client
types/
  cloudflare-env.d.ts  # Generated Cloudflare types
```
