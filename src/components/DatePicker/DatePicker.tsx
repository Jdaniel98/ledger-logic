import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import styles from './DatePicker.module.css';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md';
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, size = 'md', className, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={`${styles.wrapper} ${className ?? ''}`} data-size={size}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={styles.input}
          data-error={error ? true : undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
