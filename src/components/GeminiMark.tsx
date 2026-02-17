import React from "react";

interface GeminiMarkProps {
  className?: string;
}

export default function GeminiMark({ className = "text-base" }: GeminiMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex items-center justify-center font-bold leading-none",
        className,
      ].join(" ")}
    >
      {"\u264A"}
    </span>
  );
}
