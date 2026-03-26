import { forwardRef } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  indent?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, options, value, onChange, placeholder = 'Select...', error, size = 'md', disabled }, ref) => {
    return (
      <div className={styles.wrapper} data-size={size}>
        {label && <label className={styles.label}>{label}</label>}
        <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
          <RadixSelect.Trigger
            ref={ref}
            className={styles.trigger}
            data-error={error ? true : undefined}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon className={styles.icon}>
              <CaretDown size={14} />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
              <RadixSelect.Viewport className={styles.viewport}>
                {options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    className={styles.item}
                    data-indent={option.indent || undefined}
                  >
                    <RadixSelect.ItemIndicator className={styles.indicator}>
                      <Check size={14} />
                    </RadixSelect.ItemIndicator>
                    {option.icon && <span className={styles.itemIcon}>{option.icon}</span>}
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
