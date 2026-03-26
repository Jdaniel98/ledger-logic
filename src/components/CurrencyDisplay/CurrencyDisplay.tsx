import { forwardRef, type HTMLAttributes } from 'react';
import styles from './CurrencyDisplay.module.css';

interface CurrencyDisplayProps extends HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
  showSign?: boolean;
  colorize?: boolean;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

export const CurrencyDisplay = forwardRef<HTMLSpanElement, CurrencyDisplayProps>(
  (
    {
      amount,
      currency = 'GBP',
      showSign = false,
      colorize = false,
      size = 'base',
      weight = 'regular',
      className,
      ...rest
    },
    ref,
  ) => {
    const formatted = formatCurrency(amount, currency);
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
    const displayText = showSign && amount !== 0 ? `${sign}${formatted}` : (amount < 0 ? `-${formatted}` : formatted);

    let colorVariant: string | undefined;
    if (colorize) {
      if (amount > 0) colorVariant = 'positive';
      else if (amount < 0) colorVariant = 'negative';
    }

    return (
      <span
        ref={ref}
        className={`${styles.currency} ${className ?? ''}`}
        data-size={size}
        data-weight={weight}
        data-color={colorVariant}
        {...rest}
      >
        {displayText}
      </span>
    );
  },
);

CurrencyDisplay.displayName = 'CurrencyDisplay';
