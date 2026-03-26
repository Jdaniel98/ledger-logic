import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/types/ipc-channels';
import type { CreateAccountData, UpdateAccountData } from './shared/types/models';

contextBridge.exposeInMainWorld('electronAPI', {
  accounts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_LIST),
    create: (data: CreateAccountData) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_CREATE, data),
    update: (id: string, data: UpdateAccountData) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_UPDATE, id, data),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_DELETE, id),
  },
  platform: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_INFO),
  },
});
