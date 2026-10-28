"use client";

import PillNav from './PillNav';
import type { PillNavItem } from './PillNav';

export interface NavHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  theme?: 'dark' | 'light';
}

const TAB_ITEMS = [
  { label: 'Home', href: '#overview' },
  { label: 'Tax Slabs', href: '#slabs' },
  { label: 'Exemptions', href: '#rules' },
  { label: 'Contact', href: '#contact' },
  { label: 'Settings', href: '#profile' },
];

const tabIdToHref = (tabId?: string): string | undefined => {
  if (!tabId) return undefined;
  const id = tabId === 'settings' ? 'profile' : tabId;
  const found = TAB_ITEMS.find(t => t.href === `#${id}`);
  return found?.href;
};

const hrefToTabId = (href: string): string => href.replace('#', '');

export default function NavHeader({ activeTab, onTabChange, theme = 'dark' }: NavHeaderProps) {
  const isLight = theme === 'light';

  const mobileTabs = [
    { id: 'overview', label: 'Home' },
    { id: 'slabs', label: 'Tax Slabs' },
    { id: 'rules', label: 'Exemptions' },
    { id: 'contact', label: 'Contact' },
    { id: 'profile', label: 'Settings' },
  ];

  return (
    <div className="relative flex w-full items-center">
      <div className="hidden md:flex md:w-full md:items-center md:justify-center">
        <div className="relative flex w-full items-center">
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
      </div>

      <div className="w-full px-2 md:hidden">
        <div className="mx-auto max-w-[440px] space-y-3">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#1a2329]/80 px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => onTabChange?.('overview')}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  activeTab === 'overview'
                    ? 'border-[#2dd4bf]/50 bg-[#2dd4bf]/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/80'
                }`}
                aria-label="Home"
              >
                <img src="/logo.png" alt="TaxSnap" className="size-5 rounded-md object-contain" />
              </button>

              <div className="flex min-w-0 items-center gap-1.5 text-white/90">
                <span className="text-sm font-medium text-white/90">-hazel.vercel.app</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTabChange?.('overview')}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-medium text-white"
                aria-label="Add"
              >
                +
              </button>

              <div className="flex h-7 min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-white">
                17
              </div>

              <button
                type="button"
                onClick={() => onTabChange?.('profile')}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80"
                aria-label="More options"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1b2a2d]/85 px-1.5 py-1.5 shadow-[0_18px_34px_rgba(0,0,0,0.26)] backdrop-blur-xl">
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'settings');

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id === 'profile' ? 'profile' : tab.id)}
                  className={`flex-1 rounded-full px-2 py-2 text-[10px] font-semibold tracking-tight transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
