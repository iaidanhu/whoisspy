# Neon + Prisma 在 Cloudflare Workers 上（Hyperdrive）

本仓库在本地与 Next.js `dev` 下使用 **`DATABASE_URL`**（指向 Neon 的 PostgreSQL 连接串）与 **Prisma Client**。

部署到 **Cloudflare Workers** 时，建议通过 **[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)** 池化到 Neon，避免在边缘直接持有大量直连。

## 配置步骤（概要）

1. 在 Cloudflare 控制台创建 **Hyperdrive** 配置，目标为 Neon 的 `postgresql://…` 连接串。
2. 在 `wrangler.jsonc` 中增加 `hyperdrive` binding（示例见同文件内注释块）。
3. 在 Worker / OpenNext 运行时，用 Hyperdrive 提供的 **`connectionString`** 作为 `DATABASE_URL` 注入 Prisma（具体取法以当前 `@opennextjs/cloudflare` 与 Prisma 版本文档为准）。
4. **Secrets**：生产环境勿将裸连接串提交进仓库；使用 `wrangler secret put` 或 Dashboard 绑定。

## 本地开发

继续使用根目录 **`.env`** 中的 `DATABASE_URL` 即可；**`.dev.vars`** 供 Wrangler 本地预览时覆盖变量（与官方 OpenNext 文档一致）。

验证连通性：本地 `pnpm dev` 跑通房间 API；预览 `pnpm preview` 在绑定正确时应对数据库可读。

## 发布（CI/CD）

仓库提供 **`pnpm run deploy`**（OpenNext + Wrangler）。合并到主分支后，在已登录 Cloudflare 的环境执行该命令，或在 CI 中注入 **`CLOUDFLARE_API_TOKEN`** 及所需数据库相关 Secret 后调用同一命令，即可重复发布。`.github/workflows/ci.yml` 对每次 PR/推送执行类型检查、Lint 与 **`pnpm run test`**。
