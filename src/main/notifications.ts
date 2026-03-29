import { Notification, type BrowserWindow } from 'electron';
import { eq, sql } from 'drizzle-orm';
import type { AppDatabase } from './database/connection';
import { recurringTemplates, debts, savingsGoals, settings } from './database/schema';

const MILESTONES = [25, 50, 75, 100];

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSetting(db: AppDatabase, key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

function setSetting(db: AppDatabase, key: string, value: string) {
  const now = Date.now();
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ id: crypto.randomUUID(), key, value, createdAt: now, updatedAt: now }).run();
  }
}

export class NotificationService {
  private db: AppDatabase;
  private mainWindow: BrowserWindow;

  constructor(db: AppDatabase, mainWindow: BrowserWindow) {
    this.db = db;
    this.mainWindow = mainWindow;
  }

  checkAndNotify() {
    if (!Notification.isSupported()) return;

    const enabled = getSetting(this.db, 'notificationsEnabled');
    if (enabled === 'false') return;

    const today = getToday();
    const lastCheck = getSetting(this.db, 'notification:lastCheckDate');
    if (lastCheck === today) return;

    setSetting(this.db, 'notification:lastCheckDate', today);

    this.checkRecurring(today);
    this.checkDebts(today);
    this.checkGoalMilestones();
  }

  private checkRecurring(today: string) {
    const notifyRecurring = getSetting(this.db, 'notifyRecurring');
    if (notifyRecurring === 'false') return;

    const tomorrow = getTomorrow();
    const dueTemplates = this.db
      .select()
      .from(recurringTemplates)
      .where(
        sql`${recurringTemplates.isActive} = 1 AND (${recurringTemplates.nextDueDate} = ${today} OR ${recurringTemplates.nextDueDate} = ${tomorrow})`,
      )
      .all();

    for (const tmpl of dueTemplates) {
      const isDueToday = tmpl.nextDueDate === today;
      const notification = new Notification({
        title: isDueToday ? 'Payment Due Today' : 'Payment Due Tomorrow',
        body: `${tmpl.payee ?? tmpl.description ?? 'Recurring payment'} — ${tmpl.amount.toFixed(2)}`,
      });
      notification.on('click', () => {
        this.mainWindow.webContents.send('notification:navigate', 'recurring');
        this.mainWindow.focus();
      });
      notification.show();
    }
  }

  private checkDebts(today: string) {
    const notifyDebts = getSetting(this.db, 'notifyDebts');
    if (notifyDebts === 'false') return;

    const tomorrow = getTomorrow();
    const dueDebts = this.db
      .select()
      .from(debts)
      .where(
        sql`${debts.dueDate} = ${today} OR ${debts.dueDate} = ${tomorrow}`,
      )
      .all();

    for (const debt of dueDebts) {
      const isDueToday = debt.dueDate === today;
      const notification = new Notification({
        title: isDueToday ? 'Debt Payment Due Today' : 'Debt Payment Due Tomorrow',
        body: `${debt.name} — minimum ${debt.minimumPayment.toFixed(2)}`,
      });
      notification.on('click', () => {
        this.mainWindow.webContents.send('notification:navigate', 'debts');
        this.mainWindow.focus();
      });
      notification.show();
    }
  }

  private checkGoalMilestones() {
    const notifyGoals = getSetting(this.db, 'notifyGoals');
    if (notifyGoals === 'false') return;

    const goals = this.db.select().from(savingsGoals).all();

    for (const goal of goals) {
      if (goal.targetAmount <= 0) continue;
      const pct = (goal.currentAmount / goal.targetAmount) * 100;

      const lastMilestoneKey = `notification:goal:${goal.id}:lastMilestone`;
      const lastMilestone = parseInt(getSetting(this.db, lastMilestoneKey) ?? '0', 10);

      for (const milestone of MILESTONES) {
        if (pct >= milestone && lastMilestone < milestone) {
          const notification = new Notification({
            title: milestone === 100 ? 'Goal Reached!' : `${milestone}% Milestone`,
            body: `${goal.name} — ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}`,
          });
          notification.on('click', () => {
            this.mainWindow.webContents.send('notification:navigate', 'goals');
            this.mainWindow.focus();
          });
          notification.show();

          setSetting(this.db, lastMilestoneKey, String(milestone));
        }
      }
    }
  }
}
