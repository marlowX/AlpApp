import React, { useState } from 'react';
import { 
  Card, 
  DatePicker, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Row, 
  Col, 
  Statistic,
  Typography,
  Select,
  Divider,
  Alert
} from 'antd';
import { 
  FileExcelOutlined, 
  FilePdfOutlined, 
  PrinterOutlined,
  SearchOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import zkoApi from '../services/zkoApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ReportFilters {
  dateRange: [Dayjs, Dayjs] | null;
  kooperant: string | undefined;
  status: string | undefined;
  operator: string | undefined;
}

export const ProductionReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    kooperant: undefined,
    status: undefined,
    operator: undefined
  });

  const [generating, setGenerating] = useState(false);

  // Pobierz dane do raportu
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['production-report', filters],
    queryFn: async () => {
      // TODO: Implementacja API endpoint
      return {
        summary: {
          total_zko: 156,
          total_formatki: 12500,
          total_palety: 450,
          avg_time: 2.5, // dni
          efficiency: 92, // %
          top_kooperant: 'ABC Meble Sp. z o.o.'
        },
        details: [
          {
            id: 1,
            numer_zko: 'ZKO-2024-001',
            kooperant: 'ABC Meble',
            data_utworzenia: '2024-01-01',
            data_zakonczenia: '2024-01-03',
            status: 'ZAKONCZONA',
            formatki: 250,
            palety: 8,
            czas_realizacji: '2 dni'
          },
          // ... więcej danych
        ]
      };
    },
    enabled: false // Uruchom tylko na żądanie
  });

  const handleGenerateReport = () => {
    setGenerating(true);
    refetch().finally(() => setGenerating(false));
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    // TODO: Implementacja eksportu
    console.log(`Eksportowanie do ${format}`);
  };

  const columns = [
    {
      title: 'Numer ZKO',
      dataIndex: 'numer_zko',
      key: 'numer_zko',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Kooperant',
      dataIndex: 'kooperant',
      key: 'kooperant'
    },
    {
      title: 'Data utworzenia',
      dataIndex: 'data_utworzenia',
      key: 'data_utworzenia',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Data zakończenia',
      dataIndex: 'data_zakonczenia',
      key: 'data_zakonczenia',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ZAKONCZONA' ? 'green' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Formatki',
      dataIndex: 'formatki',
      key: 'formatki',
      align: 'right' as const
    },
    {
      title: 'Palety',
      dataIndex: 'palety',
      key: 'palety',
      align: 'right' as const
    },
    {
      title: 'Czas realizacji',
      dataIndex: 'czas_realizacji',
      key: 'czas_realizacji',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Raport Produkcyjny</Title>

      {/* Filtry */}
      <Card title="Parametry raportu" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text>Zakres dat:</Text>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%', marginTop: 8 }}
              format="DD.MM.YYYY"
            />
          </Col>
          <Col span={8}>
            <Text>Kooperant:</Text>
            <Select
              placeholder="Wszyscy"
              style={{ width: '100%', marginTop: 8 }}
              allowClear
              value={filters.kooperant}
              onChange={(value) => setFilters({ ...filters, kooperant: value })}
              options={[
                { value: 'ABC Meble', label: 'ABC Meble Sp. z o.o.' },
                { value: 'XYZ Design', label: 'XYZ Design' },
                { value: 'Meblux', label: 'Meblux SA' }
              ]}
            />
          </Col>
          <Col span={8}>
            <Text>Status:</Text>
            <Select
              placeholder="Wszystkie"
              style={{ width: '100%', marginTop: 8 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'NOWE', label: 'Nowe' },
                { value: 'W_PRODUKCJI', label: 'W produkcji' },
                { value: 'ZAKONCZONA', label: 'Zakończone' }
              ]}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Space>
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleGenerateReport}
            loading={generating}
          >
            Generuj raport
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
            disabled={!reportData}
          >
            Eksport Excel
          </Button>
          <Button 
            icon={<FilePdfOutlined />}
            onClick={() => handleExport('pdf')}
            disabled={!reportData}
          >
            Eksport PDF
          </Button>
          <Button 
            icon={<PrinterOutlined />}
            disabled={!reportData}
          >
            Drukuj
          </Button>
        </Space>
      </Card>

      {/* Podsumowanie */}
      {reportData && (
        <Card title="Podsumowanie" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="Łącznie ZKO"
                value={reportData.summary.total_zko}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Wyprodukowane formatki"
                value={reportData.summary.total_formatki}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Zamknięte palety"
                value={reportData.summary.total_palety}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Średni czas realizacji"
                value={reportData.summary.avg_time}
                suffix="dni"
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Efektywność"
                value={reportData.summary.efficiency}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Top kooperant"
                value={reportData.summary.top_kooperant}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Tabela szczegółowa */}
      {reportData && (
        <Card title="Szczegóły produkcji">
          <Table
            dataSource={reportData.details}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Łącznie ${total} pozycji`
            }}
          />
        </Card>
      )}

      {!reportData && !generating && (
        <Alert
          message="Brak danych"
          description="Wybierz parametry raportu i kliknij 'Generuj raport' aby wyświetlić dane."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};
