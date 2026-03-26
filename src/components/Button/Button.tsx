import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      loading = false,
      disabled = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${className ?? ''}`}
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        disabled={disabled || loading}
        {...rest}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
