import React from 'react';
import { iconNodes } from '../vanilla/icons.js';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, className = 'w-4 h-4', size = 24, ...props }) => {
  if (!name) return null;
  const key = name in iconNodes ? name : (name.toLowerCase() in iconNodes ? name.toLowerCase() : null);
  const node = key ? ((iconNodes as unknown as Record<string, [string, Record<string, string>][]>)[key]) : null;

  if (!node) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {node.map(([tag, attrs], index) => {
        const { key, ...rest } = attrs || {};
        return React.createElement(tag, { key: key || index, ...rest });
      })}
    </svg>
  );
};

export default Icon;
