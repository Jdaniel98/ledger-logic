import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Text.module.css';

type TextSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type TextColor =
  | 'primary'
  | 'secondary'
  | 'brand'
  | 'nav'
  | 'on-accent'
  | 'danger'
  | 'income'
  | 'badge'
  | 'badge-income'
  | 'placeholder'
  | 'disabled';

interface TextProps extends HTMLAttributes<HTMLElement> {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  as?: 'p' | 'span' | 'label' | 'div';
  uppercase?: boolean;
  tabularNums?: boolean;
  children: ReactNode;
}

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      size = 'base',
      weight = 'regular',
      color = 'primary',
      as: Tag = 'span',
      uppercase = false,
      tabularNums = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <Tag
        ref={ref as never}
        className={`${styles.text} ${className ?? ''}`}
        data-size={size}
        data-weight={weight}
        data-color={color}
        data-uppercase={uppercase || undefined}
        data-tabular-nums={tabularNums || undefined}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);

Text.displayName = 'Text';
