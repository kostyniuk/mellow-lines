"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemedVideoProps {
  darkSrc: string;
  lightSrc: string;
  className?: string;
}

export function ThemedVideo({ darkSrc, lightSrc, className }: ThemedVideoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = mounted && resolvedTheme === "light" ? lightSrc : darkSrc;

  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className={className}
    />
  );
}
