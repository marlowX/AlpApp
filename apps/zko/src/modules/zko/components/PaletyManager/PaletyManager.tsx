import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Modal, 
  message, 
  Alert,
  Spin,
  Typography,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  Tabs,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ReloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ToolOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';
import { PaletaDetails } from './PaletaDetails';
import { PaletyStats } from './components/PaletyStats';
import { PaletyTable } from './components/PaletyTable';
import { PlanowanieModal, PlanowaniePaletParams } from './components/PlanowanieModal';
import { PlanowanieModularneModal, PlanowanieModularneParams } from './components/PlanowanieModularneModal';
import { ManualPalletCreator } from './components/ManualPalletCreator';
import { LIMITY_PALETY, MESSAGES } from './types';

// 🆕 NOWY HOOK - Planowanie Modulariczne V2
import { usePaletyModular } from '../../hooks';

const { Text } = Typography;
const { TabPane } = Tabs;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  kolor: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

interface PozycjaFormatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_w_paletach: number;
  ilosc_dostepna: number;
  czy_w_pelni_przypisana: boolean;
}

interface PaletyManagerProps {
  zkoId: number;
  pozycjaId?: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  pozycjaId,
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [pozycjaFormatki, setPozycjaFormatki] = useState<PozycjaFormatka[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [planowanieModularneModalVisible, setPlanowanieModularneModalVisible] = useState(false);
  const [podsumowanie, setPodsumowanie] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('auto');

  // 🆕 NOWY HOOK - Planowanie Modularyczne V2
  const { 
    loading: modularLoading,
    error: modularError,
    planujModularnie,
    sprawdzIlosci,
    pelnyWorkflow,
    inteligentneZnalowanie
  } = usePaletyModular();

  useEffect(() => {
    fetchPalety();
    if (pozycjaId) {
      fetchPozycjaFormatki();
    }
  }, [zkoId, pozycjaId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      
      let response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      
      if (!response.ok) {
        response = await fetch(`/api/pallets/zko/${zkoId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        
        const mappedPalety = (data.palety || []).map((p: any) => ({
          ...p,
          ilosc_formatek: p.sztuk_total || p.ilosc_formatek || 0,
          procent_wykorzystania: p.sztuk_total 
            ? Math.round((p.sztuk_total / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)
            : p.procent_wykorzystania || 0
        }));
        
        setPalety(mappedPalety);
        setPodsumowanie(data.podsumowanie);
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
      console.error('Error fetching palety:', error);
      message.error(MESSAGES.PLAN_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 POPRAWIONA FUNKCJA - Pobierz formatki z pozycji z nowego endpointu
  const fetchPozycjaFormatki = async () => {
    if (!pozycjaId) return;
    
    try {
      const response = await fetch(`/api/pallets/position/${pozycjaId}/available-formatki`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.sukces) {
          // Przekształć formatki na format oczekiwany przez ManualPalletCreator
          const mappedFormatki = data.formatki.map((f: any) => ({
            id: f.id,
            nazwa: f.nazwa,
            dlugosc: Number(f.dlugosc),
            szerokosc: Number(f.szerokosc),
            grubosc: Number(f.grubosc),
            kolor: f.kolor,
            ilosc_planowana: f.ilosc_dostepna, // Używamy dostępnej ilości zamiast planowanej
            waga_sztuka: Number(f.waga_sztuka)
          }));
          
          setPozycjaFormatki(mappedFormatki);
          
          console.log('Fetched formatki:', data.podsumowanie);
        } else {
          console.error('Error in response:', data.error);
          message.error(data.error || 'Błąd pobierania formatek');
        }
      } else {
        const errorData = await response.json();
        console.error('HTTP error fetching formatki:', errorData);
        message.error('Błąd komunikacji z serwerem');
      }
    } catch (error) {
      console.error('Error fetching pozycja formatki:', error);
      message.error('Błąd pobierania formatek z pozycji');
    }
  };

  // 🔥 NOWA FUNKCJA - Utwórz paletę ze wszystkimi pozostałymi formatkami
  const handleCreateAllRemainingPallet = async (przeznaczenie: string = 'MAGAZYN') => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/pallets/manual/create-all-remaining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pozycja_id: pozycjaId,
          przeznaczenie,
          operator: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(`✅ Utworzono paletę ${data.numer_palety} ze wszystkimi pozostałymi formatkami (${data.total_sztuk} szt.)!`);
        
        // Odśwież listy
        await fetchPalety();
        await fetchPozycjaFormatki();
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        message.error(data.error || 'Błąd tworzenia palety');
      }
    } catch (error) {
      console.error('Error creating all-remaining pallet:', error);
      message.error('Błąd komunikacji z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 POPRAWIONA FUNKCJA - Zapisz ręcznie utworzone palety
  const handleSaveManualPallets = async (manualPalety: any[]) => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji - nie można zapisać palet');
      return;
    }

    if (manualPalety.length === 0) {
      message.warning('Brak palet do zapisania');
      return;
    }

    try {
      setLoading(true);
      
      const paletySaveData = manualPalety.map(paleta => ({
        formatki: paleta.formatki,
        przeznaczenie: paleta.przeznaczenie,
        max_waga: paleta.max_waga,
        max_wysokosc: paleta.max_wysokosc,
        operator: 'user',
        uwagi: paleta.uwagi || null
      }));

      console.log('Saving pallets to database:', {
        pozycja_id: pozycjaId,
        palety: paletySaveData
      });

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
        message.success(`✅ Zapisano ${data.palety_utworzone.length} palet do bazy danych!`);
        
        // Odśwież listy
        await fetchPalety();
        await fetchPozycjaFormatki(); // Odśwież dostępne formatki
        
        // Wywołaj callback
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error('Save error:', data);
        message.error(data.error || 'Błąd zapisywania palet do bazy danych');
      }
    } catch (error) {
      console.error('Error saving manual pallets:', error);
      message.error('Błąd komunikacji z serwerem podczas zapisywania palet');
    } finally {
      setLoading(false);
    }
  };

  // Funkcje planowania
  const handlePlanujModularnieModal = async (params: PlanowanieModularneParams) => {
    try {
      const result = await planujModularnie(zkoId, params);
      if (result) {
        message.success('Planowanie modulariczne zakończone pomyślnie!');
        setPlanowanieModularneModalVisible(false);
        fetchPalety();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error in modular planning:', error);
      message.error('Błąd planowania modularicznego V2');
    }
  };

  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  const renderFormatkiDetails = (paleta: Paleta) => {
    if (!paleta.formatki_szczegoly || paleta.formatki_szczegoly.length === 0) {
      return <Text type="secondary">Brak formatek</Text>;
    }

    return (
      <Tooltip
        title={
          <div>
            {paleta.formatki_szczegoly.map((f: FormatkaDetail) => (
              <div key={f.formatka_id}>
                {f.nazwa}: {f.ilosc} szt.
              </div>
            ))}
          </div>
        }
      >
        <Space direction="vertical" size={0}>
          <Text strong>{paleta.sztuk_total || paleta.ilosc_formatek} szt.</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {paleta.formatki_szczegoly.length} typów
          </Text>
        </Space>
      </Tooltip>
    );
  };

  const hasModularError = modularError !== null;
  const totalAvailableFormatki = pozycjaFormatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Zarządzanie paletami</Text>
          {(loading || modularLoading) && <Spin size="small" />}
          {podsumowanie && (
            <Tooltip title={`${podsumowanie.typy_formatek} typów, ${podsumowanie.sztuk_total} sztuk`}>
              <InfoCircleOutlined />
            </Tooltip>
          )}
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Zakładka automatycznego planowania */}
        <TabPane 
          tab={
            <span>
              <ThunderboltOutlined />
              Planowanie automatyczne
            </span>
          } 
          key="auto"
        >
          {hasModularError && (
            <Alert
              message="Błąd Planowania V2"
              description={modularError}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Space style={{ marginBottom: 16 }} wrap>
            <Button 
              onClick={async () => {
                const result = await inteligentneZnalowanie(zkoId, {
                  max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
                  max_formatek_na_palete: 80,
                  operator: 'user'
                });
                if (result) {
                  message.success('Planowanie zakończone');
                  fetchPalety();
                }
              }}
              icon={<ThunderboltOutlined />}
              type="primary"
              loading={modularLoading}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Szybko
            </Button>
            
            <Button 
              onClick={() => setPlanowanieModularneModalVisible(true)}
              icon={<StarOutlined />}
              type="primary"
              loading={modularLoading}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              Planuj V2
            </Button>
            
            <Button 
              onClick={() => setPlanowanieModalVisible(true)}
              icon={<SettingOutlined />}
              loading={loading}
            >
              V5
            </Button>
            
            <Button 
              onClick={fetchPalety}
              icon={<ReloadOutlined />}
              loading={loading}
            >
              Odśwież
            </Button>
          </Space>

          {palety.length === 0 ? (
            <Alert
              message="Brak palet"
              description="Użyj przycisków powyżej lub przejdź do zakładki 'Ręczne tworzenie' aby utworzyć palety."
              type="info"
              showIcon
            />
          ) : (
            <>
              {podsumowanie && (
                <Alert
                  message="Podsumowanie ZKO"
                  description={`${podsumowanie.typy_formatek} typów formatek, ${podsumowanie.sztuk_total} sztuk do produkcji`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <PaletyStats palety={palety} />
              <PaletyTable
                palety={palety}
                loading={loading}
                onViewDetails={handleViewDetails}
                renderFormatkiColumn={renderFormatkiDetails}
              />
            </>
          )}
        </TabPane>

        {/* 🆕 ZAKŁADKA - Ręczne tworzenie palet */}
        <TabPane 
          tab={
            <span>
              <EditOutlined />
              Ręczne tworzenie
              {totalAvailableFormatki > 0 && (
                <Tag 
                  color="green" 
                  style={{ marginLeft: 8 }}
                >
                  {totalAvailableFormatki} szt.
                </Tag>
              )}
            </span>
          } 
          key="manual"
        >
          {pozycjaId ? (
            <>
              {/* Sekcja akcji szybkich */}
              {totalAvailableFormatki > 0 && (
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Row gutter={16} align="middle">
                    <Col span={16}>
                      <Space direction="vertical" size={0}>
                        <Text strong>🚀 Akcje szybkie</Text>
                        <Text type="secondary">
                          Dostępnych {totalAvailableFormatki} formatek w {pozycjaFormatki.filter(f => f.ilosc_dostepna > 0).length} typach
                        </Text>
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Space>
                        <Popconfirm
                          title="Utworzyć paletę ze wszystkimi pozostałymi formatkami?"
                          description={`Zostanie utworzona pojedyncza paleta z ${totalAvailableFormatki} formatkami`}
                          onConfirm={() => handleCreateAllRemainingPallet('MAGAZYN')}
                          okText="Utwórz"
                          cancelText="Anuluj"
                        >
                          <Button 
                            type="primary"
                            icon={<PlusCircleOutlined />}
                            style={{ 
                              background: '#52c41a', 
                              borderColor: '#52c41a'
                            }}
                          >
                            📦 Utwórz paletę ze wszystkimi
                          </Button>
                        </Popconfirm>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* Status formatek */}
              {pozycjaFormatki.length === 0 ? (
                <Alert
                  message="Pobieranie formatek..."
                  description="Ładowanie dostępnych formatek z pozycji."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : totalAvailableFormatki === 0 ? (
                <Alert
                  message="✅ Wszystkie formatki przypisane"
                  description="Wszystkie formatki z tej pozycji zostały już przypisane do palet."
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Alert
                  message={`📋 Dostępne formatki: ${totalAvailableFormatki} szt.`}
                  description={`${pozycjaFormatki.filter(f => f.ilosc_dostepna > 0).length} typów formatek gotowych do przypisania do palet.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <ManualPalletCreator
                pozycjaId={pozycjaId}
                formatki={pozycjaFormatki}
                onSave={handleSaveManualPallets}
                loading={loading}
              />
            </>
          ) : (
            <Alert
              message="Brak danych pozycji"
              description="Aby korzystać z ręcznego tworzenia palet, musisz wybrać konkretną pozycję ZKO."
              type="warning"
              showIcon
            />
          )}
        </TabPane>

        {/* Zakładka wizualizacji */}
        <TabPane 
          tab={
            <span>
              <ToolOutlined />
              Przeznaczenie palet
            </span>
          } 
          key="destination"
        >
          <Alert
            message="Przeznaczenie palet"
            description="Przegląd palet według ich przeznaczenia w procesie produkcyjnym."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {/* Grupowanie palet według przeznaczenia */}
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="📦 Magazyn" 
                  value={palety.filter(p => p.przeznaczenie === 'MAGAZYN').length}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="🎨 Okleiniarka" 
                  value={palety.filter(p => p.przeznaczenie === 'OKLEINIARKA').length}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="🔧 Wiercenie" 
                  value={palety.filter(p => p.przeznaczenie === 'WIERCENIE').length}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="✂️ Cięcie" 
                  value={palety.filter(p => p.przeznaczenie === 'CIECIE').length}
                />
              </Card>
            </Col>
          </Row>
          
          {/* Lista palet z przeznaczeniem */}
          <Table
            style={{ marginTop: 16 }}
            dataSource={palety}
            rowKey="id"
            columns={[
              {
                title: 'Numer palety',
                dataIndex: 'numer_palety',
                key: 'numer_palety',
              },
              {
                title: 'Przeznaczenie',
                dataIndex: 'przeznaczenie',
                key: 'przeznaczenie',
                render: (val) => {
                  const destinations: Record<string, { color: string; icon: string }> = {
                    'MAGAZYN': { color: 'blue', icon: '📦' },
                    'OKLEINIARKA': { color: 'orange', icon: '🎨' },
                    'WIERCENIE': { color: 'purple', icon: '🔧' },
                    'CIECIE': { color: 'red', icon: '✂️' },
                    'WYSYLKA': { color: 'green', icon: '✅' }
                  };
                  const dest = destinations[val] || { color: 'default', icon: '❓' };
                  return <Tag color={dest.color}>{dest.icon} {val || 'Nieoznaczona'}</Tag>;
                }
              },
              {
                title: 'Formatek',
                dataIndex: 'ilosc_formatek',
                key: 'ilosc_formatek',
                render: (val) => `${val} szt.`
              },
              {
                title: 'Waga',
                dataIndex: 'waga_kg',
                key: 'waga_kg',
                render: (val) => val ? `${val.toFixed(1)} kg` : '-'
              },
              {
                title: 'Kolory',
                dataIndex: 'kolory_na_palecie',
                key: 'kolory_na_palecie',
                render: (val) => val || '-'
              }
            ]}
            pagination={false}
          />
        </TabPane>
      </Tabs>

      {/* Modale */}
      {planowanieModalVisible && (
        <PlanowanieModal
          visible={planowanieModalVisible}
          loading={loading}
          initialValues={{
            max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
            max_waga_kg: LIMITY_PALETY.DOMYSLNA_WAGA_KG,
            max_formatek_na_palete: 200,
            grubosc_plyty: LIMITY_PALETY.GRUBOSC_PLYTY_DEFAULT,
            strategia: 'inteligentna',
            typ_palety: 'EURO',
            uwzglednij_oklejanie: true
          }}
          onCancel={() => setPlanowanieModalVisible(false)}
          onOk={async (params) => {
            // Tu dodaj obsługę planowania V5
            setPlanowanieModalVisible(false);
            message.info('Planowanie V5 - funkcja do implementacji');
          }}
        />
      )}

      <PlanowanieModularneModal
        visible={planowanieModularneModalVisible}
        loading={modularLoading}
        initialValues={{
          max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
          max_formatek_na_palete: 80,
          nadpisz_istniejace: false,
          operator: 'user'
        }}
        onCancel={() => setPlanowanieModularneModalVisible(false)}
        onOk={handlePlanujModularnieModal}
      />

      {selectedPaleta && (
        <PaletaDetails
          visible={detailsModalVisible}
          paleta={selectedPaleta}
          onClose={() => {
            setDetailsModalVisible(false);
            setSelectedPaleta(null);
          }}
        />
      )}
    </Card>
  );
};