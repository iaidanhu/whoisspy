# Next.js + Better Auth 模板

[English](./README.md) | 中文

一个可用于生产环境的认证模板，使用 Next.js 16、Better Auth、Drizzle ORM 和 Neon PostgreSQL。部署到 Cloudflare Workers。

## 技术栈

- **框架：** Next.js 16 (App Router) + React 19 + TypeScript
- **认证：** Better Auth v1.4（邮箱/密码）
- **数据库：** Neon PostgreSQL + Drizzle ORM
- **样式：** Tailwind CSS v4 + shadcn/ui
- **邮件：** Resend
- **部署：** Cloudflare Workers（通过 OpenNext）

## 功能特性

- **邮箱/密码认证**
  - 支持可选邮箱验证的用户注册
  - 安全的登录/登出
  - 密码重置流程
  - 受保护的路由

- **邮箱验证（可开关）**
  - 设置 `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false` 跳过邮箱验证
  - 设置 `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` 需要邮箱验证

- **数据库**
  - 使用 Neon 的 PostgreSQL
  - 类型安全的 Drizzle ORM 查询
  - 支持数据库迁移

- **UI 组件**
  - 基于 shadcn/ui 的现代认证页面
  - 响应式设计
  - 加载状态和错误处理

## 快速开始

### 1. 克隆并安装

```bash
# 克隆仓库
git clone <your-repo-url>
cd <project-name>

# 安装依赖
pnpm install
```

### 2. 环境变量

创建 `.env` 文件：

```bash
# 数据库 (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key-here"
# 应用 URL（服务端和客户端共用）
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 邮箱验证开关
# 设置为 "false" 可在注册时跳过邮箱验证
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION="true"

# Resend 邮件服务
RESEND_API_KEY="re_your_api_key"
FROM_EMAIL="onboarding@resend.dev"
```

**生成密钥：**
```bash
openssl rand -base64 32
```

### 3. 数据库设置

```bash
# 生成迁移文件
pnpm db:generate

# 推送 schema 到数据库
pnpm drizzle-kit push
```

### 4. 运行开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts  # Better Auth API 路由
│   ├── auth/
│   │   ├── layout.tsx              # 认证布局（已登录则重定向）
│   │   ├── sign-in/page.tsx        # 登录页面
│   │   ├── sign-up/page.tsx        # 注册页面
│   │   ├── forgot-password/page.tsx # 忘记密码
│   │   ├── reset-password/page.tsx # 重置密码
│   │   └── verify-email/page.tsx   # 验证邮箱
│   ├── page.tsx                    # 首页（显示用户信息或登录按钮）
│   └── layout.tsx                  # 根布局
├── components/
│   └── ui/                         # shadcn/ui 组件
├── db/
│   ├── index.ts                    # 数据库连接
│   ├── schema/
│   │   ├── auth.ts                 # Better Auth schema（user, session, account, verification）
│   │   └── index.ts
│   └── migrations/                 # Drizzle 迁移文件
├── lib/
│   ├── auth.ts                     # Better Auth 配置
│   ├── auth-client.ts              # 客户端 auth hooks
│   └── email.ts                    # 邮件发送函数
├── types/
│   └── cloudflare-env.d.ts         # Cloudflare 类型（自动生成）
```

## 配置指南

### 邮箱验证

控制用户是否需要验证邮箱才能使用应用：

```bash
# .env
REQUIRE_EMAIL_VERIFICATION="false"  # 跳过验证
REQUIRE_EMAIL_VERIFICATION="true"   # 需要验证
```

禁用时：
- 用户只需邮箱 + 密码即可注册
- 注册后自动登录
- 重定向到首页

启用时：
- 注册后发送验证邮件
- 用户需点击邮件中的链接
- 然后重定向到登录页

### 数据库 Schema

Better Auth 需要 4 张表：

| 表名 | 说明 |
|------|------|
| `user` | 用户账户（id, email, name, emailVerified） |
| `session` | 活跃会话 |
| `account` | OAuth 账户（如果使用社交登录） |
| `verification` | 邮箱验证和密码重置令牌 |

### 邮件模板

在 `src/lib/email.ts` 中自定义邮件模板：

- `sendResetPasswordEmail()` - 密码重置邮件
- `sendVerificationEmail()` - 邮箱验证邮件

## 可用脚本

```bash
# 开发
pnpm dev                 # 启动开发服务器

# 生产
pnpm build               # 生产构建
pnpm deploy              # 部署到 Cloudflare Workers
pnpm preview             # 本地 Cloudflare 预览

# 数据库
pnpm db:generate         # 生成 Drizzle 迁移
pnpm db:migrate          # 运行迁移
pnpm drizzle-kit push    # 直接推送 schema 变更

# 代码质量
pnpm lint                # 运行 ESLint

# Cloudflare
pnpm cf-typegen          # 生成 Cloudflare 类型
```

## 部署

### Cloudflare Workers

1. 在 Cloudflare Dashboard 或通过 Wrangler 设置密钥：

```bash
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY
```

2. 部署：

```bash
pnpm deploy
```

### 生产环境变量

确保在部署平台设置所有环境变量：

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`（你的生产域名，如 https://your-app.com）
- `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`（设置为 "false" 可跳过邮箱验证）
- `RESEND_API_KEY`
- `FROM_EMAIL`

## 自定义扩展

### 添加社交登录

编辑 `src/lib/auth.ts`：

```typescript
export const auth = betterAuth({
  // ... 现有配置
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

### 受保护的路由

为需要登录的页面创建布局：

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

### 自定义 UI 主题

编辑 `src/app/globals.css` 自定义颜色：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... */
}
```

## 故障排查

### 注册/登录时 500 错误

1. 检查数据库连接字符串
2. 确保表已创建：`pnpm drizzle-kit push`
3. 检查 Better Auth URL 是否正确
4. 验证环境变量是否已加载

### 邮件发送失败

1. 验证 Resend API key
2. 检查 `FROM_EMAIL` 是否在 Resend 中已验证
3. 检查垃圾邮件文件夹
4. 查看服务器日志

### 会话无法保持

1. 确保 `BETTER_AUTH_SECRET` 已设置
2. 检查浏览器 cookie 是否启用
3. 验证 `NEXT_PUBLIC_APP_URL` 与域名匹配

## 相关资源

- [Better Auth 文档](https://www.better-auth.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs)
- [Neon 文档](https://neon.tech/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## 许可证

MIT License - 可自由用于你的项目！

---

**需要帮助？** 提交 issue 或查看 Better Auth 文档了解更多高级功能，如双因素认证、组织支持等。
