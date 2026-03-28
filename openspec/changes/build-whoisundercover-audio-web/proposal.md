## 背景与动机

需要一款轻量、浏览器端的 **《谁是卧底》**（英文产品名：**Who Is Spy**）体验，**无需账号**即可开房、加入。当前项目尚未实现完整对局与多人房间能力，因此需要一份可直接落地的完整产品基线。

**命名与对外描述**（中文名、英文名、标语、README 用长描述等）以仓库 **[`docs/project-meta.md`](../../../docs/project-meta.md)** 为准。

**MVP 策略**：以**文字交流为主**（发言阶段仅当前玩家可发描述），降低实时音视频实现成本；**可选**浏览器端 **STT** 辅助输入，服务端只处理文本。实时语音、视频后续迭代。

## 变更内容

- 构建 **Next.js 16（App Router）+ TypeScript + Tailwind CSS 4** 的 PC/H5 响应式页面；UI 用 **Radix UI + Lucide React**，客户端状态 **Jotai**，动效 **Framer Motion**，头像 **DiceBear**（Big Smile）；仅私密房间。
- **两步入口**：**`/[locale]/`** 契约风首页（参考 **`docs/images/home.png`**），`locale`∈{`zh`,`en`}；填写昵称、选择 **DiceBear [Big Smile](https://www.dicebear.com/styles/big-smile/)**（**npm**：`@dicebear/core` + `@dicebear/collection`）；**未点选头像**则「下一步」时**随机默认 seed**；**指纹主按钮**进入 **`/[locale]/start`**；该页仅 **加入房间** / **开房间**，**同色纸感**（`design-ui.md` §2.1）；**界面文案 i18n**。
- 档案写入 **localStorage**，再次访问 **`/[locale]/`** 预填；根 **`/`** 重定向默认语言。
- 无登录加入，会话内身份为 `displayName` + `avatarSeed`；**无「准备」阶段**。
- **对局 UI** 仍以 **`docs/images/image.png`** 为基准（暖深底、金强调、双列玩家、FAB 等）。
- **MVP**：**WebSocket** 同步游戏状态 + 服务端鉴权后的文字广播；不含实时语音/视频。
- **发言阶段（方案 A）**：仅当前轮到发言的玩家可发本轮描述文本。
- **可选**：Web Speech API 本地听写 → 填入输入框 → 用户确认发送。
- **词组**：仅使用**全局系统词库**（见仓库 `data/system-word-pairs.json`），**取消**房主自定义词组。
- **卧底人数**：每局固定 **1 名**卧底，不随人数变化。
- **胜负**：卧底被淘汰则平民胜，**该局**结束；若场上仅剩 **2** 人且其中 **1** 人为卧底，则卧底胜，**该局**结束。
- **会话局数**：房主配置 **1–10 局**（连续多局，非单局内的发言轮次计数）；每**局**结束按该局淘汰顺序计分并累计；**全部局数完成后**揭晓本会话 MVP。
- **投票**：不可投自己；可主动弃票；**投票阶段时长 8 秒**，超时视为弃票；若**所有人**均为弃票，则**本轮无人出局**，进入下一轮发言/投票流程。
- 平票加赛等规则见 `undercover-game-loop` 规格。
- 局内音效：投票、发言倒计时与超时、「请 N 号发言」等。
- **国际化（MVP）**：**简体中文** + **英文**；URL 语言前缀（如 `/zh`、`/en`）、文案集中管理、语言偏好持久化；**游戏词库仍为中文内容**，英文界面不强制翻译词对（见 `app-internationalization` 规格）。

## 能力范围（Capabilities）

### 新增能力

- `private-room-lifecycle`：8 位房间码、私密创建/加入、房主设置（含局数 1–10）、座位与加入顺序；**仅系统词库**。
- `room-text-channel`：发言阶段受限文字、可选 STT、音效。
- `undercover-game-loop`：固定 1 卧底、胜负条件、投票规则（8 秒、禁投自己、全弃票不出局）、平票加赛、无准备阶段。
- `session-ranking`：本会话内多局累计分、每局结束更新、局间可查看榜、全部局结束后 MVP。
- `app-internationalization`：双语 UI、`[locale]` 路由结构、文案文件、语言切换与持久化；与词库内容解耦。

### 变更的既有能力

- 已废弃：房主自定义词组、准备阶段、投票时长未定的描述。

## 影响面

- **前端**：Next.js 16、TypeScript、Tailwind 4、Radix、Lucide、Jotai、Framer Motion、DiceBear；**next-intl**（或等价）与 **`app/[locale]/...` 结构**；WebSocket 客户端、音效；**UI 须遵循 `design-ui.md`**（`home.png` + `image.png`）。
- **后端**：Next 内 API / Route Handlers 或独立实时服务（实现时定），**Prisma + PostgreSQL（Neon）** 持久化房间与对局需要落库的数据。
- **数据**：全局词库文件 `data/system-word-pairs.json`（可逐步扩充）。
- **MVP 不引入**：Redis、WebRTC/SFU、自定义词组、准备阶段逻辑。
