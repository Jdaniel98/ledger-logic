import { type ReactNode } from 'react';
import styles from './SplitView.module.css';

interface SplitViewProps {
  sidebar: ReactNode;
  main: ReactNode;
  inspector?: ReactNode;
  inspectorOpen?: boolean;
}

export function SplitView({
  sidebar,
  main,
  inspector,
  inspectorOpen = false,
}: SplitViewProps) {
  return (
    <div className={styles.shell} data-inspector-open={inspectorOpen || undefined}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.main}>{main}</main>
      {inspectorOpen && inspector && (
        <aside className={styles.inspector}>{inspector}</aside>
      )}
    </div>
  );
}
