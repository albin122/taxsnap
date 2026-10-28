import type { CSSProperties, ReactNode } from 'react';

export type DockMenuRow = {
  label: string;
  icon?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
  onClick?: () => void;
};

export type DockItem = {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: number | string | boolean | null;
  className?: string;
  menu?: DockMenuRow[];
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
};

export interface DockProps {
  items?: DockItem[];
  position?: 'bottom' | 'top' | 'left' | 'right';
  theme?: 'dark' | 'light';
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  gap?: number;
  roundness?: number;
  spring?: { mass?: number; stiffness?: number; damping?: number };
  bounce?: boolean;
  autoHide?: boolean;
  tiles?: boolean;
  showLabels?: boolean;
  showIndicators?: boolean;
  showBadges?: boolean;
  badgeColor?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Dock({ items = [], className = '', style }: DockProps) {
  return (
    <div
      className={`dock ${className}`.trim()}
      style={style}
      aria-label="Dock navigation"
      data-dock-compat="true"
    >
      {items.map((item, index) => (
        <button
          key={`${item.label || 'dock-item'}-${index}`}
          type="button"
          onClick={item.onClick}
          className={item.className ?? ''}
          aria-label={item.label}
          data-active={item.active ? 'true' : undefined}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
