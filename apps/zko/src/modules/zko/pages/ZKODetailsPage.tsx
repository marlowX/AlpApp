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
  Progress,
  Table,
  Tabs,
  Badge,
  Popconfirm,
  message,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  UserOutlined,
  PlusOutlined,
  BoxPlotOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  DragOutlined,
  ExperimentOutlined,
  LockOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  InboxOutlined,
  PrinterOutlined,
  ForkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useZKO, useNextSteps } from '../hooks';
import { statusColors, statusLabels } from '../utils/constants';
import { AddPozycjaModal } from '../components/AddPozycja';
import { SciezkaDisplay } from '../components/AddPozycja/SciezkaProdukcji';
import { PaletyManager } from '../components/PaletyManager';
import { PaletyZko } from '../components/PaletyZko';
import { StatusChangeButton } from '../components/StatusChangeButton';
import { ZKOEditButton } from '../components/ZKOEditButton';
import { ZKOHeaderCompact } from '../components/ZKOHeaderCompact';
import zkoApi from '../services/zkoApi';
import '../styles/zko-details.css';

const { Title, Text } = Typography;

export const ZKODetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: zko, isLoading, error, refetch } = useZKO(Number(id));
  const { data: nextSteps } = useNextSteps(Number(id));
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

  const getWorkflowStep = (status: string) => {
    const steps = [
      { key: 'NOWE', title: 'Nowe', description: 'Zlecenie utworzone' },
      { key: 'CIECIE', title: 'Cięcie', description: 'Piła formatowa' },
      { key: 'OKLEJANIE', title: 'Oklejanie', description: 'Okleiniarka' },
      { key: 'WIERCENIE', title: 'Wiercenie', description: 'Wiertarka' },
      { key: 'PAKOWANIE', title: 'Pakowanie', description: 'Przygotowanie do wysyłki' },
      { key: 'ZAKONCZONA', title: 'Zakończona', description: 'Gotowe do odbioru' }
    ];

    const currentIndex = steps.findIndex(step => 
      status?.toUpperCase().includes(step.key) || status?.toUpperCase() === step.key
    );
    return { steps, currentIndex: currentIndex === -1 ? 0 : currentIndex };
  };

  const { steps, currentIndex } = getWorkflowStep(zko.status);
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);
  
  // Przekształć priorytet na format label
  const priorityText = zko.priorytet >= 8 ? 'Wysoki' : zko.priorytet >= 5 ? 'Normalny' : 'Niski';
  
  // Przygotuj dane dla kompaktowego nagłówka
  const zkoWithLabels = {
    ...zko,
    priorytet_label: priorityText,
    status_label: statusLabels[zko.status] || zko.status,
    kooperant_nazwa: zko.kooperant,
    utworzyl: zko.utworzyl || 'system'
  };

  const pozycje = zko.pozycje || [];
  const palety = zko.palety || [];
  
  // Oblicz statystyki
  const uniqueColors = [...new Set(pozycje.map(p => p.kolor_plyty).filter(Boolean))];
  const zamknietePalety = palety.filter(p => p.status === 'gotowa_do_transportu' || p.status === 'zamknieta');
  const otwartePalety = palety.filter(p => p.status !== 'gotowa_do_transportu' && p.status !== 'zamknieta');
  
  // Sprawdź warunki blokujące
  const hasNoPozycje = pozycje.length === 0;
  const hasNoPalety = palety.length === 0;
  const canChangeStatus = !hasNoPozycje && !hasNoPalety;

  const handlePozycjaAdded = () => {
    setShowAddPozycja(false);
    refetch();
  };

  const handlePozycjaEdited = () => {
    setShowEditPozycja(false);
    setSelectedPozycja(null);
    refetch();
  };

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

  const handleEditPozycja = (pozycja: any) => {
    // Pobierz ścieżkę produkcji z formatek jeśli nie ma w pozycji
    if (!pozycja.sciezka_produkcji && pozycja.formatki && pozycja.formatki.length > 0) {
      pozycja.sciezka_produkcji = pozycja.formatki[0].sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN';
    }
    setSelectedPozycja(pozycja);
    setShowEditPozycja(true);
  };

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
      title: 'Ścieżka produkcji',
      dataIndex: 'sciezka_produkcji',
      key: 'sciezka_produkcji',
      width: 280,
      render: (sciezka: string, record: any) => {
        // Sprawdź czy formatki mają ścieżkę
        const formatkiSciezka = record.formatki && record.formatki.length > 0 
          ? record.formatki[0].sciezka_produkcji 
          : null;
        
        const finalSciezka = sciezka || formatkiSciezka || 'CIECIE->OKLEJANIE->MAGAZYN';
        
        return (
          <Tooltip title="Ścieżka produkcji formatek">
            <SciezkaDisplay sciezka={finalSciezka} />
          </Tooltip>
        );
      }
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
      render: (_: any, record: any) => {
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
              okText="Usuń pozycję"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
              disabled={!canDelete || isDeleting}
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
    <div style={{ padding: '12px' }} className="zko-details-page">
      {/* Header - KOMPAKTOWY */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '12px' }}>
        <Col>
          <Space size="small">
            <Button 
              size="small"
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/zko')}
            >
              Powrót
            </Button>
            <Title level={3} style={{ margin: 0, fontSize: '18px' }}>
              {zko.numer_zko}
            </Title>
            <Tag color={statusColors[zko.status] || 'default'} style={{ fontSize: '11px' }}>
              {statusLabels[zko.status] || zko.status}
            </Tag>
          </Space>
        </Col>
        <Col>
          <Space size="small">
            <ZKOEditButton 
              zko={zko}
              onEdited={refetch}
            />
            <StatusChangeButton
              zkoId={Number(id)}
              currentStatus={zko.status}
              onStatusChanged={refetch}
              nextSteps={nextSteps}
              disabled={zko.status === 'ZAKONCZONA'}
            />
          </Space>
        </Col>
      </Row>

      {/* KOMPAKTOWY NAGŁÓWEK Z INFORMACJAMI I POSTĘPEM */}
      <ZKOHeaderCompact 
        zko={zkoWithLabels}
        postepRealizacji={progress}
      />

      {/* Ostrzeżenia o blokadach */}
      {zko.status === 'NOWE' && (hasNoPozycje || hasNoPalety) && (
        <Alert
          message="Wymagania do spełnienia przed rozpoczęciem produkcji"
          description={
            <Space direction="vertical">
              {hasNoPozycje && (
                <Space>
                  <LockOutlined style={{ color: '#ff4d4f' }} />
                  <Text>Brak pozycji - dodaj przynajmniej jedną pozycję (rozkrój)</Text>
                  <Button 
                    size="small" 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddPozycja(true)}
                  >
                    Dodaj pozycję
                  </Button>
                </Space>
              )}
              {!hasNoPozycje && hasNoPalety && (
                <Space>
                  <LockOutlined style={{ color: '#ff4d4f' }} />
                  <Text>Brak zaplanowanych palet - użyj "Planuj palety" dla każdej pozycji</Text>
                </Space>
              )}
            </Space>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Szczegóły realizacji - ULEPSZONE TABS */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <Text style={{ fontSize: '14px' }}>Szczegóły realizacji</Text>
            <Badge 
              count={pozycje.length + palety.length} 
              style={{ backgroundColor: '#1890ff' }} 
            />
          </Space>
        }
        style={{ marginBottom: '16px' }}
        extra={
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />} 
            onClick={() => setShowAddPozycja(true)}
          >
            Dodaj pozycję
          </Button>
        }
      >
        <Tabs defaultActiveKey="pozycje" size="small">
          <Tabs.TabPane 
            tab={
              <Space>
                <BoxPlotOutlined />
                <span>Pozycje</span>
                <Badge 
                  count={pozycje.length} 
                  style={{ backgroundColor: '#52c41a' }}
                  title={`${pozycje.length} pozycji`}
                />
                {uniqueColors.length > 0 && (
                  <Space size={4} style={{ marginLeft: 8 }}>
                    <BgColorsOutlined style={{ fontSize: 12, color: '#999' }} />
                    {uniqueColors.slice(0, 3).map((color, idx) => (
                      <Tag 
                        key={idx} 
                        color="blue" 
                        style={{ 
                          margin: 0, 
                          fontSize: 10,
                          padding: '0 4px',
                          height: 18,
                          lineHeight: '16px'
                        }}
                      >
                        {color}
                      </Tag>
                    ))}
                    {uniqueColors.length > 3 && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        +{uniqueColors.length - 3}
                      </Text>
                    )}
                  </Space>
                )}
                <Tooltip title="Pozycje mogą mieć różne ścieżki produkcji">
                  <ForkOutlined style={{ fontSize: 12, color: '#1890ff', marginLeft: 8 }} />
                </Tooltip>
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
                pagination={pozycje.length > 10 ? { pageSize: 10, showSizeChanger: true } : false}
                scroll={{ x: 1400 }}
              />
            ) : (
              <Alert
                message="Brak pozycji"
                description={
                  <Space direction="vertical">
                    <Text>To zlecenie nie ma jeszcze dodanych pozycji.</Text>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddPozycja(true)}
                    >
                      Dodaj pierwszą pozycję
                    </Button>
                  </Space>
                }
                type="info"
                showIcon
                style={{ textAlign: 'center' }}
              />
            )}
          </Tabs.TabPane>
          
          <Tabs.TabPane 
            tab={
              <Space>
                <DragOutlined style={{ color: '#1890ff' }} />
                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                  Palety (Drag & Drop)
                </span>
                <Badge 
                  count={palety.length} 
                  style={{ backgroundColor: '#1890ff' }}
                  title={`${palety.length} palet`}
                />
                {palety.length > 0 && (
                  <Space size={4} style={{ marginLeft: 8 }}>
                    {zamknietePalety.length > 0 && (
                      <Tooltip title={`${zamknietePalety.length} zamkniętych palet`}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          backgroundColor: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: 4,
                          fontSize: 11
                        }}>
                          <LockOutlined style={{ color: '#52c41a', fontSize: 11 }} />
                          <span style={{ color: '#52c41a' }}>{zamknietePalety.length}</span>
                        </span>
                      </Tooltip>
                    )}
                    {otwartePalety.length > 0 && (
                      <Tooltip title={`${otwartePalety.length} otwartych palet`}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          backgroundColor: '#fff7e6',
                          border: '1px solid #ffd591',
                          borderRadius: 4,
                          fontSize: 11
                        }}>
                          <InboxOutlined style={{ color: '#faad14', fontSize: 11 }} />
                          <span style={{ color: '#faad14' }}>{otwartePalety.length}</span>
                        </span>
                      </Tooltip>
                    )}
                    {zamknietePalety.length > 0 && (
                      <Tooltip title="Możliwość drukowania etykiet">
                        <PrinterOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                      </Tooltip>
                    )}
                  </Space>
                )}
              </Space>
            } 
            key="palety-dnd"
          >
            <PaletyZko 
              zkoId={Number(id)} 
              onRefresh={refetch}
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane 
            tab={
              <Space>
                <ExperimentOutlined style={{ color: '#999' }} />
                <span style={{ color: '#999' }}>
                  Palety (wersja testowa)
                </span>
              </Space>
            } 
            key="palety-old"
            disabled
          >
            <Alert
              message="Wersja testowa"
              description="To jest stara wersja modułu palet. Używaj nowej wersji z Drag & Drop."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <PaletyManager 
              zkoId={Number(id)} 
              onRefresh={refetch}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Daty i operatorzy - KOMPAKTOWE */}
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={<Text style={{ fontSize: '13px' }}>Daty realizacji</Text>}
            size="small"
            styles={{ body: { padding: '8px 12px' } }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Data rozpoczęcia" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.data_rozpoczecia ? dayjs(zko.data_rozpoczecia).format('DD.MM.YYYY HH:mm') : '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Data zakończenia" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.data_zakonczenia ? dayjs(zko.data_zakonczenia).format('DD.MM.YYYY HH:mm') : '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Data wysyłki" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.data_wyslania ? dayjs(zko.data_wyslania).format('DD.MM.YYYY') : '-'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title={<Text style={{ fontSize: '13px' }}>Operatorzy</Text>}
            size="small"
            styles={{ body: { padding: '8px 12px' } }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Operator piły" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.operator_pily || 'Nieprzypisany'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Operator oklejarki" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.operator_oklejarki || 'Nieprzypisany'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Operator wiertarki" labelStyle={{ fontSize: '11px' }}>
                <Text style={{ fontSize: '11px' }}>
                  {zko.operator_wiertarki || 'Nieprzypisany'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
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

      {/* Modal edycji pozycji */}
      {showEditPozycja && selectedPozycja && (
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
      )}
    </div>
  );
};

export default ZKODetailsPage;
