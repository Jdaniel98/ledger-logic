import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <CaretLeft size={16} />
      </button>
      <span className={styles.info}>
        {page} of {totalPages}
      </span>
      <button
        className={styles.button}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <CaretRight size={16} />
      </button>
    </div>
  );
}
