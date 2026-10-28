"use client";

import PillNav from './PillNav';
import type { PillNavItem } from './PillNav';

export interface NavHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  theme?: 'dark' | 'light';
}

// Map tab IDs to PillNav href values so activeHref tracking works
const TAB_ITEMS = [
  { label: 'Home',       href: '#overview' },
  { label: 'Tax Slabs',  href: '#slabs'    },
  { label: 'Exemptions', href: '#rules'    },
  { label: 'Contact',    href: '#contact'  },
  { label: 'Settings',   href: '#profile'  },
];

// Derive the active href from the activeTab id prop
const tabIdToHref = (tabId?: string): string | undefined => {
  if (!tabId) return undefined;
  // allow 'settings' alias for 'profile'
  const id = tabId === 'settings' ? 'profile' : tabId;
  const found = TAB_ITEMS.find(t => t.href === `#${id}`);
  return found?.href;
};

// Derive the tab id from a clicked PillNav item href
const hrefToTabId = (href: string): string => href.replace('#', '');

export default function NavHeader({ activeTab, onTabChange, theme = 'dark' }: NavHeaderProps) {
  const isLight = theme === 'light';

  return (
    <div className="relative flex w-full items-center">
      {/* Brand — left */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onTabChange?.('overview');
        }}
        className={`relative z-10 inline-flex shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 no-underline transition-opacity hover:opacity-90 ${
          isLight
            ? 'border-teal-200/80 bg-white/85 text-slate-900 shadow-sm backdrop-blur-xl'
            : 'border-white/10 bg-white/5 text-white shadow-lg backdrop-blur-xl'
        }`}
        aria-label="TaxSnap home"
      >
        <img
          src="/logo.png"
          alt=""
          draggable={false}
          className="size-[22px] object-contain"
        />
        <span className="font-display text-sm font-extrabold tracking-wide">TaxSnap</span>
      </a>

      {/* Nav pills — centered on top */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto">
          <PillNav
            items={TAB_ITEMS}
            activeHref={tabIdToHref(activeTab)}
            onItemClick={(item: PillNavItem) => onTabChange?.(hrefToTabId(item.href ?? ''))}
            theme={theme}
            layout="split"
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            surface="glass"
            size="md"
            bounce={0.3}
            stretch={0.5}
            intro={true}
            highlightColor={theme === 'dark' ? '#2dd4bf' : undefined}
            highlightTextColor={theme === 'dark' ? '#021a17' : undefined}
          />
        </div>
      </div>
    </div>
  );
}
