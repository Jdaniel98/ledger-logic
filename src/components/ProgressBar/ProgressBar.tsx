import { forwardRef, type HTMLAttributes } from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
  showLabel?: boolean;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max, showLabel = false, className, ...rest }, ref) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const overspend = value > max;

    let variant: 'normal' | 'warning' | 'danger' = 'normal';
    if (overspend) {
      variant = 'danger';
    } else if (percentage >= 75) {
      variant = 'warning';
    }

    return (
      <div
        ref={ref}
        className={`${styles.container} ${className ?? ''}`}
        data-variant={variant}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...rest}
      >
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        {showLabel && (
          <span className={styles.label}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';
