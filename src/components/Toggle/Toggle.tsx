import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Toggle.module.css';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ checked, onChange, label, id, disabled, ...rest }, ref) => {
    return (
      <label className={styles.container} data-disabled={disabled || undefined}>
        <input
          ref={ref}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          id={id}
          disabled={disabled}
          {...rest}
        />
        <span className={styles.track} data-active={checked || undefined}>
          <span className={styles.thumb} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  },
);

Toggle.displayName = 'Toggle';
