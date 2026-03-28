import type { WordPair } from "@/domain/types";
import pairs from "../../data/system-word-pairs.json";

const list = pairs as WordPair[];

export function getAllWordPairs(): WordPair[] {
  return list;
}

export function pickRandomWordPair(): WordPair {
  const i = Math.floor(Math.random() * list.length);
  return list[i]!;
}
