/* Domain types shared across the IPC boundary.
   These are plain objects — no ORM dependencies. */

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

export interface CreateAccountData {
  name: string;
  type: AccountType;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  sortOrder?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  type: 'expense' | 'income';
  isSystem: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlatformInfo {
  platform: string;
  version: string;
  arch: string;
}
