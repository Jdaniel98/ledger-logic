import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Panel.module.css';

type PanelVariant = 'default' | 'elevated' | 'accent';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  padding?: boolean;
  children: ReactNode;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ variant = 'default', padding = true, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.panel} ${className ?? ''}`}
        data-variant={variant}
        data-padding={padding || undefined}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Panel.displayName = 'Panel';
