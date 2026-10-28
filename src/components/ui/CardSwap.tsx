import { type ReactNode } from 'react';
import { BadgeCheck, Coins, FileText, ShieldCheck, Wallet } from 'lucide-react';
import './CardSwap.css';

export type CardSwapItem = {
  title: string;
  subtitle?: string;
  label?: string;
  date?: string;
  location?: string;
  rate?: string;
  accent?: string;
  icon?: ReactNode;
  pattern?: 'wave' | 'dots' | 'zigzag' | 'stripe' | 'spark' | 'orb';
};

const DEFAULT_ITEMS: CardSwapItem[] = [
  {
    title: 'Up to ₹4L',
    subtitle: 'Tax-Free',
    label: 'Zero tax',
    date: '12 Oct 2019',
    location: 'Toronto, Canada',
    rate: '0%',
    accent: '#ba7af3',
    pattern: 'wave',
    icon: <BadgeCheck size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹4L – ₹8L',
    subtitle: 'Standard band',
    label: '5%',
    date: '28 Dec 2019',
    location: 'United States',
    rate: '5%',
    accent: '#4ec6ff',
    pattern: 'dots',
    icon: <ShieldCheck size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹8L – ₹12L',
    subtitle: 'Rebate tier',
    label: '10%',
    date: '28 Nov 2019',
    location: 'United Nation',
    rate: '10%',
    accent: '#ffdc2d',
    pattern: 'zigzag',
    icon: <Wallet size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹12L – ₹16L',
    subtitle: 'Marginal relief',
    label: '15%',
    date: '30 Dec 2019',
    location: 'Hyderabad, India',
    rate: '15%',
    accent: '#f5c300',
    pattern: 'stripe',
    icon: <Coins size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹16L – ₹20L',
    subtitle: 'Higher bracket',
    label: '20%',
    date: '19 Aug 2019',
    location: 'Mumbai, India',
    rate: '20%',
    accent: '#ff4d4d',
    pattern: 'spark',
    icon: <FileText size={16} strokeWidth={2.2} />,
  },
  {
    title: 'Above ₹24L',
    subtitle: 'Top slab',
    label: '30%',
    date: '21 Sep 2019',
    location: 'North America',
    rate: '30%',
    accent: '#28c26d',
    pattern: 'orb',
    icon: <BadgeCheck size={16} strokeWidth={2.2} />,
  },
];

export type CardSwapProps = {
  items?: CardSwapItem[];
  className?: string;
};

export default function CardSwap({ items = DEFAULT_ITEMS, className = '' }: CardSwapProps) {
  return (
    <div className={['tax-card-grid', className].filter(Boolean).join(' ')} aria-label="Tax slab cards">
      {items.map((item, index) => (
        <article key={`${item.title}-${index}`} className="tax-card" style={{ ['--accent' as string]: item.accent ?? '#2dd4bf' }}>
          <div className="tax-card-shell">
            <div className="tax-card-topbar">
              <div className="tax-card-icon" style={{ background: item.accent ?? '#2dd4bf' }}>
                {item.icon ?? <BadgeCheck size={16} strokeWidth={2.2} />}
              </div>
              <span className="tax-card-date">{item.date ?? '01 Jan 2027'}</span>
            </div>

            <div className="tax-card-copy">
              <div className="tax-card-badge">{item.label ?? item.rate ?? '0%'}</div>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </div>

            <div className={`tax-card-art tax-card-art--${item.pattern ?? 'wave'}`} aria-hidden="true"></div>

            <div className="tax-card-location">{item.location ?? 'India'}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
