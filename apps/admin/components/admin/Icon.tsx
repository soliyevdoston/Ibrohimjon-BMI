import React from 'react';

type IconProps = { size?: number; stroke?: number; className?: string };

const make = (path: React.ReactNode) =>
  function Icon({ size = 18, stroke = 1.75, className }: IconProps) {
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
        aria-hidden
      >
        {path}
      </svg>
    );
  };

export const IconDashboard = make(
  <>
    <rect x="3" y="3" width="7" height="9" rx="2" />
    <rect x="14" y="3" width="7" height="5" rx="2" />
    <rect x="14" y="12" width="7" height="9" rx="2" />
    <rect x="3" y="16" width="7" height="5" rx="2" />
  </>,
);

export const IconUsers = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.4 3.6-5 6.5-5s5.7 1.6 6.5 5" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M15.5 14.2c2.4.2 4.6 1.7 5.5 4.3" />
  </>,
);

export const IconStore = make(
  <>
    <path d="M3 9l1-4.5h16L21 9" />
    <path d="M4 9v10.5h16V9" />
    <path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3 1.3 3 3 3 3-1.3 3-3 1.3 3 3 3 3-1.3 3-3" />
    <path d="M10 20v-5h4v5" />
  </>,
);

export const IconTruck = make(
  <>
    <rect x="2" y="7" width="12" height="9" rx="1.5" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </>,
);

export const IconOrders = make(
  <>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 9h6M9 13h6M9 17h4" />
  </>,
);

export const IconLive = make(
  <>
    <path d="M12 2a9 9 0 019 9c0 4.4-4.5 8.5-7.2 10.5a2.5 2.5 0 01-3.6 0C7.5 19.5 3 15.4 3 11a9 9 0 019-9z" />
    <circle cx="12" cy="11" r="2.5" />
  </>,
);

export const IconChart = make(
  <>
    <path d="M4 20V6" />
    <path d="M4 20h16" />
    <path d="M8 16v-4M12 16V9M16 16v-6" />
  </>,
);

export const IconSettings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1.1z" />
  </>,
);

export const IconSearch = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
);

export const IconBell = make(
  <>
    <path d="M6 8a6 6 0 0112 0c0 6 3 7 3 7H3s3-1 3-7" />
    <path d="M10 19a2 2 0 004 0" />
  </>,
);

export const IconPlus = make(
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
);

export const IconArrowUp = make(<path d="M12 19V5M5 12l7-7 7 7" />);
export const IconArrowDown = make(<path d="M12 5v14M19 12l-7 7-7-7" />);

export const IconDots = make(
  <>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </>,
);

export const IconMoney = make(
  <>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9v6M18 9v6" />
  </>,
);

export const IconLogout = make(
  <>
    <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M15 12H5" />
  </>,
);

export const IconCheck = make(<path d="M5 12l5 5 9-11" />);

export const IconMenu = make(
  <>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </>,
);

export const IconClose = make(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </>,
);

export const IconBuilding = make(
  <>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 8h2M8 12h2M8 16h2M14 8h2M14 12h2M14 16h2" />
  </>,
);

export const IconPackage = make(
  <>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </>,
);

export const IconBox = make(
  <>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M9 14h6" />
  </>,
);

export const IconTag = make(
  <>
    <path d="M20 12.5l-8.5 8.5a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.2 2.7a2 2 0 011.4-.6H19a2 2 0 012 2v7.4a2 2 0 01-.6 1.4z" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
  </>,
);
