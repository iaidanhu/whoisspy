## 上下文

浏览器版 **《谁是卧底》**（**Who Is Spy**），PC/H5 响应式。**MVP 文字 + 可选 STT**；私密房间、无登录。玩法与词库、胜负、投票规则以本文 **「玩法细则（已定）」** 为准。**工程/包/Worker 标识为 `whoisspy`**（勿用 `whois` 作项目名）；产品命名、localStorage 键与 AI 协作指引见 **[`docs/project-meta.md`](../../../docs/project-meta.md)**。

**UI 与视觉**：**所有界面实现须遵循** [`design-ui.md`](./design-ui.md)。**`/[locale]/` 与 `/[locale]/start`** 均以 **[`docs/images/home.png`](../../../docs/images/home.png)** 为纸感基准；**工作间（房间内全流程）**以 **[`docs/images/image.png`](../../../docs/images/image.png)** 为基准。身份、头像、localStorage、**i18n** 见 `design-ui.md` §2～§3 与 **`app-internationalization` 规格**。

---

## 业务流程（已定）

### 1）首页 `/[locale]/` 的两种形态

| 情况 | 条件 | 界面行为 |
|------|------|----------|
| **首次或未建档** | 无有效 `whoisspy_profile_v1`（或约定等价校验失败） | 仅展示 **契约登记**：昵称、头像、指纹「下一步」；完成后写入 localStorage 并进入 **选择界面**（跳转 **`/[locale]/start`** 或同站约定路径）。 |
| **已建档** | 已有有效档案 | **不**再展示契约登记；**直接进入选择界面**（建议 **`/[locale]/start`**：加入房间 / 创建房间）。用户若需改资料，可提供「修改资料」链回 **`/[locale]/?edit=1`** 或专用入口，打开契约表单。 |

### 2）加入房间

- 在选择界面输入 **房间号**，点 **确定** → 进入 **`/[locale]/r/[code]`** 工作间。

### 3）创建房间

- 点 **创建房间** → **直接进入** **`/[locale]/r/[code]`** 游戏**主界面/工作间**（与参考图同一壳层），**不**经过单独「仅列表」的二级页。
- **创建者 = 房主**，座位为 **1 号位**（加入顺序第一个）。
- **右上角（顶栏右侧）**仅 **房主**可见：
  - **游戏设置**：打开面板，可改本局/本会话相关参数；**每项均有默认值，可不点开即开局**。
  - **开始游戏**：满足条件（如 **≥3 人**）才可点；否则 **disabled**。
- **非房主**不显示上述两按钮。

### 4）房主可调参数（均有默认值）

| 参数 | 默认值（MVP） | 说明 |
|------|----------------|------|
| **投票阶段时长** | **30 秒** | 超时视为弃票；平票加赛投票同此配置。 |
| **发言阶段时长** | **30 秒** | 每人描述倒计时，超时自动下一位或进投票。 |
| **会话总局数** | **5**（或产品最终拍板 3～10 内一数） | 仍限制在 **1～10** 可调。 |

其它与玩法相关的开关若 MVP 增加，须同步默认值并写入规格。

### 5）会话结束与再来一局

- **全部局数**完成后：在 **工作间主界面中部** 展示 **本会话排行榜**（累计分 / MVP），**所有玩家**可见。
- **房主**在终局界面可操作 **重新开始游戏**（在**同一房间**内开启新会话：重置会话进度与榜单、回到可配置+等待开局状态，或产品约定的等价「整房重置」）；非房主仅围观或离开房间。

### 6）路由与单页壳

- **工作间**统一为 **`/[locale]/r/[code]`**，通过 **房间状态** 切换：等待成员、对局中、会话结束榜；**不强制**单独 `/play` 路由（若技术实现拆子路由，须保持同一视觉壳与 WebSocket 上下文）。

### 7）沉浸式音频（BGM + 音效）

