import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Table, 
  InputNumber, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Alert, 
  Progress, 
  Row, 
  Col, 
  Divider, 
  Typography, 
  message,
  Checkbox,
  Radio,
  Tooltip,
  Badge,
  Statistic,
  Empty,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  ScissorOutlined,
  ToolOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

// Typy przeznaczenia palety
const PALLET_DESTINATIONS = {
  MAGAZYN: { label: 'Magazyn', icon: <InboxOutlined />, color: 'blue' },
  OKLEINIARKA: { label: 'Okleiniarka', icon: <BgColorsOutlined />, color: 'orange' },
  WIERCENIE: { label: 'Wiercenie', icon: <ToolOutlined />, color: 'purple' },
  CIECIE: { label: 'Cięcie', icon: <ScissorOutlined />, color: 'red' },
  WYSYLKA: { label: 'Wysyłka', icon: <CheckCircleOutlined />, color: 'green' }
};

interface Formatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
}

interface PaletaFormatka {
  formatka_id: number;
  ilosc: number;
}

interface Paleta {
  id: string;
  numer: string;
  formatki: PaletaFormatka[];
  przeznaczenie: string;
  uwagi: string;
  max_waga: number;
  max_wysokosc: number;
}

interface ManualPalletCreatorProps {
  pozycjaId?: number;
  formatki: Formatka[];
  onSave?: (palety: Paleta[]) => void;
  loading?: boolean;
}

