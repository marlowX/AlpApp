import type { TableProps } from 'antd/es/table';

export type TableVariant = 'default' | 'compact' | 'report' | 'minimal';

export const tableVariants: Record<TableVariant, Partial<TableProps<any>>> = {
  default: {
    size: 'middle',
    bordered: false,
    showSorterTooltip: true,
    pagination: {
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} z ${total}`,
      pageSizeOptions: ['10', '20', '50', '100'],
    },
    scroll: { x: 'max-content' },
    rowKey: 'id',
  },
  
  compact: {
    size: 'small',
    bordered: true,
    pagination: {
      pageSize: 50,
      showSizeChanger: true,
      showTotal: (total) => `Razem: ${total}`,
      pageSizeOptions: ['50', '100', '200'],
    },
    scroll: { x: 'max-content' },
    rowKey: 'id',
  },
  
  report: {
    size: 'small',
    bordered: true,
    pagination: false,
    scroll: undefined,
    showHeader: true,
    rowKey: 'id',
  },
  
  minimal: {
    size: 'middle',
    bordered: false,
    pagination: {
      simple: true,
      pageSize: 10,
    },
    showHeader: true,
    rowKey: 'id',
  },
};

export default tableVariants;
