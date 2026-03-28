# 实时通道（SSE）与 Cloudflare / OpenNext

## 当前形态（MVP）

- 房间状态以 **HTTP GET** `/api/rooms/[code]` 拉取为主（含服务端状态机推进）。
- **Server-Sent Events**：`GET /api/rooms/[code]/stream`，事件载荷为 JSON（如 `{ "type": "room_refresh", "code": "…" }`），在发言/投票等写操作后由进程内 `room-bus` 广播。
- 客户端在 **`/[locale]/r/[code]`** 对局中建立 `EventSource`，**断线后指数退避重连**。

## 开发与生产 URL

- **本地开发**：`http://127.0.0.1:3000/api/rooms/<CODE>/stream`（与 Next dev 端口一致）。
- **生产**：与站点同源，例如 `https://<your-domain>/api/rooms/<CODE>/stream`（由 Cloudflare Workers + OpenNext 提供）。

## 限制与后续

- **SSE + 内存 bus** 仅在 **单 isolate / 单实例** 内可靠；多实例部署时，需改为 **Durable Objects**、**Queues** 或 **Redis Pub/Sub** 等共享广播层（与 OpenSpec 任务 2.3「MVP 无 Redis」一致，后续迭代）。