export const ManualPalletCreator: React.FC<ManualPalletCreatorProps> = ({ 
  pozycjaId,
  formatki: formatkiProp,
  onSave,
  loading = false
}) => {
  const [formatki] = useState<Formatka[]>(formatkiProp);
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [selectedPaleta, setSelectedPaleta] = useState<string | null>(null);
  const [editingFormatka, setEditingFormatka] = useState<number | null>(null);
  const [tempIlosci, setTempIlosci] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  // Oblicz pozostałe ilości formatek
  const pozostaleIlosci = useMemo(() => {
    const result: Record<number, number> = {};
    
    formatki.forEach(f => {
      let przypisane = 0;
      palety.forEach(p => {
        const formatkaWPalecie = p.formatki.find(pf => pf.formatka_id === f.id);
        if (formatkaWPalecie) {
          przypisane += formatkaWPalecie.ilosc;
        }
      });
      result[f.id] = f.ilosc_planowana - przypisane;
    });
    
    return result;
  }, [formatki, palety]);

  // Oblicz statystyki palety
  const obliczStatystykiPalety = (paleta: Paleta) => {
    let totalWaga = 0;
    let totalSztuk = 0;
    let totalWysokosc = 0;
    const kolory = new Set<string>();
    
    paleta.formatki.forEach(pf => {
      const formatka = formatki.find(f => f.id === pf.formatka_id);
      if (formatka) {
        totalSztuk += pf.ilosc;
        totalWaga += pf.ilosc * formatka.waga_sztuka;
        // Zakładamy 4 formatki na poziom
        const poziomy = Math.ceil(pf.ilosc / 4);
        totalWysokosc = Math.max(totalWysokosc, poziomy * formatka.grubosc);
        kolory.add(formatka.kolor);
      }
    });
    
    return {
      waga: totalWaga,
      sztuk: totalSztuk,
      wysokosc: totalWysokosc,
      kolory: Array.from(kolory),
      wykorzystanieWagi: (totalWaga / paleta.max_waga) * 100,
      wykorzystanieWysokosci: (totalWysokosc / paleta.max_wysokosc) * 100
    };
  };

  // Utwórz nową paletę
  const utworzPalete = () => {
    const newPaleta: Paleta = {
      id: `PAL-${Date.now()}`,
      numer: `PAL-${String(palety.length + 1).padStart(3, '0')}`,
      formatki: [],
      przeznaczenie: 'MAGAZYN',
      uwagi: '',
      max_waga: 700,
      max_wysokosc: 1440
    };
    setPalety([...palety, newPaleta]);
    setSelectedPaleta(newPaleta.id);
    message.success('Utworzono nową paletę');
  };

  // Dodaj formatki do palety
  const dodajFormatkiDoPalety = (paletaId: string, formatkaId: number, ilosc: number) => {
    setPalety(prev => prev.map(p => {
      if (p.id === paletaId) {
        const existing = p.formatki.find(f => f.formatka_id === formatkaId);
        if (existing) {
          return {
            ...p,
            formatki: p.formatki.map(f => 
              f.formatka_id === formatkaId 
                ? { ...f, ilosc: f.ilosc + ilosc }
                : f
            )
          };
        } else {
          return {
            ...p,
            formatki: [...p.formatki, { formatka_id: formatkaId, ilosc }]
          };
        }
      }
      return p;
    }));
    message.success(`Dodano ${ilosc} szt. do palety`);
  };

  // Dodaj WSZYSTKIE pozostałe formatki określonego typu do palety
  const dodajWszystkieFormatki = (paletaId: string, formatkaId: number) => {
    const dostepneIlosc = pozostaleIlosci[formatkaId];
    if (dostepneIlosc > 0) {
      dodajFormatkiDoPalety(paletaId, formatkaId, dostepneIlosc);
      message.success(`Dodano wszystkie ${dostepneIlosc} szt. do palety`);
    }
  };

  // Dodaj WSZYSTKIE pozostałe formatki do palety
  const dodajWszystkieReszteFormatek = (paletaId: string) => {
    if (!activePaleta) return;
    
    let dodanoTotal = 0;
    formatki.forEach(formatka => {
      const dostepne = pozostaleIlosci[formatka.id];
      if (dostepne > 0) {
        dodajFormatkiDoPalety(paletaId, formatka.id, dostepne);
        dodanoTotal += dostepne;
      }
    });
    
    if (dodanoTotal > 0) {
      message.success(`Dodano wszystkie pozostałe formatki (${dodanoTotal} szt.) do palety`);
    } else {
      message.info('Brak pozostałych formatek do dodania');
    }
  };

  // Usuń formatki z palety
  const usunFormatkiZPalety = (paletaId: string, formatkaId: number) => {
    setPalety(prev => prev.map(p => {
      if (p.id === paletaId) {
        return {
          ...p,
          formatki: p.formatki.filter(f => f.formatka_id !== formatkaId)
        };
      }
      return p;
    }));
    message.success('Usunięto formatki z palety');
  };

  // Zmień przeznaczenie palety
  const zmienPrzeznaczenie = (paletaId: string, przeznaczenie: string) => {
    setPalety(prev => prev.map(p => 
      p.id === paletaId ? { ...p, przeznaczenie } : p
    ));
  };

  // Kopiuj paletę
  const kopiujPalete = (paletaId: string) => {
    const paleta = palety.find(p => p.id === paletaId);
    if (paleta) {
      const newPaleta: Paleta = {
        ...paleta,
        id: `PAL-${Date.now()}`,
        numer: `PAL-${String(palety.length + 1).padStart(3, '0')}`,
      };
      setPalety([...palety, newPaleta]);
      message.success('Skopiowano paletę');
    }
  };

  // Usuń paletę
  const usunPalete = (paletaId: string) => {
    Modal.confirm({
      title: 'Czy na pewno usunąć paletę?',
      content: 'Wszystkie przypisania formatek zostaną usunięte.',
      okText: 'Usuń',
      cancelText: 'Anuluj',
      okButtonProps: { danger: true },
      onOk: () => {
        setPalety(prev => prev.filter(p => p.id !== paletaId));
        if (selectedPaleta === paletaId) {
          setSelectedPaleta(null);
        }
        message.success('Usunięto paletę');
      }
    });
  };

  // 🔥 NOWA FUNKCJA - Zapisz palety do bazy danych
  const handleSaveAll = async () => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }

    if (palety.length === 0) {
      message.warning('Brak palet do zapisania');
      return;
    }

    try {
      setSaving(true);
      
      const paletySaveData = palety.map(paleta => ({
        formatki: paleta.formatki,
        przeznaczenie: paleta.przeznaczenie,
        max_waga: paleta.max_waga,
        max_wysokosc: paleta.max_wysokosc,
        operator: 'user',
        uwagi: paleta.uwagi || null
      }));

      const response = await fetch('/api/pallets/manual/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          palety: paletySaveData
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`Zapisano ${data.palety_utworzone.length} palet do bazy danych`);
        
        // Wyczyść lokalne palety po zapisaniu
        setPalety([]);
        setSelectedPaleta(null);
        
        // Wywołaj callback
        if (onSave) {
          onSave(palety);
        }
      } else {
        message.error(data.error || 'Błąd zapisywania palet');
      }
    } catch (error) {
      console.error('Error saving pallets:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Obsługa wprowadzania ilości formatek
  const handleDodajFormatki = (formatkaId: number, ilosc?: number) => {
    if (!activePaleta) {
      message.warning('Najpierw wybierz paletę');
      return;
    }

    const iloscDoDodania = ilosc || tempIlosci[formatkaId] || 1;
    const dostepne = pozostaleIlosci[formatkaId];
    const aktualne = activePaleta.formatki.find(f => f.formatka_id === formatkaId)?.ilosc || 0;
    
    if (iloscDoDodania > dostepne + aktualne) {
      message.error(`Dostępne tylko ${dostepne} szt.`);
      return;
    }

    if (aktualne > 0) {
      // Aktualizuj istniejące
      usunFormatkiZPalety(activePaleta.id, formatkaId);
    }
    
    dodajFormatkiDoPalety(activePaleta.id, formatkaId, iloscDoDodania);
    setEditingFormatka(null);
    setTempIlosci(prev => ({ ...prev, [formatkaId]: 1 }));
  };

  const activePaleta = palety.find(p => p.id === selectedPaleta);
  const stats = activePaleta ? obliczStatystykiPalety(activePaleta) : null;

  // Sprawdź czy są jeszcze formatki do dodania
  const saPozostaleFormatki = Object.values(pozostaleIlosci).some(ilosc => ilosc > 0);

  return (
    <div>
      <Alert
        message="Tryb ręcznego zarządzania paletami"
        description="Twórz palety i przypisuj formatki według własnych potrzeb. Kontroluj przeznaczenie każdej palety i monitoruj wagę oraz wysokość w czasie rzeczywistym."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Row gutter={16}>
        {/* Panel formatek do przypisania */}
        <Col span={10}>
          <Card 
            title="Dostępne formatki z pozycji"
            size="small"
            extra={
              <Space>
                <Tag color="blue">
                  {formatki.reduce((sum, f) => sum + pozostaleIlosci[f.id], 0)} szt. pozostało
                </Tag>
                {activePaleta && saPozostaleFormatki && (
                  <Popconfirm
                    title="Dodać wszystkie pozostałe formatki do aktywnej palety?"
                    description="Ta operacja doda wszystkie pozostałe formatki do obecnie wybranej palety."
                    onConfirm={() => dodajWszystkieReszteFormatek(activePaleta.id)}
                    okText="Dodaj wszystkie"
                    cancelText="Anuluj"
                  >
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<ThunderboltOutlined />}
                      ghost
                      style={{ borderColor: '#52c41a', color: '#52c41a' }}
                    >
                      Dodaj resztę
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            }
          >
            <Table
              dataSource={formatki}
              size="small"
              pagination={false}
              rowKey="id"
              columns={[
                {
                  title: 'Formatka',
                  dataIndex: 'nazwa',
                  render: (text, record) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>{text}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.dlugosc}×{record.szerokosc}×{record.grubosc}mm
                      </Text>
                    </Space>
                  )
                },
                {
                  title: 'Kolor',
                  dataIndex: 'kolor',
                  width: 80,
                  render: (text) => <Tag>{text}</Tag>
                },
                {
                  title: 'Pozostało',
                  width: 100,
                  render: (_, record) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>{pozostaleIlosci[record.id]} szt.</Text>
                      <Progress 
                        percent={100 - (pozostaleIlosci[record.id] / record.ilosc_planowana) * 100} 
                        size="small"
                        showInfo={false}
                      />
                    </Space>
                  )
                },
                {
                  title: 'Dodaj',
                  width: 160,
                  render: (_, record) => {
                    if (!activePaleta) {
                      return <Text type="secondary">Wybierz paletę</Text>;
                    }
                    
                    const isEditing = editingFormatka === record.id;
                    const currentIlosc = activePaleta.formatki.find(f => f.formatka_id === record.id)?.ilosc || 0;
                    const dostepne = pozostaleIlosci[record.id];
                    
                    if (isEditing) {
                      return (
                        <Space size={4}>
                          <InputNumber
                            size="small"
                            min={1}
                            max={dostepne + currentIlosc}
                            value={tempIlosci[record.id] || currentIlosc || 1}
                            onChange={(value) => setTempIlosci(prev => ({
                              ...prev,
                              [record.id]: value || 1
                            }))}
                            style={{ width: 60 }}
                            onPressEnter={() => handleDodajFormatki(record.id)}
                          />
                          <Button 
                            size="small" 
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleDodajFormatki(record.id)}
                          />
                          <Button 
                            size="small" 
                            onClick={() => {
                              setEditingFormatka(null);
                              setTempIlosci(prev => ({ ...prev, [record.id]: 1 }));
                            }}
                          >
                            ✕
                          </Button>
                        </Space>
                      );
                    }
                    
                    return (
                      <Space size={4}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingFormatka(record.id);
                            setTempIlosci(prev => ({
                              ...prev,
                              [record.id]: currentIlosc || 1
                            }));
                          }}
                          disabled={dostepne === 0 && currentIlosc === 0}
                        >
                          {currentIlosc > 0 ? `${currentIlosc} szt.` : 'Dodaj'}
                        </Button>
                        
                        {dostepne > 0 && (
                          <Tooltip title={`Dodaj wszystkie ${dostepne} szt.`}>
                            <Button
                              size="small"
                              icon={<PlusCircleOutlined />}
                              onClick={() => dodajWszystkieFormatki(activePaleta.id, record.id)}
                              style={{ 
                                borderColor: '#52c41a', 
                                color: '#52c41a' 
                              }}
                            >
                              Wszystkie
                            </Button>
                          </Tooltip>
                        )}
                      </Space>
                    );
                  }
                }
              ]}
            />
          </Card>
        </Col>

        {/* Panel palet */}
        <Col span={14}>
          <Card 
            title="Palety"
            size="small"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={utworzPalete}
                >
                  Nowa paleta
                </Button>
                <Button 
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={handleSaveAll}
                  disabled={palety.length === 0}
                  loading={saving}
                  style={{ 
                    background: '#52c41a', 
                    borderColor: '#52c41a' 
                  }}
                >
                  💾 Zapisz wszystkie ({palety.length})
                </Button>
              </Space>
            }
          >
            {/* Lista palet */}
            <Space direction="vertical" style={{ width: '100%' }}>
              {palety.map(paleta => {
                const paletaStats = obliczStatystykiPalety(paleta);
                const isActive = paleta.id === selectedPaleta;
                const destination = PALLET_DESTINATIONS[paleta.przeznaczenie];
                
                return (
                  <Card
                    key={paleta.id}
                    size="small"
                    style={{ 
                      border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      backgroundColor: isActive ? '#f0f8ff' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedPaleta(paleta.id)}
                  >
                    <Row gutter={16} align="middle">
                      <Col span={4}>
                        <Space direction="vertical" size={0}>
                          <Text strong>{paleta.numer}</Text>
                          <Tag color={destination.color} icon={destination.icon}>
                            {destination.label}
                          </Tag>
                        </Space>
                      </Col>
                      
                      <Col span={8}>
                        <Space direction="vertical" size={0}>
                          <Text>Formatek: <strong>{paletaStats.sztuk} szt.</strong></Text>
                          <Text>Waga: <strong>{paletaStats.waga.toFixed(1)} kg</strong></Text>
                          <Text>Wysokość: <strong>{paletaStats.wysokosc} mm</strong></Text>
                        </Space>
                      </Col>
                      
                      <Col span={6}>
                        <Space direction="vertical" size={4}>
                          <Progress 
                            percent={Math.round(paletaStats.wykorzystanieWagi)} 
                            size="small"
                            strokeColor={paletaStats.wykorzystanieWagi > 90 ? '#ff4d4f' : '#52c41a'}
                            format={() => `${paletaStats.waga.toFixed(0)}/${paleta.max_waga}kg`}
                          />
                          <Progress 
                            percent={Math.round(paletaStats.wykorzystanieWysokosci)} 
                            size="small"
                            strokeColor={paletaStats.wykorzystanieWysokosci > 90 ? '#ff4d4f' : '#1890ff'}
                            format={() => `${paletaStats.wysokosc}/${paleta.max_wysokosc}mm`}
                          />
                        </Space>
                      </Col>
                      
                      <Col span={6}>
                        <Space>
                          <Select
                            size="small"
                            value={paleta.przeznaczenie}
                            onChange={(value) => zmienPrzeznaczenie(paleta.id, value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: 120 }}
                          >
                            {Object.entries(PALLET_DESTINATIONS).map(([key, dest]) => (
                              <Option key={key} value={key}>
                                <Space>
                                  {dest.icon}
                                  {dest.label}
                                </Space>
                              </Option>
                            ))}
                          </Select>
                          <Tooltip title="Kopiuj paletę">
                            <Button 
                              size="small" 
                              icon={<CopyOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                kopiujPalete(paleta.id);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="Usuń paletę">
                            <Button 
                              size="small" 
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                usunPalete(paleta.id);
                              }}
                            />
                          </Tooltip>
                        </Space>
                      </Col>
                    </Row>
                    
                    {/* Dodaj przycisk "Dodaj resztę" bezpośrednio w palecie */}
                    {isActive && saPozostaleFormatki && (
                      <Row style={{ marginTop: 8 }}>
                        <Col span={24}>
                          <Popconfirm
                            title="Dodać wszystkie pozostałe formatki do tej palety?"
                            description={`Zostanie dodanych ${Object.values(pozostaleIlosci).reduce((sum, ilosc) => sum + Math.max(0, ilosc), 0)} formatek`}
                            onConfirm={() => dodajWszystkieReszteFormatek(paleta.id)}
                            okText="Dodaj wszystkie"
                            cancelText="Anuluj"
                          >
                            <Button 
                              type="dashed" 
                              icon={<ThunderboltOutlined />}
                              style={{ 
                                width: '100%',
                                borderColor: '#52c41a',
                                color: '#52c41a'
                              }}
                            >
                              📦 Dodaj wszystkie pozostałe formatki ({Object.values(pozostaleIlosci).reduce((sum, ilosc) => sum + Math.max(0, ilosc), 0)} szt.)
                            </Button>
                          </Popconfirm>
                        </Col>
                      </Row>
                    )}
                    
                    {isActive && paleta.formatki.length > 0 && (
                      <>
                        <Divider style={{ margin: '12px 0' }} />
                        <Table
                          dataSource={paleta.formatki}
                          size="small"
                          pagination={false}
                          rowKey="formatka_id"
                          columns={[
                            {
                              title: 'Formatka',
                              render: (_, record) => {
                                const formatka = formatki.find(f => f.id === record.formatka_id);
                                return formatka ? (
                                  <Space size={4}>
                                    <Text>{formatka.nazwa}</Text>
                                    <Tag size="small">{formatka.kolor}</Tag>
                                  </Space>
                                ) : null;
                              }
                            },
                            {
                              title: 'Ilość',
                              dataIndex: 'ilosc',
                              width: 80,
                              render: (text) => <Text strong>{text} szt.</Text>
                            },
                            {
                              title: 'Waga',
                              width: 80,
                              render: (_, record) => {
                                const formatka = formatki.find(f => f.id === record.formatka_id);
                                return formatka ? (
                                  <Text>{(record.ilosc * formatka.waga_sztuka).toFixed(1)} kg</Text>
                                ) : null;
                              }
                            },
                            {
                              title: '',
                              width: 40,
                              render: (_, record) => (
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => usunFormatkiZPalety(paleta.id, record.formatka_id)}
                                />
                              )
                            }
                          ]}
                        />
                      </>
                    )}
                    
                    {isActive && paletaStats.wykorzystanieWagi > 90 && (
                      <Alert
                        message="Uwaga na wagę!"
                        description={`Paleta przekracza 90% maksymalnej wagi (${paleta.max_waga}kg)`}
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                );
              })}
              
              {palety.length === 0 && (
                <Empty 
                  description="Brak utworzonych palet"
                  style={{ padding: 40 }}
                >
                  <Button type="primary" onClick={utworzPalete}>
                    Utwórz pierwszą paletę
                  </Button>
                </Empty>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Podsumowanie */}
      <Card style={{ marginTop: 16 }} size="small">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Palety utworzone" 
              value={palety.length}
              prefix={<AppstoreOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Formatki przypisane" 
              value={formatki.reduce((sum, f) => sum + f.ilosc_planowana - pozostaleIlosci[f.id], 0)}
              suffix={`/ ${formatki.reduce((sum, f) => sum + f.ilosc_planowana, 0)}`}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Łączna waga" 
              value={palety.reduce((sum, p) => sum + obliczStatystykiPalety(p).waga, 0).toFixed(0)}
              suffix="kg"
            />
          </Col>
          <Col span={6}>
            <Space wrap>
              {Object.entries(PALLET_DESTINATIONS).map(([key, dest]) => {
                const count = palety.filter(p => p.przeznaczenie === key).length;
                if (count === 0) return null;
                return (
                  <Tag key={key} color={dest.color} icon={dest.icon}>
                    {dest.label}: {count}
                  </Tag>
                );
              })}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Akcje masowe */}
      {palety.length > 0 && (
        <Card style={{ marginTop: 16 }} size="small">
          <Row justify="center">
            <Col>
              <Space size="large">
                <Button 
                  type="primary"
                  icon={<SaveOutlined />}
                  size="large"
                  onClick={handleSaveAll}
                  loading={saving}
                  style={{ 
                    background: '#52c41a', 
                    borderColor: '#52c41a',
                    minWidth: 180
                  }}
                >
                  💾 Zapisz wszystkie palety
                </Button>
                
                <Popconfirm
                  title="Czy na pewno wyczyścić wszystkie palety?"
                  description="Ta operacja usunie wszystkie utworzone palety z pamięci."
                  onConfirm={() => {
                    setPalety([]);
                    setSelectedPaleta(null);
                    message.success('Wyczyszczono wszystkie palety');
                  }}
                  okText="Wyczyść"
                  cancelText="Anuluj"
                  okButtonProps={{ danger: true }}
                >
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    size="large"
                  >
                    🗑️ Wyczyść wszystkie
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};