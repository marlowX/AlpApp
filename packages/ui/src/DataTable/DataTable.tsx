import React, { useState, useCallback, useMemo } from 'react';
import { Table, Space, Button, Dropdown, Checkbox, Input, Tooltip, Card } from 'antd';
import type { TableProps, ColumnType } from 'antd/es/table';
import {
  DownloadOutlined,
  SettingOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  ColumnHeightOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styled from 'styled-components';
import { tableVariants, TableVariant } from './DataTable.config';
import type { DataTableProps } from './DataTable.types';

const { Search } = Input;

// Styled components
const TableWrapper = styled.div`
  background: ${props => props.theme?.token?.colorBgContainer || '#ffffff'};
  border-radius: ${props => props.theme?.token?.borderRadiusLG || 8}px;
  padding: 16px;
`;

const ToolbarWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
  border-bottom: 1px solid ${props => props.theme?.token?.colorBorderSecondary || '#f0f0f0'};
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 8px 12px;
  background: ${props => props.theme?.token?.colorFillQuaternary || 'rgba(0, 0, 0, 0.02)'};
  border-radius: ${props => props.theme?.token?.borderRadius || 6}px;
  font-size: 12px;
  color: ${props => props.theme?.token?.colorTextSecondary || 'rgba(0, 0, 0, 0.65)'};
`;

// Hook do zarządzania kolumnami
const useColumnVisibility = <T extends object>(
  columns: ColumnType<T>[]
) => {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const toggleColumn = useCallback((columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter(col => !hiddenColumns.has(String(col.key || col.dataIndex))),
    [columns, hiddenColumns]
  );

  return {
    hiddenColumns,
    visibleColumns,
    toggleColumn,
  };
};

// Hook do eksportu
const useExport = <T extends object>(
  dataSource: T[] | undefined,
  columns: ColumnType<T>[],
  filename: string = 'export'
) => {
  const exportToExcel = useCallback(() => {
    if (!dataSource || dataSource.length === 0) return;

    // Przygotuj dane do eksportu
    const exportData = dataSource.map(row => {
      const exportRow: any = {};
      columns.forEach(col => {
        const key = String(col.key || col.dataIndex);
        const title = typeof col.title === 'string' ? col.title : key;
        exportRow[title] = (row as any)[key];
      });
      return exportRow;
    });

    // Utwórz workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Eksportuj
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [dataSource, columns, filename]);

  const exportToCSV = useCallback(() => {
    if (!dataSource || dataSource.length === 0) return;

    // Przygotuj nagłówki
    const headers = columns.map(col => 
      typeof col.title === 'string' ? col.title : String(col.key || col.dataIndex)
    );

    // Przygotuj wiersze
    const rows = dataSource.map(row => 
      columns.map(col => {
        const key = String(col.key || col.dataIndex);
        return (row as any)[key];
      })
    );

    // Utwórz CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Eksportuj
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [dataSource, columns, filename]);

  return {
    exportToExcel,
    exportToCSV,
  };
};

// Główny komponent DataTable
export const DataTable = <T extends object>({
  variant = 'default',
  enableExport = true,
  enableColumnSettings = true,
  enableSearch = true,
  enableRefresh = false,
  enableStats = true,
  searchPlaceholder = 'Szukaj...',
  exportFilename = 'dane',
  title,
  extra,
  onRefresh,
  columns = [],
  dataSource,
  loading,
  ...restProps
}: DataTableProps<T>) => {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<T[] | undefined>(dataSource);

  // Użyj hooków
  const { hiddenColumns, visibleColumns, toggleColumn } = useColumnVisibility(columns);
  const { exportToExcel, exportToCSV } = useExport(filteredData || dataSource, visibleColumns, exportFilename);

  // Konfiguracja wariantu
  const variantConfig = tableVariants[variant];

  // Filtrowanie danych po wyszukiwaniu
  React.useEffect(() => {
    if (!searchText) {
      setFilteredData(dataSource);
      return;
    }

    const filtered = dataSource?.filter(item => {
      return visibleColumns.some(col => {
        const key = String(col.key || col.dataIndex);
        const value = (item as any)[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchText.toLowerCase());
      });
    });

    setFilteredData(filtered);
  }, [searchText, dataSource, visibleColumns]);

  // Menu ustawień kolumn
  const columnSettingsMenu = {
    items: columns.map(col => {
      const key = String(col.key || col.dataIndex);
      const title = typeof col.title === 'string' ? col.title : key;
      return {
        key,
        label: (
          <Checkbox
            checked={!hiddenColumns.has(key)}
            onChange={() => toggleColumn(key)}
          >
            {title}
          </Checkbox>
        ),
      };
    }),
  };

  // Menu eksportu
  const exportMenu = {
    items: [
      {
        key: 'excel',
        icon: <DownloadOutlined />,
        label: 'Eksportuj do Excel',
        onClick: exportToExcel,
      },
      {
        key: 'csv',
        icon: <DownloadOutlined />,
        label: 'Eksportuj do CSV',
        onClick: exportToCSV,
      },
    ],
  };

  // Statystyki
  const stats = useMemo(() => {
    const total = dataSource?.length || 0;
    const filtered = filteredData?.length || 0;
    const selected = (restProps as any).rowSelection?.selectedRowKeys?.length || 0;
    
    return {
      total,
      filtered,
      selected,
      hidden: columns.length - visibleColumns.length,
    };
  }, [dataSource, filteredData, columns, visibleColumns, restProps]);

  return (
    <TableWrapper>
      {/* Toolbar */}
      {(title || enableSearch || enableExport || enableColumnSettings || enableRefresh || extra) && (
        <ToolbarWrapper>
          <ToolbarLeft>
            {title && <h3 style={{ margin: 0 }}>{title}</h3>}
            {enableSearch && (
              <Search
                placeholder={searchPlaceholder}
                allowClear
                size="middle"
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
                onSearch={setSearchText}
                onChange={e => setSearchText(e.target.value)}
              />
            )}
          </ToolbarLeft>
          
          <ToolbarRight>
            {extra}
            
            {enableRefresh && (
              <Tooltip title="Odśwież">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                />
              </Tooltip>
            )}
            
            {enableColumnSettings && (
              <Dropdown menu={columnSettingsMenu} trigger={['click']}>
                <Tooltip title="Ustawienia kolumn">
                  <Button icon={<SettingOutlined />} />
                </Tooltip>
              </Dropdown>
            )}
            
            {enableExport && (
              <Dropdown menu={exportMenu} trigger={['click']}>
                <Button type="primary" icon={<DownloadOutlined />}>
                  Eksportuj
                </Button>
              </Dropdown>
            )}
          </ToolbarRight>
        </ToolbarWrapper>
      )}

      {/* Tabela */}
      <Table<T>
        {...variantConfig}
        {...restProps}
        columns={visibleColumns}
        dataSource={filteredData}
        loading={loading}
      />

      {/* Statystyki */}
      {enableStats && (
        <StatsBar>
          <span>Wszystkich: <strong>{stats.total}</strong></span>
          {searchText && (
            <span>Filtrowanych: <strong>{stats.filtered}</strong></span>
          )}
          {stats.selected > 0 && (
            <span>Zaznaczonych: <strong>{stats.selected}</strong></span>
          )}
          {stats.hidden > 0 && (
            <span>Ukrytych kolumn: <strong>{stats.hidden}</strong></span>
          )}
        </StatsBar>
      )}
    </TableWrapper>
  );
};

export default DataTable;
