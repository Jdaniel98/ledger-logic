import { forwardRef, type TextareaHTMLAttributes, useId } from 'react';
import styles from './TextArea.module.css';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={`${styles.wrapper} ${className ?? ''}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={styles.textarea}
          data-error={error ? true : undefined}
          aria-invalid={error ? true : undefined}
          rows={3}
          {...rest}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
