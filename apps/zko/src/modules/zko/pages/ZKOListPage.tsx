import React, { useState } from 'react';
import { Table, Button, Space, Tag, Badge, Tooltip, Modal } from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useZKOList, useDeleteZKO } from '../hooks';
import type { ZKO } from '../types';
import { statusColors, statusLabels, priorityColors } from '../utils/constants';

const { confirm } = Modal;

export const ZKOListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: undefined,
    kooperant: undefined,
    search: '',
  });

  const { data, isLoading, refetch, error } = useZKOList(filters);
  const deleteMutation = useDeleteZKO();

  // Debug - sprawdź co zwraca API
  console.log('ZKO List data:', data);
  console.log('ZKO List loading:', isLoading);
  console.log('ZKO List error:', error);

  // Kolumny tabeli
  const columns: ColumnType<ZKO>[] = [
    {
      title: 'Numer ZKO',
      dataIndex: 'numer_zko',
      key: 'numer_zko',
      width: 150,
      render: (text: string, record: ZKO) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/zko/${record.id}`)}
        >
          <strong>{text}</strong>
        </Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Kooperant',
      dataIndex: 'kooperant',
      key: 'kooperant',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Priorytet',
      dataIndex: 'priorytet',
      key: 'priorytet',
      width: 100,
      align: 'center',
      render: (priority: number) => (
        <Badge 
          count={priority} 
          style={{ backgroundColor: priorityColors[priority] || '#999' }}
        />
      ),
      sorter: (a, b) => a.priorytet - b.priorytet,
    },
    {
      title: 'Data utworzenia',
      dataIndex: 'data_utworzenia',
      key: 'data_utworzenia',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a, b) => dayjs(a.data_utworzenia).unix() - dayjs(b.data_utworzenia).unix(),
    },
    {
      title: 'Utworzył',
      dataIndex: 'utworzyl',
      key: 'utworzyl',
      width: 120,
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: 150,
      render: (_, record: ZKO) => (
        <Space size="small">
          <Tooltip title="Podgląd">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/zko/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Workflow">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/zko/${record.id}/workflow`)}
            />
          </Tooltip>
          <Tooltip title="Usuń">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleDelete = (record: ZKO) => {
    confirm({
      title: 'Czy na pewno chcesz usunąć to ZKO?',
      content: `ZKO ${record.numer_zko} zostanie trwale usunięte wraz ze wszystkimi powiązanymi danymi.`,
      okText: 'Usuń',
      okType: 'danger',
      cancelText: 'Anuluj',
      onOk: async () => {
        await deleteMutation.mutateAsync(record.id);
      },
    });
  };

  if (error) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Błąd ładowania danych</h2>
        <p>{error.message}</p>
        <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Zlecenia ZKO</h2>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/zko/new')}
          >
            Nowe ZKO
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Odśwież
          </Button>
        </Space>
      </div>

      <Table<ZKO>
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          total: data?.total || 0,
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} z ${total} zleceń`,
        }}
        scroll={{ x: 'max-content' }}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', fontSize: '12px' }}>
          <strong>Debug Info:</strong>
          <br />
          Loading: {isLoading ? 'true' : 'false'}
          <br />
          Data count: {data?.data?.length || 0}
          <br />
          Total: {data?.total || 0}
          <br />
          Error: {error ? error.message : 'none'}
        </div>
      )}
    </div>
  );
};

export default ZKOListPage;