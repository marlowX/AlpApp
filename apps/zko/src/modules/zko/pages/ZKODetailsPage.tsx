import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Steps, 
  Button, 
  Space, 
  Spin, 
  Alert, 
  Row, 
  Col, 
  Typography, 
  Divider, 
  Progress,
  Table,
  Tabs,
  Badge,
  Popconfirm,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  UserOutlined,
  PlusOutlined,
  BoxPlotOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useZKO } from '../hooks';
import { statusColors, statusLabels } from '../utils/constants';
import { AddPozycjaModal } from '../components/AddPozycja';
import { PaletyManager } from '../components/PaletyManager';
import zkoApi from '../services/zkoApi';
import '../styles/zko-details.css'; // Import stylów CSS

const { Title, Text } = Typography;

export const ZKODetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: zko, isLoading, error, refetch } = useZKO(Number(id));
  const [showAddPozycja, setShowAddPozycja] = useState(false);
  const [showEditPozycja, setShowEditPozycja] = useState(false);
  const [selectedPozycja, setSelectedPozycja] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !zko) {
    return (
      <Alert
        message="Błąd ładowania danych"
        description="Nie udało się załadować szczegółów zlecenia ZKO"
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => navigate('/zko')}>
            Powrót do listy
          </Button>
        }
      />
    );
  }

  // Mapowanie statusu na kroki workflow
  const getWorkflowStep = (status: string) => {
    const steps = [
      { key: 'nowe', title: 'Nowe', description: 'Zlecenie utworzone' },
      { key: 'CIECIE', title: 'Cięcie', description: 'Piła formatowa' },
      { key: 'OKLEJANIE', title: 'Oklejanie', description: 'Okleiniarka' },
      { key: 'WIERCENIE', title: 'Wiercenie', description: 'Wiertarka' },
      { key: 'PAKOWANIE_PALETY', title: 'Pakowanie', description: 'Przygotowanie do wysyłki' },
      { key: 'ZAKONCZONY', title: 'Zakończony', description: 'Gotowe do odbioru' }
    ];

    const currentIndex = steps.findIndex(step => status?.includes(step.key.toUpperCase()) || status === step.key);
    return { steps, currentIndex: currentIndex === -1 ? 0 : currentIndex };
  };

  const { steps, currentIndex } = getWorkflowStep(zko.status);
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);
  const priorityColor = zko.priorytet >= 4 ? 'red' : zko.priorytet >= 3 ? 'orange' : 'green';
  const priorityText = zko.priorytet >= 4 ? 'Wysoki' : zko.priorytet >= 3 ? 'Średni' : 'Niski';

  // Dane z API
  const pozycje = zko.pozycje || [];

  // Handle successful pozycja addition
  const handlePozycjaAdded = () => {
    setShowAddPozycja(false);
    refetch();
  };

  // Handle successful pozycja edit
  const handlePozycjaEdited = () => {
    setShowEditPozycja(false);
    setSelectedPozycja(null);
    refetch();
  };

  // Handle pozycja deletion
  const handleDeletePozycja = async (pozycjaId: number) => {
    try {
      setDeletingId(pozycjaId);
      const result = await zkoApi.deletePozycja(pozycjaId, 'admin');
      
      if (result.sukces) {
        message.success(result.komunikat || 'Pozycja została usunięta');
        refetch();
      } else {
        message.error(result.komunikat || 'Nie udało się usunąć pozycji');
      }
    } catch (error: any) {
      console.error('Error deleting pozycja:', error);
      message.error('Błąd podczas usuwania pozycji');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle pozycja edit
  const handleEditPozycja = (pozycja: any) => {
    setSelectedPozycja(pozycja);
    setShowEditPozycja(true);
  };

  // Kolumny tabeli pozycji
  const pozycjeColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 60,
    },
    { 
      title: 'Kolor płyty', 
      dataIndex: 'kolor_plyty', 
      key: 'kolor_plyty',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">-</Text>
    },
    {
      title: 'Nazwa płyty',
      dataIndex: 'nazwa_plyty',
      key: 'nazwa_plyty',
      render: (text: string) => text || <Text type="secondary">-</Text>
    },
    { 
      title: 'Ilość płyt', 
      dataIndex: 'ilosc_plyt', 
      key: 'ilosc_plyt',
      align: 'center' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { 
          'oczekuje': 'default',
          'w_realizacji': 'orange', 
          'zakonczone': 'green' 
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Rozkrój',
      dataIndex: 'kod_rozkroju',
      key: 'kod_rozkroju',
      render: (text: string) => text ? <Text code>{text}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: 'Utworzona',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? dayjs(date).format('DD.MM HH:mm') : '-'
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: 140,
      render: (_, record: any) => {
        const isDeleting = deletingId === record.id;
        const canDelete = record.status === 'oczekuje';
        const canEdit = record.status === 'oczekuje';
        
        return (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPozycja(record)}
              disabled={!canEdit}
              title={canEdit ? "Edytuj pozycję" : "Nie można edytować pozycji w trakcie realizacji"}
            >
              Edytuj
            </Button>
            
            <Popconfirm
              title="Czy na pewno usunąć pozycję?"
              description={
                <Space direction="vertical">
                  <Text>Ta operacja jest nieodwracalna.</Text>
                  <Text type="secondary">
                    <DatabaseOutlined /> Funkcja PostgreSQL: zko.usun_pozycje_zko
                  </Text>
                </Space>
              }
              onConfirm={() => handleDeletePozycja(record.id)}
              onCancel={() => {
                // Ukryj tooltip po anulowaniu
                setTimeout(() => {
                  document.querySelectorAll('.ant-tooltip').forEach(el => {
                    (el as HTMLElement).style.opacity = '0';
                  });
                }, 100);
              }}
              okText="Usuń pozycję"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
              disabled={!canDelete || isDeleting}
              placement="topRight"
              showCancel={true}
              destroyTooltipOnHide={true}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={isDeleting}
                disabled={!canDelete}
                title={canDelete ? "" : "Nie można usunąć pozycji w trakcie realizacji"}
              >
                Usuń
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }} className="zko-details-page">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/zko')}
            >
              Powrót
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {zko.numer_zko}
            </Title>
            <Tag color={statusColors[zko.status] || 'default'}>
              {statusLabels[zko.status] || zko.status}
            </Tag>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => navigate(`/zko/${id}/edit`)}
            >
              Edytuj ZKO
            </Button>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/zko/${id}/workflow`)}
            >
              Następny krok
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Progress */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" gutter={16}>
          <Col span={4}>
            <Text strong>Postęp realizacji:</Text>
          </Col>
          <Col span={16}>
            <Progress 
              percent={progress} 
              status={zko.status === 'ZAKONCZONY' ? 'success' : 'active'}
              strokeColor={zko.status === 'ZAKONCZONY' ? '#52c41a' : '#1890ff'}
            />
          </Col>
          <Col span={4}>
            <Text strong>{progress}%</Text>
          </Col>
        </Row>
      </Card>

      {/* Workflow Steps */}
      <Card title="Etapy realizacji" style={{ marginBottom: '24px' }}>
        <Steps
          current={currentIndex}
          items={steps.map(step => ({
            title: step.title,
            description: step.description,
          }))}
        />
      </Card>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Lewa kolumna - Informacje podstawowe */}
        <Col span={12}>
          <Card title="Informacje podstawowe" style={{ marginBottom: '24px' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Numer ZKO">
                <Text strong>{zko.numer_zko}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[zko.status] || 'default'}>
                  {statusLabels[zko.status] || zko.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Kooperant">
                <Space>
                  <UserOutlined />
                  {zko.kooperant}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Priorytet">
                <Tag color={priorityColor}>{priorityText} ({zko.priorytet})</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Data utworzenia">
                {dayjs(zko.data_utworzenia).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Utworzył">
                {zko.utworzyl}
              </Descriptions.Item>
            </Descriptions>

            {zko.komentarz && (
              <>
                <Divider />
                <Text strong>Komentarz:</Text>
                <br />
                <Text>{zko.komentarz}</Text>
              </>
            )}
          </Card>
        </Col>

        {/* Prawa kolumna - Szczegóły realizacji */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                Szczegóły realizacji
                <Badge count={pozycje.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            style={{ marginBottom: '24px' }}
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="small"
                onClick={() => setShowAddPozycja(true)}
              >
                Dodaj pozycję
              </Button>
            }
            bodyStyle={{ padding: '12px' }}
          >
            <Tabs defaultActiveKey="pozycje" size="small">
              <Tabs.TabPane 
                tab={
                  <Space>
                    <BoxPlotOutlined />
                    Pozycje ({pozycje.length})
                  </Space>
                } 
                key="pozycje"
              >
                {pozycje.length > 0 ? (
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    <Table
                      columns={pozycjeColumns}
                      dataSource={pozycje}
                      rowKey="id"
                      size="small"
                      pagination={false}
                    />
                  </div>
                ) : (
                  <Alert
                    message="Brak pozycji"
                    description={
                      <Space direction="vertical">
                        <Text>To zlecenie nie ma jeszcze dodanych pozycji.</Text>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<PlusOutlined />}
                          onClick={() => setShowAddPozycja(true)}
                        >
                          Dodaj pierwszą pozycję
                        </Button>
                      </Space>
                    }
                    type="info"
                    showIcon
                  />
                )}
              </Tabs.TabPane>
              
              <Tabs.TabPane 
                tab={
                  <Space>
                    <AppstoreOutlined />
                    Palety
                  </Space>
                } 
                key="palety"
              >
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <PaletyManager 
                    zkoId={Number(id)} 
                    onRefresh={refetch}
                  />
                </div>
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modal dodawania pozycji */}
      <AddPozycjaModal
        visible={showAddPozycja}
        zkoId={Number(id)}
        onCancel={() => setShowAddPozycja(false)}
        onSuccess={handlePozycjaAdded}
      />

      {/* Modal edycji pozycji - używa tego samego komponentu w trybie edycji */}
      <AddPozycjaModal
        visible={showEditPozycja}
        zkoId={Number(id)}
        onCancel={() => {
          setShowEditPozycja(false);
          setSelectedPozycja(null);
        }}
        onSuccess={handlePozycjaEdited}
        editMode={true}
        pozycjaToEdit={selectedPozycja}
      />
    </div>
  );
};

export default ZKODetailsPage;