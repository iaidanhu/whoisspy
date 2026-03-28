## 1. 基础模型与契约

- [x] 1.1 定义房间、玩家、**单局游戏**、发言轮次、投票、平票加赛、**会话多局**、排行榜等领域模型。
- [x] 1.2 定义服务端权威的实时事件契约：加入/离开、**开局**、发言文本、投票（**时长由房间配置，默认 30s**）、**局结束/胜负**、**会话结束**、**终局榜 / 房主再来一局**等。
- [x] 1.3 环境/配置：房间码策略、**投票/发言默认各 30s（房主可改）**、会话总局数 1–10（默认见 `design.md`）、`DATABASE_URL`（Neon）。

## 2. 工程初始化与数据

- [x] 2.1 **用 Cloudflare 官方命令创建工程基底**（[OpenNext – New apps](https://opennext.js.org/cloudflare/get-started)）：`npm create cloudflare@latest -- <app-name> --framework=next --platform=workers`。**勿**单独 `create-next-app` 再迁 OpenNext。生成后接入 **Tailwind CSS 4**、**shadcn/ui**（含 **Textarea**、Button、Dialog、Dropdown 等）、**Lucide React**、**Jotai**、**Framer Motion**（Next / OpenNext 兼容矩阵在 PR 中注明）。
- [x] 2.1b **国际化骨架（优先）**：接入 **next-intl**；建立 **`src/app/[locale]/`layout** 与 **`middleware`**；根路径重定向 **`/zh`**；新增 **`messages/zh.json`、`messages/en.json`**；契约页与 **`/start`** 提供 **语言切换**（shadcn **DropdownMenu** 等）；**`whoisspy_locale_v1`** 与 URL 策略按 `design.md` 写清。
- [x] 2.2 接入 **Prisma + PostgreSQL**，配置 **Neon** 连接串与迁移流程。
- [x] 2.3 **MVP 不使用 Redis**；状态以 DB + 进程内（或单实例）为主，文档中注明多实例后续改造点。
- [x] 2.4 接入全局词库：读取 `data/system-word-pairs.json`（或导入 DB 的种子脚本，二选一并实现一种）。
- [x] 2.5 **UI 基线**：按 `design-ui.md` 配置 Tailwind 4 主题/CSS 变量（`@theme` 或项目约定方式）；**shadcn/ui** 组件用 `design-ui` 令牌覆写（对局深暖底、首页 `--home-*` 等）；动效用 **Framer Motion** 但遵守 `design-ui` 克制原则；新增页面类型须先更新 `design-ui.md`。
- [x] 2.6 安装 **`@dicebear/core`**、**`@dicebear/collection`**，封装 **Big Smile** 头像组件；**`/[locale]/`**：**无 `whoisspy_profile_v1`** 时契约页按 **`docs/images/home.png`**；**已有档案**时重定向 **`/[locale]/start`**（或等价）；契约内：纸卡片、签名线昵称、头像横滑/网格、**指纹按钮**完成登记后入 **`/start`**；**未选头像**时下一步注入 **随机 seed**；CC BY 4.0 署名（见 [DiceBear Big Smile](https://www.dicebear.com/styles/big-smile/)）。
- [x] 2.7 实现 **`whoisspy_profile_v1` localStorage**（`displayName` + `avatarSeed`）：在契约首页**下一步**写入；**`/[locale]/start`** 无档案时重定向 **`/[locale]/`**；创建/加入房间携带档案。
- [x] 2.8 实现 **`/[locale]/start`**：仅 **加入房间**（房间码 + 确定）与 **开房间** 两入口；创建成功 **直达** **`/[locale]/r/[code]`**；**强制同色纸感**（`design-ui.md` §2.1、`--home-*`）。

## 3. 私密房间生命周期

- [x] 3.1 实现创建房间：`W` + 7 位随机字母数字，活跃码唯一。
- [x] 3.2 实现无登录加入（房间码 + `displayName` + `avatarSeed`）与会话内身份；列表与消息头使用统一 Big Smile 渲染。
- [x] 3.3 人数 3–8、满员拒绝；**无准备阶段**。
- [x] 3.4 房主游戏设置：**会话总局数 1–10**、**投票时长**、**发言时长**（均有默认值，可不打开设置即开局）；**不提供**自定义词组。顶栏 **仅房主** 显示 **游戏设置** + **开始游戏**（未满 3 人禁用开始）。
- [x] 3.5 开局从系统词库随机抽一对词，**每局固定 1 名卧底**并发词。

## 4. 文字频道与可选浏览器 STT

- [x] 4.1 WebSocket（或等价）广播状态与合法描述消息。
- [x] 4.2 方案 A：发言阶段仅当前轮到玩家可发描述；服务端拒绝他人。
- [x] 4.3 消息字段：发送者、座位号、时间、文本、关联局/轮次。
- [x] 4.4 可选 Web Speech API；不可用则仅键盘。
- [x] 4.5 防刷：长度上限、频率限制。

## 5. 对局状态机与规则实现

- [x] 5.1 实现状态机：**无准备**；发言（时长读房间配置，默认 30s）→ 投票（时长同配置，默认 30s）→ 结算出局或全员弃票继续；平票加赛；**胜负判定**（卧底出局平民胜 / 剩 2 人含卧底则卧底胜）。
- [x] 5.2 **投票**不可投自己；超时=弃票；**全员弃票**则无人出局、进入下一轮。
- [x] 5.3 发言顺序：座位号升序；平票加赛仅平票玩家、顺序升序。
- [x] 5.4 发言超时自动下一位或进入投票（时长与投票时长均由房主设置，默认均为 30s）。
- [x] 5.5 平票加赛无次数上限，直至可执行出局或非全员弃票的有效结果。

## 6. 多局会话、计分与 MVP

- [x] 6.1 每**局**结束按该局淘汰顺序 +0/+1/… 计分；存活者并列最高分档（见 design）。
- [x] 6.2 累计榜每局后更新；局间任意查看。
- [x] 6.3 **全部局数完成后**在工作间**中部**展示排行榜并揭晓 MVP。
- [x] 6.4 会话结束清空或归档榜单；**房主「重新开始游戏」** 同房开启新会话并重置榜。

## 7. 体验与验证

- [ ] 7.0 按 `design-ui.md` 的 **路由与壳层**搭建界面：路径均为 **`/[locale]/...`**（含首页双态、**`/start`**、**`/r/[code]`** 单壳含等待/对局/终局）；**中英文案键完整**；对照 **§11 自检清单** 过一遍再合入。
- [ ] 7.1 响应式 UI（Tailwind + shadcn）：发言阶段 **侧栏当前发言人强高亮**；**中部舞台** 他人时 **大图头像 + 描述文案带**，本人时 **Textarea + 麦克风(STT)**，**Enter 发送 / Shift+Enter 换行**（与 `design-ui` §8、`image.png` 一致）；投票 UI（**可配置**倒计时，默认 30s）；房主顶栏控件仅房主可见。
- [ ] 7.2 **音频**：等待态 **BGM 循环**（源 `docs/audio/day.mp3` → `public/audio/` 或约定路径）、开局停止/淡出、再来一局回等待恢复；顶栏 **静音/BGM/音效** 与自动播放策略；**短音效**：投票、发言/投票超时预警、请 N 号发言；**开局 / 单局终 / 会话终** 留事件钩子，资源到位后接文件（无资源时静默跳过）。
- [ ] 7.3 集成测试：不可投自己、全员弃票、**默认 30s** 超时、卧底出局、两人残局卧底胜、平票加赛、终局中部榜、房主再来一局。
- [ ] 7.4 E2E：3 人 / 8 人、多局会话与最终 MVP。
- [ ] 7.5 WebSocket 断线重连恢复状态。

## 8. 部署（Cloudflare + OpenNext）

按 **[OpenNext on Cloudflare – Get Started](https://opennext.js.org/cloudflare/get-started)** 落地（随官方版本更新核对命令与文件名）。**若 2.1 已用 `npm create cloudflare@latest … --framework=next --platform=workers`**，下列多项可能已由脚手架生成，任务以 **核对版本与补全缺口** 为主。

- [x] 8.1 核对 **`@opennextjs/cloudflare`** 与 **`wrangler`**（devDependency，版本满足文档要求，如 **≥ 3.99.0**）；若缺失则补装。
- [x] 8.2 核对 **`wrangler.jsonc`**（`main` / `assets` / `nodejs_compat` 等）、**`open-next.config.ts`**（按需 R2 增量缓存等）、**`.dev.vars`**；**`package.json`** 含 **`preview` / `deploy`**（及文档中的 **`build`/`upload`/`cf-typegen`** 等）脚本。
- [x] 8.3 **`next.config`**：按需调用 **`initOpenNextCloudflareForDev`**；**禁止**保留适配器不支持的 **`export const runtime = "edge"`**。
- [x] 8.4 静态资源：按文档添加或核对 **`public/_headers`**（如 `/_next/static/*` 长期缓存）；**`.open-next`** 在 **`.gitignore`** 中。
- [ ] 8.5 **Neon + Prisma**：在 Workers 运行时验证数据库连通（**Hyperdrive** 或官方推荐方式），Secrets / `DATABASE_URL` 与 Wrangler 环境对齐。
- [ ] 8.6 **实时**：WebSocket（或等价）在 Cloudflare 上的部署形态与 OpenNext 联调通过；文档中注明开发与生产 URL。
- [ ] 8.7 CI/CD：生产分支合并后 **`npm run deploy`**（或 Cloudflare Git 集成）可重复发布。

**备选路径**：若仓库**不是**由 `create cloudflare` 生成，可用 **`npx @opennextjs/cloudflare migrate`** 接入（以 CLI 当前行为为准）；**新仓库优先官方脚手架**，见 2.1。
