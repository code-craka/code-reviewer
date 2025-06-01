// components/ui/PlaceholderImage.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  text?: string;
  width?: number;
  height?: number;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  className?: string;
  rounded?: boolean;
  initials?: boolean;
}

/**
 * A component that generates a placeholder image with customizable text, size, and colors.
 * This replaces static placeholder.svg references to avoid 404 errors.
 */
export function PlaceholderImage({
  text = 'Placeholder',
  width = 100,
  height = 100,
  bgColor = '#e2e8f0',
  textColor = '#64748b',
  fontSize = 14,
  className,
  rounded = false,
  initials = false,
}: PlaceholderImageProps) {
  // If initials mode is enabled, extract initials from the text
  const displayText = initials 
    ? text
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : text;

  // Calculate font size based on the container size if not specified
  const calculatedFontSize = fontSize || Math.min(width, height) * 0.2;
  
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(rounded ? 'rounded-full' : 'rounded-md', className)}
      data-testid="placeholder-image"
    >
      <rect width={width} height={height} fill={bgColor} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
        fontSize={calculatedFontSize}
        fontWeight={initials ? 'bold' : 'normal'}
      >
        {displayText}
      </text>
    </svg>
  );
}

export default PlaceholderImage;
