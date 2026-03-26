import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card';
  width?: string;
  height?: string;
}

export function Skeleton({ variant = 'line', width, height }: SkeletonProps) {
  return (
    <div
      className={styles.skeleton}
      data-variant={variant}
      style={{ width, height }}
    />
  );
}