- **等待开局 BGM（已有资源）**：工作间处于 **等待房主开始游戏**（本会话尚未进入进行中、成员在房内等待）时，客户端 **循环播放** 背景音乐。仓库源文件为 **[`docs/audio/day.mp3`](../../../docs/audio/day.mp3)**；实现时须放到浏览器可请求的静态路径（例如 `public/audio/day.mp3`），并保持 **无缝循环**（`loop` + 必要时淡入淡出）。**进入对局**（房主成功开局、状态机进入发词/发言等）时 **停止或渐隐 BGM**，避免与对局音效抢耳。房主 **重新开始游戏** 回到等待态后，若用户未关声音，**恢复** BGM 循环。
- **音效开关**：顶栏「声音」类设置须至少支持 **总开关或 BGM 开关**（与短音效可合并为一级「静音」或分项，具体 UI 见 `design-ui.md`）；默认可 **开启**，尊重系统静音与浏览器自动播放策略（首次需用户与页面交互后再尝试播放的，须有降级说明）。
- **短音效（资源待定）**：为增强反馈，**建议**在以下时机各配独立音效（文件到位后接入，规格先占位）：
  - **游戏开始**：从等待态切入第一局/新一局「进行中」的瞬间；
  - **临近超时**：发言或投票倒计时进入 **预警区间**（与现有「倒计时/预警」音效一致，可一条或多条分层）；
  - **游戏结束**：**单局结算**产生胜负时、以及 **本会话全部局数结束** 进入终局榜时（可共用或分轨，由资源决定）。
- 已有规格中的 **投票确认**、**请 N 号发言** 等与上述并存；具体清单与文件命名在实现阶段与 `room-text-channel` 规格同步。

---

## 玩法细则（已定）

### 角色与发词

- 每局固定 **1 名卧底**，其余为平民；人数 **3–8** 不变。
- 词组**仅**来自全局**系统词库**（仓库 `data/system-word-pairs.json`），开局时随机抽取一对：`civilianWord` 发给平民，`undercoverWord` 发给卧底。

### 流程与准备

- **无准备阶段**：玩家进入房间即视为就绪；**无准备超时**。
- 房主点击开始 → 发词 → 进入发言 / 投票循环，直至该局满足胜负条件。
- **发言阶段 UI**：侧栏 **高亮当前发言人**；中部 **主舞台** 展示其 **大图头像 + 描述文字**（参考 **`docs/images/image.png`**）；轮到自己时中部 **切换为多行 Textarea**（**Enter 发送、Shift+Enter 换行**）+ **麦克风转写**，发送后 **结束本轮本人发言**（非退房）。基础组件 **shadcn/ui**；细则见 **`design-ui.md` §8** 与 **`room-text-channel`**。

### 胜负（单局结束）

- **平民胜**：卧底在投票中被淘汰出局 → 该局立即结束，平民胜。
- **卧底胜**：场上存活玩家仅剩 **2** 人，且其中恰好 **1** 人为卧底 → 该局立即结束，卧底胜。

### 投票规则

- 每人每轮投票 **不可投自己**；可选择 **弃票**。
- **投票阶段时长**由房主配置，**默认 30 秒**；超时未提交视为 **弃票**。
- 若本轮计票后 **所有人都是弃票**（无人得票）：**无人出局**，进入下一轮发言/投票（游戏继续）。
- 得票统计、平票加赛仍按 `undercover-game-loop` 规格：平票时仅平票玩家加赛发言与互投；投票时长与全局配置一致。

### 会话与计分（多局）

- 房主设置 **总局数 1–10**：表示本房间会话内连续进行多**局**；每局独立抽词、独立胜负。
- **每局结束**时，按**该局**内玩家**被淘汰的先后顺序**分配 +0、+1、+2、…（仅加分）；**最后仍存活者**获得该局**最高档**分数；若该局结束时仍有**多名存活者**（例如卧底胜场剩 2 人），存活者**并列**获得该局最高档分数。
- **全部局数完成后**在工作间中部展示本会话排行榜并揭晓 MVP；局间玩家可随时查看当前累计榜（详见 `session-ranking`）。房主可 **重新开始游戏**。

### 系统词库

- 词对为中文常见「相近但不同」组合，便于描述与推理；来源为公开整理类资料与常见题库，已落盘为 JSON，可随运营再扩充。

---

## 技术栈（MVP 已定）

