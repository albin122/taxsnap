"use client";

import {
  Home01Icon,
  InvoiceIcon,
  PhoneCallIcon,
  Settings01Icon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import Dock from './Dock';
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

const glyph = (icon: any) => <HugeiconsIcon icon={icon} size="1em" strokeWidth={1.8} />;

const tabIdToHref = (tabId?: string): string | undefined => {
  if (!tabId) return undefined;
  const id = tabId === 'settings' ? 'profile' : tabId;
  const found = TAB_ITEMS.find(t => t.href === `#${id}`);
  return found?.href;
};

const hrefToTabId = (href: string): string => href.replace('#', '');

export default function NavHeader({ activeTab, onTabChange, theme = 'dark' }: NavHeaderProps) {
  const isLight = theme === 'light';

  const mobileItems = [
    {
      label: 'Home',
      icon: glyph(Home01Icon),
      active: activeTab === 'overview',
      onClick: () => onTabChange?.('overview')
    },
    {
      label: 'Tax Slabs',
      icon: glyph(InvoiceIcon),
      active: activeTab === 'slabs',
      onClick: () => onTabChange?.('slabs')
    },
    {
      label: 'Exemptions',
      icon: glyph(ShieldCheckIcon),
      active: activeTab === 'rules',
      onClick: () => onTabChange?.('rules')
    },
    {
      label: 'Contact',
      icon: glyph(PhoneCallIcon),
      active: activeTab === 'contact',
      onClick: () => onTabChange?.('contact')
    },
    {
      label: 'Settings',
      icon: glyph(Settings01Icon),
      active: activeTab === 'profile' || activeTab === 'settings',
      onClick: () => onTabChange?.('profile')
    }
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

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center md:hidden">
        <div className="pointer-events-auto">
          <Dock
            items={mobileItems}
            theme={isLight ? 'light' : 'dark'}
            baseItemSize={52}
            magnification={76}
            panelHeight={64}
            gap={10}
            roundness={0.5}
            tiles
            showLabels
            showIndicators
            position="bottom"
            autoHide={false}
          />
        </div>
      </div>
    </div>
  );
}
