/**
 * MVP 架构约束（OpenSpec design / tasks §2.3）
 *
 * - 不使用 Redis；房间与对局热点状态可先依赖单实例进程内内存 + DB。
 * - 多 Workers / 多实例部署时需引入共享存储、Durable Objects 或粘性会话等改造。
 */

export const MVP_USES_REDIS = false;
