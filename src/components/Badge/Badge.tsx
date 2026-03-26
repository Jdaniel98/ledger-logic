import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'general' | 'income' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'general', className, children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={`${styles.badge} ${className ?? ''}`}
        data-variant={variant}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