| 层级 | 选型 |
|------|------|
| 框架 | **Next.js 16**，**App Router** |
| 语言 | **TypeScript**（全仓严格模式） |
| 样式 | **Tailwind CSS 4** |
| UI 基座 | **[shadcn/ui](https://ui.shadcn.com/)**（基于 Radix + Tailwind；Button、Textarea、Dialog、Dropdown 等与 `design-ui` 令牌对齐）+ 其余 **Radix** 原语按需直连 |
| 图标 | **Lucide React** |
| 客户端状态 | **Jotai**（房间外档案、对局临时 UI 状态、与服务器状态的派生展示等） |
| 动效 | **Framer Motion**（阶段切换、抽屉/模态、倒计时与列表重排等；须遵守 `design-ui.md` 动效克制） |
| 头像生成 | **DiceBear**（`@dicebear/core` + `@dicebear/collection`，**Big Smile**） |
| ORM | **Prisma** |
| 数据库 | **PostgreSQL**，托管 **Neon** |
| 实时 | **WebSocket**（实现位置：Next Route + `ws`、或独立小服务，落地时在 tasks 中细化） |
| 国际化 | **next-intl**（推荐，与 App Router 配套）+ **`messages/zh.json` / `messages/en.json`**；路由 **`/zh/*`、`/en/*`**，**默认 `zh`**（简体中文） |
| 缓存 / Redis | **MVP 不使用** |
| **生产部署** | **Cloudflare Workers**，Next.js 经 **[OpenNext Cloudflare 适配器](https://opennext.js.org/cloudflare/get-started)**（`@opennextjs/cloudflare`）构建与发布；本地/CI 使用 **Wrangler**（**≥ 3.99.0**） |

环境变量示例：`DATABASE_URL` 指向 Neon 连接串；在 Workers 上访问 Neon 时须按 Cloudflare 文档使用 **Hyperdrive** 或等价连接策略（实现阶段在 `tasks` 与运维说明中写清）。

### 部署与 OpenNext（Cloudflare）

MVP 目标运行环境为 **Cloudflare**，Next.js **不得**假设仅传统 Node 服务器；构建与部署遵循官方指引：**[Get Started – OpenNext on Cloudflare](https://opennext.js.org/cloudflare/get-started)**。

- **依赖**：`@opennextjs/cloudflare`；开发依赖 **Wrangler**（版本满足官方要求）。
- **配置**：根目录 **`wrangler.jsonc`**（或官方推荐名）、**`open-next.config.ts`**（按需 R2 增量缓存等）、**`.dev.vars`**（如 `NEXTJS_ENV=development`）；**`package.json`** 增加官方建议脚本（例如 `preview` / `deploy`：`opennextjs-cloudflare build` + `preview`/`deploy`）。
- **构建产物**：将 **`.open-next`** 加入 **`.gitignore`**；按需配置 **`public/_headers`** 等静态资源缓存（见 OpenNext 文档）。
- **本地开发**：日常可用 **`next dev`**；若需在开发中使用 Cloudflare **bindings**，在 **`next.config`** 中按文档调用 **`initOpenNextCloudflareForDev`**（来自 `@opennextjs/cloudflare`）。可用 **`npm run preview`** 在 **Workers 运行时** 本地验真。
- **约束**：部署前 **移除** 源码中的 **`export const runtime = "edge"`**（[当前适配器下不支持该写法](https://opennext.js.org/cloudflare/get-started)）。从 **`@cloudflare/next-on-pages`** 迁移时按 OpenNext 文档卸载并替换 API。
- **新建项目（推荐，与官方一致）**：**不要**先用 `create-next-app` 再事后接入 OpenNext；应直接使用 Cloudflare 文档中的命令，一次性生成已配置 **OpenNext on Workers** 的 Next 应用，例如：  
  `npm create cloudflare@latest -- <app-name> --framework=next --platform=workers`  
  详见 [OpenNext – Cloudflare Get Started / New apps](https://opennext.js.org/cloudflare/get-started)。**已有**纯 Next 仓库时再用 `npx @opennextjs/cloudflare migrate` 等路径。

**WebSocket / 实时**：Workers 上长连接与 **Neon + Prisma** 的连接池策略须在实现时单独验证（多实例、冷启动、Hyperdrive）；若与单进程假设冲突，在架构备注中明确改造路径。

### 国际化与目录结构（须开局即落地）

- **语言枚举**：`zh`（简体中文）、`en`（英文）；禁止在 MVP 引入第三种语言路由段。
- **App Router**：页面置于 **`src/app/[locale]/`** 下，例如 `[locale]/page.tsx`（首页双态）、`[locale]/start/page.tsx`、`[locale]/r/[code]/page.tsx`（工作间）；**根 `src/app/page.tsx`** 仅负责 **重定向到默认 locale**（如 `/zh`）。
- **中间件**：`middleware.ts` 处理 locale 检测与 `next-intl` 路由匹配；可与 **`whoisspy_locale_v1`** 协同（策略：优先 URL，其次 cookie/localStorage 需在客户端二次对齐时文档化）。
- **文案**：键值 JSON，**禁止**在组件内散落中英双份字符串；服务端组件 `getTranslations` / 客户端 `useTranslations`。
- **与游戏数据**：`system-word-pairs.json` **不随 UI 语言切换而翻译**（MVP）；英文玩家仍见中文词对，见 `app-internationalization` 规格。

## 目标 / 非目标

**目标：** 私密房、系统词库、固定 1 卧底、胜负与投票规则可测；文字通道 + 可选 STT；多局会话榜与终局 MVP；首页双态与房主控制清晰。

**非目标（MVP）：** 实时语音/视频、Redis、自定义词组、准备阶段、云端 STT 必选项、**第三种界面语言**、**系统词库英文化**。

## 技术决策（架构）

### 1）游戏状态与文字消息

- 服务端权威状态机 + WebSocket 推送；描述消息经校验后广播。

### 2）发言鉴权（方案 A）

- 仅 `currentSpeaker` 在发言阶段可发送描述。

### 3）持久化

- 需要跨进程/重启可恢复的数据（房间码、对局状态、消息日志等）走 **Prisma + Neon**；热点状态若单机内存可先在 MVP 用进程内 Map，**规格上仍以可持久化为目标**，避免与「上云」部署矛盾。

### 4）可选 STT

- Web Speech API，本地识别，失败则仅键盘。

### 5）座位与发言顺序

- 加入顺序为座位号；**房主为创建者且占 1 号位**；发言按座位升序；平票加赛仅平票玩家、顺序按座位升序。

### 6）房间码

- 8 位：`W` + 7 位随机字母数字，活跃房间唯一。

## 风险与取舍

- 全弃票与平票组合需在实现中单测覆盖，避免状态机死锁。
- Neon 冷启动与连接数：注意 Prisma 连接池与 **serverless / Workers** 适配（**Hyperdrive** 等）；与 **OpenNext on Cloudflare** 组合时以官方数据库 How-To 为准。
- 无 Redis 时扩展多实例需改存共享存储或粘性会话；MVP 单实例可接受。
- **Cloudflare Workers** 上 **WebSocket** 与 OpenNext 路由的集成方式须在首次联调前定稿（Durable Objects、分离实时 Worker 或供应商方案等），避免与「Next 单容器」心智冲突。

## 迁移与发布计划

1. **`npm create cloudflare@latest -- <app> --framework=next --platform=workers`** 初始化工程（已含 OpenNext + Wrangler 基底），再接入 Tailwind 4、**shadcn**、**next-intl**、Prisma + Neon + **i18n** 路由。
2. 词库读取 `data/system-word-pairs.json`。
3. WebSocket + 状态机 + **可配置**投票/发言时长（默认 30s）。
4. 多局会话与计分、终局中部排行榜、**房主重新开始**。
5. **等待态 BGM**（`day.mp3` 循环）+ 短音效（开局/预警/局终等待资源）+ 可选 STT。
6. 核对 **`preview` / `deploy`**、**Hyperdrive**、**实时** 在 Workers 上联调（脚手架已覆盖大部分 OpenNext 配置时以 **补全与验证** 为主）。

## 待决问题

- MVP 同分：允许多 MVP 还是加赛规则？
- 房间码前缀 `W` 是否可环境配置？
- 非发言阶段是否增加隔离闲聊频道？
- **会话总局数默认值**最终取 3、5 或其它（须在实现前写入配置常量）。
