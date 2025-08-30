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
  Tooltip
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
  CheckCircleOutlined
} from '@ant-design/icons';
import { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';
import { PaletaDetails } from './PaletaDetails';
import { PaletyStats } from './components/PaletyStats';
import { PaletyTable } from './components/PaletyTable';
import { PlanowanieModal, PlanowaniePaletParams } from './components/PlanowanieModal';
import { LIMITY_PALETY, MESSAGES } from './types';

// 🆕 NOWY HOOK - Planowanie Modulariczne V2
import { usePaletyModular } from '../../hooks';

const { Text } = Typography;

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
  sztuk_total?: number; // Nowe - rzeczywista liczba sztuk
  ilosc_formatek?: number; // Stare - dla kompatybilności
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[]; // Nowe - szczegóły z ilościami
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
}

interface PaletyManagerProps {
  zkoId: number;
  onRefresh?: () => void;
}

export const PaletyManager: React.FC<PaletyManagerProps> = ({ 
  zkoId, 
  onRefresh 
}) => {
  const [palety, setPalety] = useState<Paleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaleta, setSelectedPaleta] = useState<Paleta | null>(null);
  const [przeniesModalVisible, setPrzeniesModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [planowanieModalVisible, setPlanowanieModalVisible] = useState(false);
  const [sourcePaleta, setSourcePaleta] = useState<Paleta | null>(null);
  const [targetPaleta, setTargetPaleta] = useState<Paleta | null>(null);
  const [podsumowanie, setPodsumowanie] = useState<any>(null);

  // 🆕 NOWY HOOK - Planowanie Modularyczne V2
  const { 
    loading: modularLoading,
    error: modularError,
    planujModularnie,
    sprawdzIlosci,
    pelnyWorkflow
  } = usePaletyModular();

  useEffect(() => {
    fetchPalety();
  }, [zkoId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      
      // Próbuj pobrać szczegółowe dane z nowego endpointu
      let response = await fetch(`/api/pallets/zko/${zkoId}/details`);
      
      if (!response.ok) {
        // Fallback do starego endpointu
        response = await fetch(`/api/pallets/zko/${zkoId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        
        // Mapuj dane do jednolitego formatu
        const mappedPalety = (data.palety || []).map((p: any) => ({
          ...p,
          // Użyj sztuk_total jeśli dostępne, w przeciwnym razie ilosc_formatek
          ilosc_formatek: p.sztuk_total || p.ilosc_formatek || 0,
          // Oblicz procent wykorzystania
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

  // 🆕 NOWE PLANOWANIE MODULARYCZNE V2
  const handlePlanujModularnie = async () => {
    try {
      const result = await pelnyWorkflow(zkoId, {
        max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
        max_formatek_na_palete: 80,
        nadpisz_istniejace: true,
        operator: 'user'
      });

      if (result) {
        message.success('🎉 Planowanie modulariczne zakończone pomyślnie!');
        
        // Pokaż szczegóły
        if (result.szczegoly?.palety?.length > 0) {
          Modal.success({
            title: '✅ Planowanie V2 - Sukces!',
            content: (
              <div>
                <p><strong>📦 Utworzono palet:</strong> {result.szczegoly.palety.length}</p>
                <p><strong>🔢 Total sztuk:</strong> {result.weryfikacja?.podsumowanie?.zko?.total_sztuk}</p>
                <p><strong>📊 Status weryfikacji:</strong> 
                  {result.weryfikacja?.status === 'OK' ? 
                    <Tag color="green">✅ OK</Tag> : 
                    <Tag color="orange">⚠️ NEEDS_FIX</Tag>
                  }
                </p>
                <p><strong>🧩 Formatek typów:</strong> {result.weryfikacja?.podsumowanie?.zko?.typy_formatek}</p>
                <Alert
                  message="💡 Planowanie V2"
                  description="Używa poprawnych funkcji modularnych z obsługą rzeczywistych ilości formatek!"
                  type="success"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              </div>
            ),
            width: 500
          });
        }
        
        fetchPalety();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error in modular planning:', error);
      message.error('Błąd planowania modularycznego V2');
    }
  };

  // 🆕 SPRAWDZENIE STATUSU ILOŚCI
  const handleSprawdzStatus = async () => {
    try {
      const result = await sprawdzIlosci(zkoId);
      
      if (result) {
        Modal.info({
          title: '📊 Status Ilości Formatek',
          content: (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Tag color={result.status === 'OK' ? 'green' : 'orange'} style={{ fontSize: 14 }}>
                  {result.status === 'OK' ? '✅ OK' : '⚠️ NEEDS_FIX'}
                </Tag>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <Text strong>ZKO Formatki</Text>
                  <div>{result.podsumowanie?.zko?.total_sztuk || 0} sztuk</div>
                  <Text type="secondary">{result.podsumowanie?.zko?.typy_formatek || 0} typów</Text>
                </div>
                <div>
                  <Text strong>Palety</Text>
                  <div>{result.podsumowanie?.palety?.liczba_palet || 0} palet</div>
                  <Text type="secondary">{result.podsumowanie?.palety?.total_sztuk || 0} sztuk</Text>
                </div>
                <div>
                  <Text strong>Tabela Ilości</Text>
                  <div>{result.podsumowanie?.tabela_ilosc?.wpisy || 0} wpisów</div>
                  <Text type="secondary">{result.podsumowanie?.tabela_ilosc?.total_sztuk || 0} sztuk</Text>
                </div>
              </div>

              <div>
                <Text strong>Zgodność:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={result.zgodnosc?.zko_vs_palety ? 'green' : 'red'}>
                    {result.zgodnosc?.zko_vs_palety ? '✅' : '❌'} ZKO ↔ Palety
                  </Tag>
                  <Tag color={result.zgodnosc?.palety_vs_ilosc ? 'green' : 'red'}>
                    {result.zgodnosc?.palety_vs_ilosc ? '✅' : '❌'} Palety ↔ Ilości  
                  </Tag>
                  <Tag color={result.zgodnosc?.tabela_ilosc_wypelniona ? 'green' : 'red'}>
                    {result.zgodnosc?.tabela_ilosc_wypelniona ? '✅' : '❌'} Tabela Wypełniona
                  </Tag>
                </div>
              </div>

              {result.status !== 'OK' && (
                <Alert
                  message="⚠️ Wykryto Niezgodności"
                  description="Użyj planowania V2 aby naprawić problemy z ilościami"
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </div>
          ),
          width: 600
        });
      }
    } catch (error) {
      console.error('Error checking quantities:', error);
      message.error('Błąd sprawdzania ilości');
    }
  };

  const handlePlanujPaletyV5 = async (params: PlanowaniePaletParams) => {
    try {
      setLoading(true);
      
      // Walidacja
      if (!params.max_waga_kg || params.max_waga_kg < LIMITY_PALETY.MIN_WAGA_KG) {
        message.error(MESSAGES.WEIGHT_REQUIRED + ` (min: ${LIMITY_PALETY.MIN_WAGA_KG} kg)`);
        return;
      }
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan-v5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategia: params.strategia || 'inteligentna',
          max_wysokosc_mm: params.max_wysokosc_mm,
          max_formatek_na_palete: params.max_formatek_na_palete,
          max_waga_kg: params.max_waga_kg,
          grubosc_plyty: params.grubosc_plyty,
          typ_palety: params.typ_palety,
          uwzglednij_oklejanie: params.uwzglednij_oklejanie,
          nadpisz_istniejace: false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.PLAN_SUCCESS);
          
          // Pokaż szczegóły planowania
          if (result.statystyki) {
            const stats = result.statystyki;
            Modal.success({
              title: 'Planowanie zakończone pomyślnie',
              content: (
                <div>
                  <p><strong>Utworzono:</strong> {stats.palety_utworzone} palet</p>
                  {stats.sztuk_total && (
                    <p><strong>Rozplanowano:</strong> {stats.sztuk_total} sztuk</p>
                  )}
                  {stats.formatki_typy && (
                    <p><strong>Typy formatek:</strong> {stats.formatki_typy}</p>
                  )}
                  <p><strong>Średnie wykorzystanie:</strong> {stats.srednie_wykorzystanie || 0}%</p>
                  <p><strong>Strategia:</strong> {stats.strategia_uzyta}</p>
                  <Alert
                    message="⚠️ Uwaga - V5"
                    description="Funkcja V5 ma błąd z liczeniem ilości. Zalecamy planowanie V2!"
                    type="warning"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                </div>
              ),
              width: 500
            });
          }
          
          setPlanowanieModalVisible(false);
          fetchPalety();
          onRefresh?.();
        } else {
          // Sprawdź czy to problem z istniejącymi paletami
          if (result.komunikat && result.komunikat.includes('ma już')) {
            handleConfirmOverwritePallets(params, result);
          } else {
            message.warning(result.komunikat || 'Nie udało się zaplanować palet');
          }
        }
      } else {
        const error = await response.json();
        message.error(error.error || error.message || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
      console.error('Error planning pallets v5:', error);
      message.error(MESSAGES.PLAN_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOverwritePallets = (params: PlanowaniePaletParams, previousResult: any) => {
    Modal.confirm({
      title: 'Zastąpić istniejące palety?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Dla tego ZKO istnieją już palety ({palety.length} szt.).</p>
          <p>Czy chcesz usunąć istniejące palety i utworzyć nowe?</p>
          <Alert
            message="Uwaga"
            description="Ta operacja usunie wszystkie istniejące palety i ich przypisania formatek."
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: 'Tak, zastąp palety',
      cancelText: 'Anuluj',
      okButtonProps: { danger: true },
      onOk: async () => {
        await handlePlanujPaletyV5WithOverwrite(params);
      },
    });
  };

  const handlePlanujPaletyV5WithOverwrite = async (params: PlanowaniePaletParams) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/plan-v5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          nadpisz_istniejace: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.PLAN_SUCCESS);
          fetchPalety();
          onRefresh?.();
        } else {
          message.error(result.komunikat || MESSAGES.PLAN_ERROR);
        }
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.PLAN_ERROR);
      }
    } catch (error) {
      console.error('Error overwriting pallets:', error);
      message.error(MESSAGES.PLAN_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleUsunInteligentnie = async (tylkoPuste: boolean = false) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pallets/zko/${zkoId}/delete-smart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tylko_puste: tylkoPuste,
          force_usun: false,
          operator: 'user'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat);
          
          if (result.przeniesione_formatki > 0 || result.ostrzezenia?.length > 0) {
            Modal.info({
              title: 'Szczegóły usuwania palet',
              content: (
                <div>
                  <p><strong>Usunięto palet:</strong> {result.usuniete_palety?.length || 0}</p>
                  {result.przeniesione_formatki > 0 && (
                    <p><strong>Przeniesiono formatek:</strong> {result.przeniesione_formatki}</p>
                  )}
                  {result.ostrzezenia?.length > 0 && (
                    <div>
                      <p><strong>Ostrzeżenia:</strong></p>
                      <ul>
                        {result.ostrzezenia.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ),
              width: 600
            });
          }
          
          fetchPalety();
          onRefresh?.();
        } else {
          message.warning(result.komunikat);
        }
      } else {
        const error = await response.json();
        message.error(error.error || 'Błąd usuwania palet');
      }
    } catch (error) {
      console.error('Error smart deleting pallets:', error);
      message.error('Błąd usuwania palet');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  // Renderuj szczegóły formatek
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

  // Sprawdź czy są błędy modularnego planowania
  const hasModularError = modularError !== null;

  // Statystyki
  const pustePalety = palety.filter(p => (p.sztuk_total || p.ilosc_formatek || 0) === 0);
  const avgWykorzystanie = palety.length > 0 
    ? Math.round(palety.reduce((sum, p) => sum + (p.procent_wykorzystania || 0), 0) / palety.length)
    : 0;

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
      extra={
        <Space>
          {/* 🆕 NOWE PRZYCISKI V2 MODULAR */}
          <Button 
            onClick={handlePlanujModularnie}
            icon={<StarOutlined />}
            type="primary"
            loading={modularLoading}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            Planuj V2 ⭐
          </Button>
          
          <Button 
            onClick={handleSprawdzStatus}
            icon={<CheckCircleOutlined />}
            loading={modularLoading}
          >
            Sprawdź Status
          </Button>
          
          <Button 
            onClick={() => setPlanowanieModalVisible(true)}
            icon={<SettingOutlined />}
            loading={loading}
          >
            Planuj V5 ⚠️
          </Button>
          
          {palety.length > 0 && (
            <>
              {pustePalety.length > 0 && (
                <Button 
                  onClick={() => handleUsunInteligentnie(true)}
                  icon={<MinusOutlined />}
                  loading={loading}
                >
                  Usuń puste ({pustePalety.length})
                </Button>
              )}
              
              <Popconfirm
                title="Usuń wszystkie palety"
                description="Formatki zostaną przeniesione na pozostałe palety (jeśli to możliwe). Czy kontynuować?"
                onConfirm={() => handleUsunInteligentnie(false)}
                okText="Tak, usuń inteligentnie"
                cancelText="Anuluj"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  icon={<DeleteOutlined />}
                  danger
                  loading={loading}
                >
                  Usuń wszystkie
                </Button>
              </Popconfirm>
            </>
          )}
          
          <Button 
            onClick={fetchPalety}
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Odśwież
          </Button>
        </Space>
      }
    >
      {/* 🆕 BŁĄD MODULAR */}
      {hasModularError && (
        <Alert
          message="⚠️ Błąd Planowania V2"
          description={modularError}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      
      {palety.length === 0 ? (
        <Alert
          message="Brak palet"
          description={
            <div>
              <p>Palety zostaną utworzone automatycznie po dodaniu pozycji do ZKO.</p>
              {podsumowanie && podsumowanie.sztuk_total > 0 && (
                <Alert
                  message="Formatki do rozplanowania"
                  description={`${podsumowanie.typy_formatek} typów, ${podsumowanie.sztuk_total} sztuk`}
                  type="info"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </div>
          }
          type="info"
          showIcon
          action={
            <Space>
              <Button 
                onClick={handlePlanujModularnie}
                type="primary"
                loading={modularLoading}
                icon={<StarOutlined />}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                Planuj V2 ⭐
              </Button>
              <Button 
                onClick={() => setPlanowanieModalVisible(true)} 
                loading={loading}
                icon={<PlusOutlined />}
              >
                Planuj V5
              </Button>
            </Space>
          }
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

      {/* Modale */}
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
        onOk={handlePlanujPaletyV5}
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