import { useEffect, useState } from 'react';
import { Heading, Text, Panel, Select } from '../../components';
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
