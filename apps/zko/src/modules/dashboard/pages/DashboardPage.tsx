import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Alert, Button } from 'antd';
import { 
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  ToolOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useZKOList } from '../../zko/hooks';
import dayjs from 'dayjs';

export const DashboardPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState<string>('');
  
  const { data: zkoData, isLoading, error: zkoError } = useZKOList();

  // Test połączenia z API
  useEffect(() => {
    const testConnection = async () => {
      try {
        setApiStatus('connecting');
        const response = await fetch('http://localhost:5000/health');
        
        if (response.ok) {
          const data = await response.json();
          setApiStatus('connected');
          setError('');
          console.log('API Status:', data);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        console.error('API Connection Error:', error);
        setApiStatus('error');
        setError(error.message);
      }
    };

    testConnection();
  }, []);

  // Przygotuj dane do wykresów
  const statusData = React.useMemo(() => {
    if (!zkoData?.data) return [];
    
    const statusCount = zkoData.data.reduce((acc, zko) => {
      acc[zko.status] = (acc[zko.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status === 'nowe' ? 'Nowe' : 
            status === 'OTWARCIE_PALETY' ? 'Otwarcie palety' : 
            status === 'ZAKONCZONE' ? 'Zakończone' : status,
      value: count,
      color: status === 'nowe' ? '#1890ff' : 
             status === 'OTWARCIE_PALETY' ? '#52c41a' : 
             status === 'ZAKONCZONE' ? '#52c41a' : '#faad14'
    }));
  }, [zkoData]);

  const priorityData = React.useMemo(() => {
    if (!zkoData?.data) return [];
    
    const priorities = [1,2,3,4,5,6,7,8,9,10];
    return priorities.map(priority => ({
      priorytet: priority,
      ilosc: zkoData.data.filter(zko => zko.priorytet === priority).length
    }));
  }, [zkoData]);

  const stats = React.useMemo(() => {
    if (!zkoData?.data) return { total: 0, completed: 0, inProgress: 0, high: 0 };
    
    return {
      total: zkoData.data.length,
      completed: zkoData.data.filter(zko => zko.status === 'ZAKONCZONE').length,
      inProgress: zkoData.data.filter(zko => 
        !['nowe', 'ZAKONCZONE', 'ANULOWANE'].includes(zko.status)
      ).length,
      high: zkoData.data.filter(zko => zko.priorytet >= 8).length,
    };
  }, [zkoData]);

  const recentZKO = React.useMemo(() => {
    if (!zkoData?.data) return [];
    
    return [...zkoData.data]
      .sort((a, b) => dayjs(b.data_utworzenia).unix() - dayjs(a.data_utworzenia).unix())
      .slice(0, 5)
      .map(zko => ({
        ...zko,
        key: zko.id
      }));
  }, [zkoData]);

  const columns = [
    {
      title: 'Numer ZKO',
      dataIndex: 'numer_zko',
      key: 'numer_zko',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'nowe' ? 'blue' : status.includes('OTWARCIE') ? 'green' : 'orange'}>
          {status === 'nowe' ? 'Nowe' : 
           status === 'OTWARCIE_PALETY' ? 'Otwarcie palety' : status}
        </Tag>
      )
    },
    {
      title: 'Kooperant',
      dataIndex: 'kooperant',
      key: 'kooperant',
    },
    {
      title: 'Data',
      dataIndex: 'data_utworzenia',
      key: 'data_utworzenia',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    }
  ];

  // Funkcja odświeżania
  const handleRefresh = async () => {
    window.location.reload();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Dashboard ZKO</h1>
        
        {/* Status połączenia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {apiStatus === 'connected' ? (
            <Tag color="green" icon={<WifiOutlined />}>
              Backend: Połączony
            </Tag>
          ) : apiStatus === 'error' ? (
            <Tag color="red" icon={<DisconnectOutlined />}>
              Backend: Błąd ({error})
            </Tag>
          ) : (
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              Backend: Łączenie...
            </Tag>
          )}
          
          <Button onClick={handleRefresh}>
            Odśwież
          </Button>
        </div>
      </div>

      {/* Alert o błędzie */}
      {apiStatus === 'error' && (
        <Alert
          message="Brak połączenia z backendem"
          description={
            <div>
              <p>Nie można połączyć się z serwerem API (localhost:5000).</p>
              <p><strong>Rozwiązanie:</strong></p>
              <ol>
                <li>Sprawdź czy backend jest uruchomiony: <code>cd services/zko-service && pnpm dev</code></li>
                <li>Sprawdź w terminalu backend czy pokazuje "Server running on port 5000"</li>
                <li>Sprawdź <a href="http://localhost:5000/health" target="_blank" rel="noopener noreferrer">http://localhost:5000/health</a></li>
              </ol>
            </div>
          }
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Błąd ZKO */}
      {zkoError && (
        <Alert
          message="Błąd ładowania danych ZKO"
          description={`Szczegóły: ${zkoError.message}`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}
      
      {/* Statystyki */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Wszystkie ZKO"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="W realizacji"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Zakończone"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Wysoki priorytet"
              value={stats.high}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Wykresy tylko jeśli są dane */}
      {zkoData?.data && zkoData.data.length > 0 && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            {/* Wykres statusów */}
            <Card title="Rozkład statusów">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col span={12}>
            {/* Wykres priorytetów */}
            <Card title="Rozkład priorytetów">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priorytet" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ilosc" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* Ostatnie ZKO */}
      <Card title="Ostatnio utworzone ZKO" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={recentZKO}
          pagination={false}
          loading={isLoading}
          size="small"
          locale={{
            emptyText: 'Brak danych ZKO'
          }}
        />
      </Card>

      {/* Postęp realizacji */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Postęp realizacji">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ukończone</span>
                <span>{stats.completed}/{stats.total}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                status="active"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>W trakcie</span>
                <span>{stats.inProgress}/{stats.total}</span>
              </div>
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}
                status="active"
                strokeColor="#faad14"
              />
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Stan systemu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Backend API</span>
                {apiStatus === 'connected' ? (
                  <Tag color="success">Działa</Tag>
                ) : (
                  <Tag color="error">Błąd</Tag>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Baza danych</span>
                {apiStatus === 'connected' ? (
                  <Tag color="success">Połączona</Tag>
                ) : (
                  <Tag color="warning">Nieznany</Tag>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Ostatnia aktualizacja</span>
                <span>{dayjs().format('HH:mm:ss')}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;