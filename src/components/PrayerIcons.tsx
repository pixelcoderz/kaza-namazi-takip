import React from 'react';
import { PrayerKey } from '../types/kaza';

export const PrayerIcon: React.FC<{ type: PrayerKey | 'oruc'; size?: number }> = ({
  type,
  size = 26
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (type) {
    case 'sabah':
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <path d="M5.6 6.6l2.1 2.1" />
          <path d="M18.4 6.6l-2.1 2.1" />
          <path d="M4 15h16" />
          <path d="M7 15a5 5 0 0 1 10 0" />
          <path d="M6 19h12" />
        </svg>
      );
    case 'ogle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5" />
          <path d="M12 19.5V22" />
          <path d="M4.9 4.9l1.8 1.8" />
          <path d="M17.3 17.3l1.8 1.8" />
          <path d="M2 12h2.5" />
          <path d="M19.5 12H22" />
          <path d="M4.9 19.1l1.8-1.8" />
          <path d="M17.3 6.7l1.8-1.8" />
        </svg>
      );
    case 'ikindi':
      return (
        <svg {...common}>
          <path d="M11 4v2" />
          <path d="M5.5 6.5l1.4 1.4" />
          <path d="M16.5 6.5l-1.4 1.4" />
          <path d="M8 12a3.5 3.5 0 0 1 6.4-1.8" />
          <path d="M7 18h9.5a3 3 0 0 0 .4-5.97A4.2 4.2 0 0 0 8.7 13a2.5 2.5 0 0 0-1.7 5Z" />
        </svg>
      );
    case 'aksam':
      return (
        <svg {...common}>
          <path d="M4 14h16" />
          <path d="M7.5 14a4.5 4.5 0 0 1 9 0" />
          <path d="M5 17.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
          <path d="M12 5v3" />
        </svg>
      );
    case 'yatsi':
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a7.5 7.5 0 1 0 10.5 10.5Z" />
        </svg>
      );
    case 'vitir':
      return (
        <svg {...common}>
          <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7 7 0 1 0 9.5 9.5Z" />
          <path d="M16.5 4.5v2" />
          <path d="M15.5 5.5h2" />
          <path d="M19.5 8.5v1.5" />
          <path d="M18.75 9.25h1.5" />
        </svg>
      );
    case 'oruc':
      return (
        <svg {...common}>
          <path d="M12 2v2" />
          <path d="M8 6h8l1 4-1.5 8h-7L7 10l1-4Z" />
          <path d="M7 20h10" />
          <path d="M12 10v4" />
        </svg>
      );
  }
};

export const MosqueSilhouette: React.FC = () => (
  <svg
    viewBox="0 0 400 130"
    fill="currentColor"
    style={{ width: '100%', maxWidth: '420px', height: 'auto' }}
    aria-hidden="true"
  >
    {/* Left Minaret */}
    <rect x="44" y="42" width="14" height="88" />
    <polygon points="41,42 51,18 61,42" />
    <rect x="40" y="54" width="22" height="4" />
    {/* Right Minaret */}
    <rect x="342" y="42" width="14" height="88" />
    <polygon points="339,42 349,18 359,42" />
    <rect x="338" y="54" width="22" height="4" />
    {/* Side Domes */}
    <path d="M90 130V88c0-20 20-34 40-34s40 14 40 34v42H90z" />
    <path d="M230 130V88c0-20 20-34 40-34s40 14 40 34v42H230z" />
    {/* Main Central Dome */}
    <path d="M140 130V78c0-32 26-54 60-54s60 22 60 54v52H140z" />
    {/* Alem / Crescent */}
    <rect x="198.5" y="10" width="3" height="15" />
    <circle cx="200" cy="8" r="4" />
  </svg>
);
