import React from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  text?: string;
  width?: number;
  height?: number;
  textColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function PlaceholderImage({
  text = '',
  width = 60,
  height = 60,
  textColor = 'white',
  backgroundColor = '#6b7280', // gray-500
  className,
}: PlaceholderImageProps) {
  // Convert hex color to RGB for SVG
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    return result
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '107,114,128'; // Default gray-500
  };

  // Generate SVG data URI
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="rgb(${hexToRgb(backgroundColor)})"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="${textColor}" 
        font-family="system-ui, sans-serif" 
        font-weight="bold" 
        font-size="${Math.min(width, height) / 3}px"
      >
        ${text}
      </text>
    </svg>
  `;

  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent.trim())}`;

  return (
    <img
      src={dataUri}
      alt={text || "Placeholder"}
      width={width}
      height={height}
      className={cn("rounded", className)}
    />
  );
}
