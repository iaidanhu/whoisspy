"use client";

import { createAvatar } from "@dicebear/core";
import { bigSmile } from "@dicebear/collection";
import { useMemo } from "react";

type Props = {
  seed: string;
  size?: number;
  className?: string;
};

export function AvatarBigSmile({ seed, size = 56, className }: Props) {
  const svg = useMemo(() => {
    const avatar = createAvatar(bigSmile, {
      seed,
      size,
    });
    return avatar.toString();
  }, [seed, size]);

  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-block" }}
      // DiceBear 输出为受控 SVG 字符串
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
