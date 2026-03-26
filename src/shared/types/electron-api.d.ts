import type { Account, CreateAccountData, UpdateAccountData, PlatformInfo } from './models';

export interface ElectronAPI {
  accounts: {
    list: () => Promise<Account[]>;
    create: (data: CreateAccountData) => Promise<Account>;
    update: (id: string, data: UpdateAccountData) => Promise<Account>;
    delete: (id: string) => Promise<void>;
  };
  platform: {
    getInfo: () => Promise<PlatformInfo>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
