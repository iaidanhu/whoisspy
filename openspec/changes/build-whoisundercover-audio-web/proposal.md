## 背景与动机

需要一款轻量、浏览器端的 **《谁是卧底》**（英文产品名：**Who Is Spy**）体验，**无需账号**即可开房、加入。当前项目尚未实现完整对局与多人房间能力，因此需要一份可直接落地的完整产品基线。

**命名与对外描述**（中文名、英文名、标语、README 用长描述等）及 **工程标识 `whoisspy`**（`package.json` / Wrangler 等）以仓库 **[`docs/project-meta.md`](../../../docs/project-meta.md)** 为准。

**MVP 策略**：以**文字交流为主**（发言阶段仅当前玩家可发描述），降低实时音视频实现成本；**可选**浏览器端 **STT** 辅助输入，服务端只处理文本。实时语音、视频后续迭代。

## 变更内容

- 工程 **由 Cloudflare 官方脚手架创建**（**`npm create cloudflare@latest -- <app> --framework=next --platform=workers`**，见 [OpenNext Cloudflare – New apps](https://opennext.js.org/cloudflare/get-started)），**不**采用「先 `create-next-app` 再兼容 OpenNext」；在此基础上构建 **Next.js（App Router）+ TypeScript + Tailwind CSS 4** 的 PC/H5 页面；UI 用 **[shadcn/ui](https://ui.shadcn.com/)**（Radix + Tailwind）+ **Lucide React**，客户端状态 **Jotai**，动效 **Framer Motion**，头像 **DiceBear**（Big Smile）；仅私密房间。
- **入口双态**：**`/[locale]/`** — **无有效 `whoisspy_profile_v1`** 时展示契约风登记（参考 **`docs/images/home.png`**）：昵称、**DiceBear [Big Smile](https://www.dicebear.com/styles/big-smile/)**（**npm**：`@dicebear/core` + `@dicebear/collection`）；**未点选头像**则「下一步」时**随机默认 seed**；**指纹主按钮**写入档案并进入 **`/[locale]/start`**。**已有档案**时 **不**再首屏契约登记，**直接进入** **`/[locale]/start`**（加入 / 创建；可另提供改资料入口回契约页）。
- **`/[locale]/start`**：**加入房间**（输入房间码 → 确定 → **`/[locale]/r/[code]`**）、**创建房间**（成功后 **直接进入** 同一工作间；创建者 = 房主 = **1 号位**）。**同色纸感**（`design-ui.md` §2.1）；**界面文案 i18n**。
- 工作间 **`/[locale]/r/[code]`** 内用状态切换等待 / 对局 / 终局榜；**仅房主**可见顶栏 **游戏设置**（各项有默认值可不设）与 **开始游戏**（人数等条件不满足则禁用）；根 **`/`** 重定向默认语言。
- 无登录加入，会话内身份为 `displayName` + `avatarSeed`；**无「准备」阶段**。
- **对局 UI** 仍以 **`docs/images/image.png`** 为基准（暖深底、金强调、双列玩家、FAB 等）。
- **MVP**：**WebSocket** 同步游戏状态 + 服务端鉴权后的文字广播；不含实时语音/视频。
- **发言阶段（方案 A）**：仅当前轮到发言的玩家可发本轮描述文本；**UI** 侧栏高亮当前发言人，**中部舞台**展示其大图头像与已发文字（对齐 **`docs/images/image.png`**）；轮到自己时中部为 **shadcn Textarea**：**Enter 发送、Shift+Enter 换行**，**麦克风转写**填入同一区域，发送后结束本轮本人发言。
- **可选**：Web Speech API 本地听写 → 填入 Textarea → 用户确认发送。
- **词组**：仅使用**全局系统词库**（见仓库 `data/system-word-pairs.json`），**取消**房主自定义词组。
- **卧底人数**：每局固定 **1 名**卧底，不随人数变化。
- **胜负**：卧底被淘汰则平民胜，**该局**结束；若场上仅剩 **2** 人且其中 **1** 人为卧底，则卧底胜，**该局**结束。
- **会话局数**：房主配置 **1–10 局**（连续多局，非单局内的发言轮次计数）；每**局**结束按该局淘汰顺序计分并累计；**全部局数完成后**揭晓本会话 MVP。
- **投票**：不可投自己；可主动弃票；**投票阶段时长默认 30 秒**（房主可在游戏设置中修改），超时视为弃票；平票加赛同配置；若**所有人**均为弃票，则**本轮无人出局**，进入下一轮发言/投票流程。
- **发言阶段时长默认 30 秒**，房主可改（与投票同在设置中）。
- 平票加赛等规则见 `undercover-game-loop` 规格。
- **等待开局 BGM**：循环播放仓库 **[`docs/audio/day.mp3`](../../../docs/audio/day.mp3)**（实现时同步到 `public` 等可请求路径）；开局后停止/淡出；声音开关见 `design-ui`。
- **短音效**：投票、发言倒计时与超时、「请 N 号发言」等；**开局瞬间、临超时、单局/会话结束** 规划独立音效，**资源待定**，规格已占位（见 `room-text-channel`）。
- **国际化（MVP）**：**简体中文** + **英文**；URL 语言前缀（如 `/zh`、`/en`）、文案集中管理、语言偏好持久化；**游戏词库仍为中文内容**，英文界面不强制翻译词对（见 `app-internationalization` 规格）。

## 能力范围（Capabilities）

### 新增能力

- `private-room-lifecycle`：8 位房间码、私密创建/加入、房主设置（含局数 1–10）、座位与加入顺序；**仅系统词库**。
- `room-text-channel`：发言阶段受限文字、可选 STT、音效。
- `undercover-game-loop`：固定 1 卧底、胜负条件、投票规则（**默认可配置时长，默认 30s**、禁投自己、全弃票不出局）、平票加赛、无准备阶段。
- `session-ranking`：本会话内多局累计分、每局结束更新、局间可查看榜；**全部局完成后工作间中部排行榜**；**房主可重新开始游戏**（同房新会话）。
- `app-internationalization`：双语 UI、`[locale]` 路由结构、文案文件、语言切换与持久化；与词库内容解耦。

### 变更的既有能力

- 已废弃：房主自定义词组、准备阶段、投票时长未定的描述。

## 影响面

- **前端**：Next.js 16、TypeScript、Tailwind 4、**shadcn/ui**、Lucide、Jotai、Framer Motion、DiceBear；**next-intl**（或等价）与 **`app/[locale]/...` 结构**；WebSocket 客户端、音效；**UI 须遵循 `design-ui.md`**（`home.png` + `image.png`）。
- **部署**：**Cloudflare Workers** + **[OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started)**（`@opennextjs/cloudflare`、Wrangler）。
- **后端**：Next 内 API / Route Handlers 或独立实时服务（实现时定），**Prisma + PostgreSQL（Neon）** 持久化房间与对局需要落库的数据；与 Workers 组合时按 Cloudflare 数据库指引配置连接。
- **数据**：全局词库文件 `data/system-word-pairs.json`（可逐步扩充）。
- **MVP 不引入**：Redis、WebRTC/SFU、自定义词组、准备阶段逻辑。

## 部署目标

- **生产环境**：**Cloudflare Workers**；新建应用通过 **`npm create cloudflare@latest … --framework=next --platform=workers`** 与 **[OpenNext on Cloudflare](https://opennext.js.org/cloudflare/get-started)** 对齐；`@opennextjs/cloudflare`、**Wrangler**、构建脚本与约定以官方文档为准并在 `tasks` 中核对。**已有**非脚手架项目再用 **`npx @opennextjs/cloudflare migrate`**。
