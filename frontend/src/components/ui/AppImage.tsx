'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

interface AppImageProps extends Omit<ImageProps, 'alt'> {
  alt?: string;
}

export default function AppImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  ...props
}: AppImageProps) {
  if (!src) return null;

  return (
    <Image src={src} alt={alt} width={width} height={height} className={className} {...props} />
  );
}
