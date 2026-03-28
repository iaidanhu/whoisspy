# 项目基础信息（命名与描述）

本文档为仓库内 **产品命名、简介、关键词** 的单一事实来源；实现时 App 标题、`metadata`、应用商店文案、README 头部等应与此对齐或由此衍生。

---

## 推荐方案（默认采用）

| 字段 | 内容 |
|------|------|
| **中文名** | 谁是卧底 |
| **英文名** | **Who Is Spy**（游戏品类常用译法；勿写作 *Who Is Undercover* 作主品牌，易冗长） |
| **对外一句（中文）** | 线上私密房间，文字发言与投票，找出卧底。 |
| **对外一句（英文）** | Private rooms, text clues and votes — find the spy. |
| **工程/项目标识（canonical）** | **`whoisspy`** — `package.json` 的 `name`、Wrangler `name`、仓库子目录（如 `apps/whoisspy`）、资源前缀等 **一律以此为准**。**勿**用 `whois` 作为项目名（易与泛词混淆）。本地父文件夹叫 `whois` 仅历史路径，**不**代表产品标识。 |
| **对外 URL slug（可选）** | `who-is-spy`（若营销页需要带连字符的可读路径，可与 `whoisspy` 并存） |
| **包名示例** | `whoisspy` 或 `@your-scope/whoisspy` |
| **Logo 字标（界面顶栏等）** | 固定 **`Who Is Spy`**（拉丁字标，**不因**界面语言切换而改为中文或其他译法；可与图标组合） |

### 副标题 / 标语（可选用）

- 中文：**签下名字，入局推理。**（与契约首页气质一致）
- 英文：**Sign in. Speak. Suspect.**

### 较长描述（README / 商店）

**中文**  
谁是卧底（Who Is Spy）的网页版：无需账号，浏览器内创建或加入私密房间，使用系统词库发词；玩家以文字依次描述、限时投票淘汰，直至平民胜或卧底胜。支持中英文界面，头像使用 DiceBear Big Smile 风格。

**English**  
A browser-based **Who Is Spy** party game: no account required. Create or join a private room, get words from the built-in Chinese word pairs, take turns describing in text, then vote within a time limit until civilians win or the spy wins. UI in Simplified Chinese and English; avatars via DiceBear Big Smile.

### 关键词（SEO / 话题）

- 中文：谁是卧底、聚会游戏、线上桌游、文字推理、私密房间  
- English: who is spy, party game, social deduction, browser game, private room  

---

## 命名备选（若需更「品牌感」）

| 类型 | 示例 | 说明 |
|------|------|------|
| 缩写品牌 | **WISP**（Who **I**s **SP**y） | 短、好记；需在界面解释全称一次 |
| 意象 + 游戏名 | **Ink & Spy** / **纸墨卧底** | 偏文创；与契约纸感 UI 契合，但认知成本高 |
| 直给域名风 | **whoisspy.game** | 若未来买域名可用作对外主站名 |

**不建议**：`who-is`（语义不完整）、`undercover-only`（与「卧底」常见译法混用易搜不到）。

---

## 与 OpenSpec 变更的关系

当前变更目录名仍为历史命名 `build-whoisundercover-audio-web`；**产品对外名称**与 **工程标识 `whoisspy`** 以本文档为准。若归档或重命名变更，可改为 `build-whoisspy-web` 等与项目标识一致。

---

## AI 开发与协作（Skills）

维护者在 Cursor / Agent 环境中配置了 **大量全局 Skills**，用于加速实现、设计与调试。在本仓库工作时，**建议 Agent 按任务主动选用**相关 Skill，而非仅依赖默认通用回答，例如：

- **界面与视觉**：`frontend-design`、`ui-ux-pro-max`、`web-design-guidelines`、`polish`、`harden`、`adapt` 等（与 `design-ui.md`、shadcn 实现相关时优先）。
- **React / Next 性能与模式**：`vercel-react-best-practices`（编写或审查客户端组件、数据获取时）。
- **浏览器侧调试与验收**：使用 **agent-browser**（或等价浏览器自动化 Skill）做交互验证、回归关键流程。

具体 Skill 路径以当前 Cursor / `.agents/skills` 配置为准；新增能力可用 `find-skills` 类 Skill 检索。实现 **localStorage** 键名须与 OpenSpec 一致：**`whoisspy_profile_v1`**、**`whoisspy_locale_v1`**。
