import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Heading.module.css';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  size?: HeadingSize;
  weight?: 'semibold' | 'bold';
  children: ReactNode;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    { level = 2, size = 'lg', weight = 'bold', className, children, ...rest },
    ref,
  ) => {
    const Tag = `h${level}` as const;

    return (
      <Tag
        ref={ref}
        className={`${styles.heading} ${className ?? ''}`}
        data-size={size}
        data-weight={weight}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);

Heading.displayName = 'Heading';
