import type { TableProps, ColumnType } from 'antd/es/table';
import type { ReactNode } from 'react';
import type { TableVariant } from './DataTable.config';

export interface DataTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  // Wariant tabeli
  variant?: TableVariant;
  
  // Funkcjonalności
  enableExport?: boolean;
  enableColumnSettings?: boolean;
  enableSearch?: boolean;
  enableRefresh?: boolean;
  enableStats?: boolean;
  
  // Customizacja
  searchPlaceholder?: string;
  exportFilename?: string;
  title?: ReactNode;
  extra?: ReactNode;
  
  // Callbacks
  onRefresh?: () => void;
  
  // Wymagane
  columns: ColumnType<T>[];
}

export interface TableColumn<T> extends ColumnType<T> {
  exportable?: boolean;
  searchable?: boolean;
  hideable?: boolean;
}

export interface TableStats {
  total: number;
  filtered: number;
  selected: number;
  hidden: number;
}

export interface ExportOptions {
  filename?: string;
  type?: 'excel' | 'csv' | 'pdf';
  columns?: string[];
  includeHidden?: boolean;
}
