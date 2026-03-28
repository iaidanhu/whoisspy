/**
 * 单进程内 SSE 推送（多实例 / 多 isolate 不互通，与 design MVP 一致，后续可换 DO / Redis）。
 * 部署与 URL 说明见 `docs/realtime-cloudflare.md`。
 */
type Listener = (payload: string) => void;

const byCode = new Map<string, Set<Listener>>();

export function roomBusSubscribe(code: string, listener: Listener): () => void {
  let set = byCode.get(code);
  if (!set) {
    set = new Set();
    byCode.set(code, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) byCode.delete(code);
  };
}

export function roomBusEmitRoomRefresh(code: string): void {
  const set = byCode.get(code);
  if (!set) return;
  const payload = JSON.stringify({ type: "room_refresh", code });
  for (const l of set) {
    try {
      l(payload);
    } catch {
      /* ignore */
    }
  }
}
