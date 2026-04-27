import React from 'react';

type IconProps = { size?: number; stroke?: number; className?: string; style?: React.CSSProperties };

const make = (path: React.ReactNode) =>
  function Icon({ size = 20, stroke = 1.75, className, style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
      >
        {path}
      </svg>
    );
  };

export const IconCheck = make(<path d="M5 12l5 5 9-11" />);
export const IconX = make(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>);
export const IconBell = make(<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>);
export const IconStore = make(<><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 22v-7h6v7" /></>);
export const IconScooter = make(
  <>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.5 17h7" />
    <path d="M15 17l-1.5-9h-3" />
    <path d="M13.5 8h3.5" />
  </>,
);
export const IconGift = make(
  <>
    <rect x="3" y="8" width="18" height="13" rx="1" />
    <path d="M12 8v13" />
    <path d="M21 12H3" />
    <path d="M12 8c-2-3-5-2-4 0M12 8c2-3 5-2 4 0" />
  </>,
);
export const IconRefresh = make(
  <>
    <path d="M21 12a9 9 0 01-9 9c-2.5 0-4.7-1-6.4-2.6" />
    <path d="M3 12a9 9 0 019-9c2.5 0 4.7 1 6.4 2.6" />
    <polyline points="21 4 21 9 16 9" />
    <polyline points="3 20 3 15 8 15" />
  </>,
);
export const IconUtensils = make(
  <>
    <path d="M3 2v7a3 3 0 003 3v10" />
    <path d="M9 2v10" />
    <path d="M6 2v7" />
    <path d="M18 2c-2 0-3 2-3 5s1 5 3 5v10" />
  </>,
);
export const IconSparkle = make(
  <>
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M12 7l-2 3-3 2 3 2 2 3 2-3 3-2-3-2z" />
  </>,
);
