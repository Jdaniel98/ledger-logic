import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './DataRow.module.css';

interface DataRowProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  sublabel?: string;
  value?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export const DataRow = forwardRef<HTMLDivElement, DataRowProps>(
  ({ label, sublabel, value, icon, rightSlot, className, onClick, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.row} ${className ?? ''}`}
        data-clickable={onClick ? true : undefined}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e as never);
                }
              }
            : undefined
        }
        {...rest}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <div className={styles.content}>
          <span className={styles.label}>{label}</span>
          {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
        </div>
        {value && (
          <span className={styles.value} data-tabular-nums>
            {value}
          </span>
        )}
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>
    );
  },
);

DataRow.displayName = 'DataRow';
