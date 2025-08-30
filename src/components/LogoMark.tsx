import React from 'react';

type Props = {
  size?: number;
  className?: string;
};

// Simple gradient logomark (SVG) that works on light/dark.
const LogoMark: React.FC<Props> = ({ size = 28, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="BudgetPro logo"
  >
    <defs>
      <linearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#gp)" />
    <path d="M20 38c0 6.627 5.373 12 12 12s12-5.373 12-12V26c0-2.209-1.791-4-4-4H24c-2.209 0-4 1.791-4 4v12z" fill="#fff" opacity="0.9" />
    <path d="M28 24c0-3.314 2.686-6 6-6 2.21 0 4 1.79 4 4v2H28z" fill="#fff" opacity="0.85" />
  </svg>
);

export default LogoMark;

