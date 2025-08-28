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
  Badge
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  UserOutlined,
  PlusOutlined,
  BoxPlotOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useZKO } from '../hooks';
import { statusColors, statusLabels } from '../utils/constants';
import { AddPozycjaModal } from '../components/AddPozycjaModal';

const { Title, Text } = Typography;

export const ZKODetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: zko, isLoading, error, refetch } = useZKO(Number(id));
  const [showAddPozycja, setShowAddPozycja] = useState(false);

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

  console.log('ZKO details data:', zko);

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
  const palety = zko.palety || [];

  // Handle successful pozycja addition
  const handlePozycjaAdded = () => {
    setShowAddPozycja(false);
    refetch(); // Odśwież dane ZKO
  };

  // Kolumny tabel
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
    }
  ];

  const paletyColumns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 60,
    },
    { 
      title: 'Typ', 
      dataIndex: 'typ', 
      key: 'typ',
      render: (text: string) => text || 'EURO',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { 
          'otwarta': 'orange', 
          'zamknieta': 'green', 
          'wyslana': 'blue' 
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Utworzona',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? dayjs(date).format('DD.MM HH:mm') : '-'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
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
              Edytuj
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

      {/* Main Info */}
      <Row gutter={24}>
        <Col span={16}>
          <Card title="Informacje podstawowe" style={{ marginBottom: '24px' }}>
            <Descriptions column={2} bordered>
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
              {zko.data_rozpoczecia && (
                <Descriptions.Item label="Data rozpoczęcia">
                  {dayjs(zko.data_rozpoczecia).format('DD.MM.YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {zko.data_zakonczenia && (
                <Descriptions.Item label="Data zakończenia">
                  {dayjs(zko.data_zakonczenia).format('DD.MM.YYYY HH:mm')}
                </Descriptions.Item>
              )}
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

        <Col span={8}>
          <Card title="Operatorzy" style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Piła:</Text>
                <br />
                <Text>{zko.operator_pily || 'Nie przypisano'}</Text>
              </div>
              <Divider />
              <div>
                <Text strong>Okleiniarka:</Text>
                <br />
                <Text>{zko.operator_oklejarki || 'Nie przypisano'}</Text>
              </div>
              <Divider />
              <div>
                <Text strong>Wiertarka:</Text>
                <br />
                <Text>{zko.operator_wiertarki || 'Nie przypisano'}</Text>
              </div>
            </Space>
          </Card>

          <Card title="Daty planowane">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Wysłanie:</Text>
                <br />
                <Text>
                  {zko.data_wyslania ? dayjs(zko.data_wyslania).format('DD.MM.YYYY') : 'Nie ustalono'}
                </Text>
              </div>
              <Divider />
              <div>
                <Text strong>Planowana realizacja:</Text>
                <br />
                <Text>
                  {zko.data_planowana ? dayjs(zko.data_planowana).format('DD.MM.YYYY') : 'Nie ustalono'}
                </Text>
              </div>
              <Divider />
              <div>
                <Text strong>Przyjęcie do magazynu:</Text>
                <br />
                <Text>
                  {zko.data_przyjecia_magazyn ? dayjs(zko.data_przyjecia_magazyn).format('DD.MM.YYYY') : 'Nie ustalono'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Szczegóły realizacji z prawdziwymi danymi */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            Szczegóły realizacji
          </Space>
        }
        style={{ marginTop: '24px' }}
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
      >
        <Tabs defaultActiveKey="pozycje">
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
              <Table
                columns={pozycjeColumns}
                dataSource={pozycje}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : (
              <Alert
                message="Brak pozycji"
                description={
                  <div>
                    <p>To zlecenie nie ma jeszcze dodanych pozycji.</p>
                    <p><strong>Dostępne funkcje:</strong></p>
                    <ul>
                      <li><code>dodaj_pozycje_do_zko()</code> - Dodawanie pozycji z rozkrojami</li>
                      <li><code>rozpocznij_produkcje_pozycji()</code> - Start produkcji</li>
                      <li><code>pal_planuj_inteligentnie()</code> - Planowanie palet</li>
                    </ul>
                  </div>
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
                Palety ({palety.length})
              </Space>
            } 
            key="palety"
          >
            {palety.length > 0 ? (
              <Table
                columns={paletyColumns}
                dataSource={palety}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : (
              <Alert
                message="Brak palet"
                description={
                  <div>
                    <p>Palety będą utworzone automatycznie po dodaniu pozycji.</p>
                    <p><strong>Dostępne funkcje:</strong></p>
                    <ul>
                      <li><code>pal_planuj()</code> - Ręczne planowanie palet</li>
                      <li><code>pal_zamknij()</code> - Zamykanie palet</li>
                      <li><code>stan_bufora_okleiniarka()</code> - Status bufora</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
              />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card title="Debug Info & Dostępne funkcje PostgreSQL" style={{ marginTop: '24px' }}>
          <Tabs defaultActiveKey="debug">
            <Tabs.TabPane tab="Debug" key="debug">
              <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                <strong>Pozycje z API:</strong> {pozycje.length}
                <br />
                <strong>Palety z API:</strong> {palety.length}
                <br />
                <strong>ZKO status:</strong> {zko.status}
                <br />
                <strong>Raw ZKO data:</strong>
                <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(zko, null, 2)}
                </pre>
              </div>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Funkcje PostgreSQL" key="funkcje">
              <div style={{ fontSize: '12px' }}>
                <Text strong>Dostępne funkcje ZKO:</Text>
                <ul>
                  <li><code>utworz_puste_zko()</code> - Tworzenie nowego ZKO</li>
                  <li><code>dodaj_pozycje_do_zko()</code> - Dodawanie pozycji</li>
                  <li><code>zmien_status_v3()</code> - Zmiana statusu workflow</li>
                  <li><code>pobierz_nastepne_etapy()</code> - Następne kroki</li>
                  <li><code>pokaz_status_zko()</code> - Pełny status</li>
                  <li><code>pal_planuj_inteligentnie_v3()</code> - Inteligentne palety</li>
                  <li><code>raportuj_produkcje_formatek()</code> - Raportowanie</li>
                  <li><code>zglos_uszkodzenie_formatki()</code> - Uszkodzenia</li>
                  <li><code>zakoncz_zlecenie()</code> - Finalizacja</li>
                  <li><code>stan_bufora_okleiniarka()</code> - Status buforów</li>
                </ul>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      )}

      {/* Add Pozycja Modal */}
      <AddPozycjaModal
        visible={showAddPozycja}
        zkoId={Number(id)}
        onCancel={() => setShowAddPozycja(false)}
        onSuccess={handlePozycjaAdded}
      />
    </div>
  );
};

export default ZKODetailsPage;