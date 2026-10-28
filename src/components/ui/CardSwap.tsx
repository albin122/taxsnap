import {
  Children,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BadgeCheck,
  Coins,
  FileText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import './CardSwap.css';

export type CardSwapItem = {
  title: string;
  subtitle?: string;
  description?: string;
  rate?: string;
  accent?: string;
  icon?: ReactNode;
  image?: string;
  alt?: string;
};

export function Card({ children, className = '', style, ...rest }: { children?: ReactNode; className?: string; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <div className={['card-swap-card', className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </div>
  );
}

const DEFAULT_ITEMS: CardSwapItem[] = [
  {
    title: 'Up to ₹4L',
    subtitle: 'Tax-Free',
    rate: '0%',
    description: 'Completely exempt basic threshold for all taxpayers.',
    accent: '#2dd4bf',
    icon: <BadgeCheck size={18} strokeWidth={1.8} />,
  },
  {
    title: '₹4L – ₹8L',
    subtitle: 'Standard tax band',
    rate: '5%',
    description: 'Covered under Section 156 rebate up to ₹12L.',
    accent: '#5eead4',
    icon: <ShieldCheck size={18} strokeWidth={1.8} />,
  },
  {
    title: '₹8L – ₹12L',
    subtitle: 'Rebate tier',
    rate: '10%',
    description: 'Fully rebated up to ₹60,000 under Section 156.',
    accent: '#67e8f9',
    icon: <Coins size={18} strokeWidth={1.8} />,
  },
  {
    title: '₹12L – ₹16L',
    subtitle: 'Marginal relief',
    rate: '15%',
    description: 'Marginal relief applies slightly above the rebate threshold.',
    accent: '#a5f3fc',
    icon: <Wallet size={18} strokeWidth={1.8} />,
  },
  {
    title: '₹16L – ₹20L',
    subtitle: 'Higher bracket',
    rate: '20%',
    description: 'Standard tax-bracket progression.',
    accent: '#99f6e4',
    icon: <FileText size={18} strokeWidth={1.8} />,
  },
  {
    title: 'Above ₹24L',
    subtitle: 'Top slab',
    rate: '30%',
    description: 'Maximum slab rate plus applicable surcharge.',
    accent: '#fbbf24',
    icon: <BadgeCheck size={18} strokeWidth={1.8} />,
  },
];

export type CardSwapProps = {
  items?: CardSwapItem[];
  children?: ReactNode;
  width?: number;
  height?: number;
  delay?: number;
  autoplay?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
};

export default function CardSwap({
  items = DEFAULT_ITEMS,
  children,
  width = 420,
  height = 320,
  delay = 4000,
  autoplay = true,
  theme = 'dark',
  className = '',
}: CardSwapProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const entries = useMemo(() => {
    if (children) {
      return Children.toArray(children).filter(Boolean);
    }

    return items.map((item, index) => (
      <Card key={`${item.title}-${index}`} className="card-swap-panel" style={{ borderColor: item.accent ?? '#2dd4bf' }}>
        <div className="card-swap-panel-inner">
          <div className="card-swap-head">
            <span className="card-swap-icon" style={{ color: item.accent ?? '#2dd4bf' }}>
              {item.icon ?? <BadgeCheck size={18} strokeWidth={1.8} />}
            </span>
            <div className="card-swap-title-wrap">
              <div className="card-swap-title">{item.title}</div>
              {item.subtitle && <div className="card-swap-subtitle">{item.subtitle}</div>}
            </div>
          </div>

          <div className="card-swap-rate" style={{ color: item.accent ?? '#2dd4bf' }}>{item.rate ?? '0%'}</div>

          {item.description && (
            <div className="card-swap-description">{item.description}</div>
          )}
        </div>
      </Card>
    ));
  }, [children, items]);

  useEffect(() => {
    if (!autoplay || entries.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % entries.length);
    }, delay);

    return () => window.clearInterval(timer);
  }, [autoplay, delay, entries.length]);

  const visibleCards = entries.length > 0
    ? [...entries.slice(activeIndex), ...entries.slice(0, activeIndex)].slice(0, Math.min(4, entries.length))
    : [];

  return (
    <div
      className={['card-swap', `card-swap--${theme}`, className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-label="Tax slab cards"
    >
      <div className="card-swap-stack">
        {visibleCards.map((card, index) => {
          const offset = index * 18;
          const scale = 1 - index * 0.045;
          const opacity = 1 - index * 0.18;
          const zIndex = visibleCards.length - index;

          return (
            <div
              key={`card-swap-${index}-${activeIndex}`}
              className="card-swap-slot"
              style={{
                transform: `translate(${offset}px, ${offset * 0.35}px) scale(${scale})`,
                opacity,
                zIndex,
              }}
              onClick={() => setActiveIndex((activeIndex + index) % entries.length)}
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
