import { type ReactNode } from 'react';
import { BadgeCheck, Coins, FileText, ShieldCheck, Wallet } from 'lucide-react';
import './CardSwap.css';

export type CardSwapItem = {
  title: string;
  subtitle?: string;
  label?: string;
  rate?: string;
  accent?: string;
  icon?: ReactNode;
  salaryDetails?: string;
  pattern?: 'wave' | 'dots' | 'zigzag' | 'stripe' | 'spark' | 'orb';
};

const DEFAULT_ITEMS: CardSwapItem[] = [
  {
    title: 'Up to ₹4,00,000',
    subtitle: 'Tax-free',
    label: '0%',
    rate: '0%',
    accent: '#00ffd6',
    pattern: 'wave',
    salaryDetails: '₹0 – ₹4L',
    icon: <BadgeCheck size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹4,00,001 – ₹8,00,000',
    subtitle: 'Standard band',
    label: '5%',
    rate: '5%',
    accent: '#2ad4ff',
    pattern: 'dots',
    salaryDetails: '₹4L – ₹8L',
    icon: <ShieldCheck size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹8,00,001 – ₹12,00,000',
    subtitle: 'Rebate tier',
    label: '10%',
    rate: '10%',
    accent: '#ffd73c',
    pattern: 'zigzag',
    salaryDetails: '₹8L – ₹12L',
    icon: <Wallet size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹12,00,001 – ₹16,00,000',
    subtitle: 'Marginal relief',
    label: '15%',
    rate: '15%',
    accent: '#f0bc00',
    pattern: 'stripe',
    salaryDetails: '₹12L – ₹16L',
    icon: <Coins size={16} strokeWidth={2.2} />,
  },
  {
    title: '₹16,00,001 – ₹20,00,000',
    subtitle: 'Higher bracket',
    label: '20%',
    rate: '20%',
    accent: '#ff6a6a',
    pattern: 'spark',
    salaryDetails: '₹16L – ₹20L',
    icon: <FileText size={16} strokeWidth={2.2} />,
  },
  {
    title: 'Above ₹24,00,000',
    subtitle: 'Top slab',
    label: '30%',
    rate: '30%',
    accent: '#67e997',
    pattern: 'orb',
    salaryDetails: 'Above ₹24L',
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
        <article
          key={`${item.title}-${index}`}
          className="tax-slab-item"
          style={{ ['--accent' as string]: item.accent ?? '#00ffd6' }}
        >
          <div className="tax-slab-range">{item.title}</div>

          <div className="tax-slab-card">
            <div className="glass" aria-hidden="true" />

            <div className="logo" aria-hidden="true">
              <span className="circle circle1" />
              <span className="circle circle2" />
              <span className="circle circle3" />
              <span className="circle circle4" />
            </div>

            <div className="content">
              <span className="title">{item.label ?? item.rate ?? '0%'}</span>
              <span className="text">{item.subtitle ?? 'Tax-free'}</span>
            </div>

            <div className="bottom">
              <div className="salary-meta">
                <span className="salary-value">{item.salaryDetails ?? item.title}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
