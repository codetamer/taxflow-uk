'use client';

import React from 'react';

export interface TaxFlowLogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | number;
  withTagline?: boolean;
  className?: string;
}

export function TaxFlowLogo({
  variant = 'compact',
  theme = 'dark',
  size = 'md',
  withTagline = false,
  className = ''
}: TaxFlowLogoProps) {
  // Size metrics
  const iconDimensions = {
    sm: { icon: 28, height: 28 },
    md: { icon: 36, height: 36 },
    lg: { icon: 44, height: 44 }
  };

  const dim = typeof size === 'number' ? { icon: size, height: size } : (iconDimensions[size] || iconDimensions.md);

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-stone-950';
  const flowColor = isDark ? 'text-amber-400' : 'text-orange-600';
  const badgeBg = isDark ? 'bg-stone-800/90 border-stone-700 text-amber-400' : 'bg-stone-100 border-stone-200 text-orange-600';
  const taglineColor = isDark ? 'text-stone-400' : 'text-stone-500';

  // Concept 5: The Ledger Chevron & Ascending Pillar (Kinetic Balance)
  const IconMark = () => (
    <svg
      width={dim.icon}
      height={dim.icon}
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform group-hover:scale-105"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tf_grad_bar1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#EA580C" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container */}
      <rect
        width="76"
        height="76"
        rx="20"
        fill={isDark ? '#292524' : '#F5F5F4'}
        stroke={isDark ? '#44403C' : '#E7E5E4'}
        strokeWidth="2"
      />

      {/* Tier 1: Turnover Bar */}
      <rect x="11" y="16" width="54" height="10" rx="5" fill="url(#tf_grad_bar1)" />

      {/* Tier 2: Deductions Bar (Offset Ledger Pillar) */}
      <rect x="22" y="32" width="43" height="10" rx="5" fill="#F59E0B" opacity="0.9" />

      {/* Tier 3: Retained Earnings / Core Profit */}
      <rect x="22" y="48" width="28" height="10" rx="5" fill="#D97706" opacity="0.75" />

      {/* Kinetic Forward Chevron (Growth & Balance) */}
      <path
        d="M58 48 L66 53 L58 58"
        stroke="#F59E0B"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <IconMark />;
  }

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <IconMark />
      <div className="flex flex-col text-left">
        <div className="flex items-center space-x-2">
          <span className={`font-extrabold tracking-tight text-base sm:text-lg leading-tight ${textColor}`}>
            Tax<span className={flowColor}>Flow</span>
          </span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold border ${badgeBg}`}>
            UK
          </span>
        </div>
        {(variant === 'full' || withTagline) && (
          <span className={`text-[10px] tracking-wide font-normal -mt-0.5 ${taglineColor}`}>
            Statutory Accounts &amp; CT600
          </span>
        )}
      </div>
    </div>
  );
}

export default TaxFlowLogo;

