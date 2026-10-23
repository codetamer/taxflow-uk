'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Check } from 'lucide-react';

interface ComplianceScoreRingProps {
  totalChecks?: number;
  passedCount: number;
  fatalCount: number;
  warnCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ComplianceScoreRing({
  totalChecks = 40,
  passedCount,
  fatalCount,
  warnCount,
  size = 'md'
}: ComplianceScoreRingProps) {
  const isAllPassed = fatalCount === 0;
  const radius = size === 'sm' ? 18 : size === 'lg' ? 44 : 28;
  const strokeWidth = size === 'sm' ? 3.5 : size === 'lg' ? 6 : 4.5;
  const circumference = 2 * Math.PI * radius;
  const passRatio = Math.min(1, Math.max(0, passedCount / totalChecks));
  const strokeDashoffset = circumference - passRatio * circumference;

  const svgDimensions = (radius + strokeWidth) * 2;

  return (
    <div className="flex items-center space-x-3">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={svgDimensions}
          height={svgDimensions}
          className="transform -rotate-90 transition-all duration-500 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />

          {/* Progress stroke */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            className={isAllPassed ? 'text-emerald-500' : 'text-amber-500'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>

        {/* Center Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isAllPassed ? (
            <Check className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-600 stroke-[3]`} />
          ) : (
            <span className={`font-mono font-bold ${size === 'sm' ? 'text-[9px]' : 'text-xs'} text-amber-700`}>
              {fatalCount}
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900">
          <span>{passedCount}/{totalChecks} Gateway Rules Verified</span>
          {isAllPassed ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              PASSED
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-800 font-bold">
              {fatalCount} FATAL
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          {isAllPassed
            ? 'Automated statutory mathematical verification across all accounts boxes.'
            : `${fatalCount} error${fatalCount > 1 ? 's' : ''} must be resolved before submission.`}
        </p>
      </div>
    </div>
  );
}
