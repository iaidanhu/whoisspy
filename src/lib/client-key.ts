export const WHOISSPY_CLIENT_KEY = "whoisspy_client_v1";

export function getOrCreateClientKey(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    let k = localStorage.getItem(WHOISSPY_CLIENT_KEY);
    if (!k || k.length < 8) {
      k = crypto.randomUUID();
      localStorage.setItem(WHOISSPY_CLIENT_KEY, k);
    }
    return k;
  } catch {
    return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
