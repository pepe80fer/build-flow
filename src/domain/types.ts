// Tipos de dominio, independientes de la forma de las filas en SQLite
// (los repositorios se encargan de mapear snake_case/0-1 -> estos tipos).
// `type` en Project deja abierta la generalización de la Entrega 3.

export type ProjectType = 'construction' | 'generic';

export interface Project {
  id: number;
  name: string;
  type: ProjectType;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  projectId: number;
  name: string;
  isDefault: boolean;
  sortOrder: number;
}

export type BudgetEntryType = 'initial' | 'increase';

export interface BudgetEntry {
  id: number;
  projectId: number;
  /** Fecha en formato ISO (YYYY-MM-DD). */
  date: string;
  /** Monto en centavos, siempre positivo. */
  amount: number;
  type: BudgetEntryType;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  projectId: number;
  categoryId: number;
  /** Fecha en formato ISO (YYYY-MM-DD). */
  date: string;
  /** Monto en centavos. */
  amount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewBudgetEntryInput {
  projectId: number;
  date: string;
  amount: number;
  type: BudgetEntryType;
  note?: string | null;
}

export interface UpdateBudgetEntryInput {
  date?: string;
  amount?: number;
  note?: string | null;
}

export interface NewExpenseInput {
  projectId: number;
  categoryId: number;
  date: string;
  amount: number;
  note?: string | null;
}

export interface UpdateExpenseInput {
  categoryId?: number;
  date?: string;
  amount?: number;
  note?: string | null;
}
