import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import started from 'electron-squirrel-startup';
import { getDatabase, runMigrations, seedDatabase } from './main/database';
import { registerAllHandlers } from './main/ipc/register';
import { generateDueRecurring } from './main/ipc/recurring.handler';
import { NotificationService } from './main/notifications';
import { initSyncService } from './main/sync';
import { settings } from './main/database/schema';
import type { AppDatabase } from './main/database/connection';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

function getThemeBackgroundColor(db: AppDatabase): string {
  const row = db.select().from(settings).where(eq(settings.key, 'theme')).get();
  return row?.value === 'dark' ? '#1a1b1e' : '#f9f9fb';
}

const createWindow = (db: AppDatabase) => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 18 },
    vibrancy: 'sidebar',
    backgroundColor: getThemeBackgroundColor(db),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3 native module
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.whenReady().then(() => {
  const db = getDatabase();
  runMigrations(db);
  seedDatabase(db);
  registerAllHandlers(db);

  // Auto-generate due recurring transactions on startup
  const generated = generateDueRecurring(db);
  if (generated > 0) {
    console.log(`Generated ${generated} recurring transaction(s)`);
  }

  // Initialise sync service (must be before window creation so handlers can use it)
  initSyncService(db);

  createWindow(db);

  // Start notification service after window creation
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    const notificationService = new NotificationService(db, mainWindow);
    notificationService.checkAndNotify();
    setInterval(() => notificationService.checkAndNotify(), 60 * 60 * 1000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(db);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
