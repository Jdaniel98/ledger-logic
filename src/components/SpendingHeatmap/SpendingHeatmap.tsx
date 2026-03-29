import { useState, useMemo } from 'react';
import styles from './SpendingHeatmap.module.css';

interface DailySpending {
  date: string;
  amount: number;
}

interface SpendingHeatmapProps {
  data: DailySpending[];
  month: string; // YYYY-MM
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthGrid(month: string): { date: string; dayOfWeek: number }[] {
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const cells: { date: string; dayOfWeek: number }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, mon - 1, day);
    const dow = d.getDay(); // 0=Sun, 1=Mon...
    const mondayBased = dow === 0 ? 6 : dow - 1; // 0=Mon, 6=Sun
    cells.push({
      date: `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      dayOfWeek: mondayBased,
    });
  }

  return cells;
}

export function SpendingHeatmap({ data, month }: SpendingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const amountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) map.set(d.date, d.amount);
    return map;
  }, [data]);

  const maxAmount = useMemo(
    () => Math.max(...data.map((d) => d.amount), 1),
    [data],
  );

  const grid = useMemo(() => getMonthGrid(month), [month]);

  // Group into weeks (rows)
  const weeks: (typeof grid)[] = [];
  let currentWeek: typeof grid = [];

  // Add empty padding for the first day offset
  if (grid.length > 0) {
    for (let i = 0; i < grid[0].dayOfWeek; i++) {
      currentWeek.push({ date: '', dayOfWeek: i });
    }
  }

  for (const cell of grid) {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(cell);
  }
  if (currentWeek.length > 0) {
    // Pad remaining days
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', dayOfWeek: currentWeek.length });
    }
    weeks.push(currentWeek);
  }

  const getIntensity = (amount: number): number => {
    if (amount <= 0) return 0;
    return Math.min(amount / maxAmount, 1);
  };

  const handleMouseEnter = (e: React.MouseEvent, date: string, amount: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const parent = (e.target as HTMLElement).closest(`.${styles.container}`)?.getBoundingClientRect();
    if (!parent) return;

    const day = parseInt(date.split('-')[2], 10);
    setTooltip({
      x: rect.left - parent.left + rect.width / 2,
      y: rect.top - parent.top - 8,
      text: `${day}: ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.dayLabels}>
        {DAY_LABELS.map((d) => (
          <span key={d} className={styles.dayLabel}>{d}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.week}>
            {week.map((cell, ci) => {
              if (!cell.date) {
                return <div key={ci} className={styles.cell} data-empty />;
              }

              const amount = amountMap.get(cell.date) ?? 0;
              const intensity = getIntensity(amount);

              return (
                <div
                  key={cell.date}
                  className={styles.cell}
                  style={{
                    opacity: intensity > 0 ? 0.2 + intensity * 0.8 : undefined,
                  }}
                  data-active={intensity > 0 ? true : undefined}
                  onMouseEnter={(e) => handleMouseEnter(e, cell.date, amount)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div
        className={styles.tooltip}
        data-visible={tooltip ? true : undefined}
        style={tooltip ? { left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' } : undefined}
      >
        {tooltip?.text}
      </div>
    </div>
  );
}
