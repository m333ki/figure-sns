"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";

export default function PostImage({
  src,
  alt,
  sizes,
  maxHeight = 640,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  maxHeight?: number;
  className?: string;
}) {
  const [ratio, setRatio] = useState<number | null>(null);

  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
      style={{ aspectRatio: ratio ?? 3 / 4, maxHeight }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain"
        onLoad={handleLoad}
      />
    </div>
  );
}
