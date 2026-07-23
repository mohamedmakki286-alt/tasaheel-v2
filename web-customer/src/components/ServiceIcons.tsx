import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export function OilChangeIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8h20v6H14V8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14h24v4c0 8-4 16-12 20-8-4-12-12-12-20v-4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 20v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 20v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="17" r="1.5" fill="currentColor"/>
    </svg>
  );
}

export function BatteryIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M36 22h4a2 2 0 012 2v0a2 2 0 01-2 2h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 22l4 5h-3l4 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 22l-4 5h3l-4 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function TireIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
      <path d="M24 6v11M24 31v11M6 24h11M31 24h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function InspectionIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M16 16h16M16 22h12M16 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M17 34l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ACIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4v4M24 40v4M4 24h4M40 24h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 10l3 3M35 35l3 3M10 38l3-3M35 13l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M20 24h8M24 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function ElectricIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M28 4L12 26h12L20 44l16-22H24L28 4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WashIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28c0-8 8-16 16-16s16 8 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 28h32v4a4 4 0 01-4 4H12a4 4 0 01-4-4v-4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 12v-4M24 10v-4M30 12v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <circle cx="16" cy="32" r="1" fill="currentColor" opacity="0.4"/>
      <circle cx="24" cy="33" r="1" fill="currentColor" opacity="0.4"/>
      <circle cx="32" cy="32" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}

export function TowIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="18" width="24" height="12" rx="2" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M28 22h8l6 6v2h-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="34" r="3" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="36" cy="34" r="3" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M28 28l-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  );
}
