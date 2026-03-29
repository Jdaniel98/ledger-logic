import { useEffect, useState } from 'react';
import { Heading, Text, Panel, Select, Toggle, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useSettingsStore } from '../../stores/useSettingsStore';
import styles from './SettingsPage.module.css';

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'GHS', label: 'GHS — Ghana Cedi' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'EGP', label: 'EGP — Egyptian Pound' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'XOF', label: 'XOF — West African CFA Franc' },
  { value: 'MAD', label: 'MAD — Moroccan Dirham' },
];

export function SettingsPage() {
  const { settings, fetchSettings, setSetting } = useSettingsStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const saved = settings.theme as string | undefined;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, [settings.theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setSetting('theme', newTheme);
  };

  const handleCurrencyChange = (currency: string) => {
    setSetting('baseCurrency', currency);
  };

  const baseCurrency = (settings.baseCurrency as string) || 'GBP';

  // Notification settings
  const notificationsEnabled = settings.notificationsEnabled !== 'false';
  const notifyRecurring = settings.notifyRecurring !== 'false';
  const notifyDebts = settings.notifyDebts !== 'false';
  const notifyGoals = settings.notifyGoals !== 'false';

  // Sync settings
  const syncFolderPath = (settings.syncFolderPath as string) || '';
  const syncAutoEnabled = settings.syncAutoEnabled === 'true';
  const lastSyncTimestamp = settings['sync:lastSyncTimestamp'] as string | undefined;
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handlePickFolder = async () => {
    const folder = await window.electronAPI.sync.pickFolder();
    if (folder) {
      setSetting('syncFolderPath', folder);
    }
  };

  const handleSyncNow = async () => {
    if (!syncFolderPath) return;
    setSyncing(true);
    setSyncMessage('');
    const result = await window.electronAPI.sync.export(syncFolderPath);
    setSyncing(false);
    if (result.success) {
      setSyncMessage('Exported successfully');
      fetchSettings();
    } else {
      setSyncMessage(result.error ?? 'Export failed');
    }
  };

  const handleImport = async () => {
    if (!syncFolderPath) return;
    setSyncing(true);
    setSyncMessage('');
    const result = await window.electronAPI.sync.import(syncFolderPath);
    setSyncing(false);
    if (result.success) {
      setSyncMessage('Imported successfully — reload pages to see changes');
      fetchSettings();
    } else {
      setSyncMessage(result.error ?? 'Import failed');
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTimestamp) return 'Never';
    const ts = parseInt(lastSyncTimestamp, 10);
    if (isNaN(ts)) return 'Never';
    return new Date(ts).toLocaleString('en-GB');
  };

  return (
    <div className={styles.page}>
      <Heading level={2} size="lg" weight="semibold">Settings</Heading>

      <Panel>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>General</Text>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Theme</Text>
              <Text size="xs" color="secondary">Switch between light and dark mode</Text>
            </div>
            <div className={styles.themeToggle}>
              <button
                className={styles.themeBtn}
                data-active={theme === 'light'}
                onClick={() => handleThemeChange('light')}
              >
                Light
              </button>
              <button
                className={styles.themeBtn}
                data-active={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              >
                Dark
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Base Currency</Text>
              <Text size="xs" color="secondary">Used for aggregations and display</Text>
            </div>
            <Select
              options={CURRENCY_OPTIONS}
              value={baseCurrency}
              onChange={handleCurrencyChange}
              size="sm"
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Notifications</Text>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Enable Notifications</Text>
              <Text size="xs" color="secondary">Desktop alerts for due dates and milestones</Text>
            </div>
            <Toggle
              checked={notificationsEnabled}
              onChange={(v) => setSetting('notificationsEnabled', v ? 'true' : 'false')}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Recurring Reminders</Text>
              <Text size="xs" color="secondary">Notify when recurring payments are due</Text>
            </div>
            <Toggle
              checked={notifyRecurring}
              onChange={(v) => setSetting('notifyRecurring', v ? 'true' : 'false')}
              disabled={!notificationsEnabled}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Debt Due Dates</Text>
              <Text size="xs" color="secondary">Notify when debt payments are due</Text>
            </div>
            <Toggle
              checked={notifyDebts}
              onChange={(v) => setSetting('notifyDebts', v ? 'true' : 'false')}
              disabled={!notificationsEnabled}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Goal Milestones</Text>
              <Text size="xs" color="secondary">Notify at 25%, 50%, 75%, and 100% of savings goals</Text>
            </div>
            <Toggle
              checked={notifyGoals}
              onChange={(v) => setSetting('notifyGoals', v ? 'true' : 'false')}
              disabled={!notificationsEnabled}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>Sync</Text>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Sync Folder</Text>
              <Text size="xs" color="secondary">
                {syncFolderPath || 'No folder selected'}
              </Text>
            </div>
            <Button variant="ghost" size="sm" onClick={handlePickFolder}>
              Choose Folder
            </Button>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Last Synced</Text>
              <Text size="xs" color="secondary">{formatLastSync()}</Text>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <Text weight="medium">Auto Sync</Text>
              <Text size="xs" color="secondary">Automatically export when data changes</Text>
            </div>
            <Toggle
              checked={syncAutoEnabled}
              onChange={(v) => setSetting('syncAutoEnabled', v ? 'true' : 'false')}
              disabled={!syncFolderPath}
            />
          </div>

          <div className={styles.syncActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncNow}
              disabled={!syncFolderPath || syncing}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImport}
              disabled={!syncFolderPath || syncing}
            >
              Import from Cloud
            </Button>
            {syncMessage && (
              <Text size="xs" color="secondary">{syncMessage}</Text>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="xs" weight="semibold" color="secondary" uppercase>About</Text>
          </div>
          <div className={styles.version}>
            <Text size="sm" color="secondary">The Ledger v1.0.0</Text>
          </div>
        </div>
      </Panel>
    </div>
  );
}
