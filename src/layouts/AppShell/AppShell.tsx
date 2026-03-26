import { type ReactNode } from 'react';
import { SplitView } from '../../components';
import { Sidebar } from '../Sidebar/Sidebar';
import styles from './AppShell.module.css';

interface AppShellProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  children: ReactNode;
}

export function AppShell({ activeView, onNavigate, children }: AppShellProps) {
  return (
    <SplitView
      sidebar={<Sidebar activeView={activeView} onNavigate={onNavigate} />}
      main={
        <div className={styles.mainContent}>
          {children}
        </div>
      }
    />
  );
}
