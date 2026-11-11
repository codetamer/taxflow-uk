'use client';

import React from 'react';
import { Check, AlertTriangle, AlertCircle } from 'lucide-react';

export interface ComplianceScoreRingProps {
  totalChecks?: number;
  passedCount: number;
  fatalCount: number;
  warnCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  theme?: 'light' | 'dark';
}

export function ComplianceScoreRing({
  totalChecks = 40,
  passedCount,
  fatalCount,
  warnCount = 0,
  size = 'md',
  showLabel = false,
  theme = 'light'
}: ComplianceScoreRingProps) {
  const isAllPassed = fatalCount === 0;

  // Symmetrical Geometry
  const radius = size === 'xs' ? 14 : size === 'sm' ? 18 : size === 'lg' ? 36 : 24;
  const strokeWidth = size === 'xs' ? 3 : size === 'sm' ? 3.5 : size === 'lg' ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const passRatio = totalChecks > 0 ? Math.min(1, Math.max(0, passedCount / totalChecks)) : 1;
  const strokeDashoffset = circumference - passRatio * circumference;
  const svgDimensions = (radius + strokeWidth) * 2;

  // High-contrast, theme-aware palette
  const trackColor = theme === 'dark' ? 'text-slate-700/60' : 'text-slate-200/80';
  const progressColor = isAllPassed
    ? 'text-emerald-500'
    : fatalCount > 0
    ? 'text-rose-500'
    : 'text-amber-500';

  const ringElement = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={svgDimensions}
        height={svgDimensions}
        className="transform -rotate-90 transition-all duration-500 ease-out"
        aria-hidden="true"
      >
        {/* Background Track */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          className={trackColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />

        {/* Progress Fill */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          className={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>

      {/* Symmetrical Center Indicator */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
        {isAllPassed ? (
          <Check
            className={`${
              size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            } text-emerald-500 stroke-[3]`}
          />
        ) : fatalCount > 0 ? (
          <AlertTriangle
            className={`${
              size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'
            } ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'} stroke-[2.5]`}
          />
        ) : (
          <AlertCircle
            className={`${
              size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'
            } ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} stroke-[2.5]`}
          />
        )}
      </div>
    </div>
  );

  if (!showLabel) {
    return ringElement;
  }

  return (
    <div className="flex items-center space-x-3.5">
      {ringElement}
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {passedCount}/{totalChecks} Checks Verified
          </span>
          {isAllPassed ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase tracking-wider">
              Ready
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold uppercase tracking-wider">
              {fatalCount} {fatalCount === 1 ? 'Error' : 'Errors'}
            </span>
          )}
        </div>
        <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {isAllPassed
            ? 'Fully verified against statutory gateway schemas.'
            : `${fatalCount} blocking issue${fatalCount > 1 ? 's' : ''} to resolve.`}
        </p>
      </div>
    </div>
  );
}
