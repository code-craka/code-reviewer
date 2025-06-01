'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  text?: string;
  width?: number;
  height?: number;
  rounded?: boolean;
  initials?: boolean;
  className?: string;
  bgColor?: string;
  textColor?: string;
}

export default function PlaceholderImage({
  text = '',
  width = 64,
  height = 64,
  rounded = false,
  initials = false,
  className = '',
  bgColor = '#e2e8f0', // Default light gray background
  textColor = '#475569', // Default slate text color
}: PlaceholderImageProps) {
  // If initials is true, extract initials from text
  // Otherwise use the text as is
  const displayText = initials && text ? 
    text.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2) : 
    text;

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden bg-muted',
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
        color: textColor,
        fontSize: `${Math.min(width, height) * 0.4}px`,
        fontWeight: 'bold',
      }}
      aria-label="Placeholder image"
    >
      {displayText}
    </div>
  );
}
