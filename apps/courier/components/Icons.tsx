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
export const IconMapPin = make(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>);
export const IconStore = make(<><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 22v-7h6v7" /></>);
export const IconHome = make(<><path d="M3 9L12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>);
export const IconLock = make(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>);
export const IconWallet = make(<><path d="M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h13" /><circle cx="17" cy="13" r="1.2" fill="currentColor" /></>);
export const IconStar = make(<path d="M12 3l2.7 5.7 6.3.6-4.7 4.3 1.4 6.4L12 17l-5.7 3 1.4-6.4L3 9.3l6.3-.6L12 3z" />);

export const IconScooter = make(
  <>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.5 17h7" />
    <path d="M15 17l-1.5-9h-3" />
    <path d="M13.5 8h3.5" />
  </>,
);

export const IconMotorcycle = make(
  <>
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M14 8h2l3 9" />
    <path d="M5 17l4-6h6" />
  </>,
);

export const IconBike = make(
  <>
    <circle cx="5" cy="17" r="3.5" />
    <circle cx="19" cy="17" r="3.5" />
    <path d="M5 17l5-9h4l3 9" />
    <path d="M9 8h3" />
    <circle cx="12" cy="6" r="1" />
  </>,
);

export const IconCar = make(
  <>
    <path d="M5 17v-5l2-5h10l2 5v5" />
    <path d="M3 17h18" />
    <circle cx="7" cy="18" r="1.5" />
    <circle cx="17" cy="18" r="1.5" />
    <path d="M6 12h12" />
  </>,
);

export const IconWalk = make(
  <>
    <circle cx="13" cy="4" r="2" />
    <path d="M11 7l-1 6 3 2v6" />
    <path d="M13 15l3 3" />
    <path d="M10 13l-3 1" />
  </>,
);

export const IconLogout = make(
  <>
    <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M15 12H5" />
  </>,
);

export const IconShield = make(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />);
