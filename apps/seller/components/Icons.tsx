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
export const IconWallet = make(<><path d="M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h13" /><circle cx="17" cy="13" r="1.2" fill="currentColor" /></>);
export const IconCard = make(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></>);

export const IconChart = make(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 4 4 5-7" />
  </>,
);

export const IconBox = make(
  <>
    <path d="M21 8L12 3 3 8v8l9 5 9-5z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </>,
);

export const IconCart = make(
  <>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l2 12h13l2-9H6" />
  </>,
);

export const IconSettings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.07a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.07a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </>,
);

export const IconTrendUp = make(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>,
);
