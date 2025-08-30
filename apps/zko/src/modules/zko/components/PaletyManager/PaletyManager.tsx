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
  Popconfirm
} from 'antd';
import { 
  AppstoreOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ReloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { PaletaPrzeniesFormatki } from './PaletaPrzeniesFormatki';
import { PaletaDetails } from './PaletaDetails';
import { PaletyStats } from './components/PaletyStats';
import { PaletyTable } from './components/PaletyTable';
import { PlanowanieModal, PlanowaniePaletParams } from './components/PlanowanieModal';
import { LIMITY_PALETY, MESSAGES } from './types';

const { Text } = Typography;

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  ilosc_formatek: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids: number[];
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

  useEffect(() => {
    fetchPalety();
  }, [zkoId]);

  const fetchPalety = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pallets/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPalety(data.palety || []);
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

  /**
   * NOWA FUNKCJA - używa pal_planuj_inteligentnie_v5
   */
  const handlePlanujPaletyV5 = async (params: PlanowaniePaletParams) => {
    try {
      setLoading(true);
      
      // Walidacja
      if (!params.max_waga_kg || params.max_waga_kg < LIMITY_PALETY.MIN_WAGA_KG) {
        message.error(MESSAGES.WEIGHT_REQUIRED + ` (min: ${LIMITY_PALETY.MIN_WAGA_KG} kg)`);
        return;
      }
      
      // Wywołaj nową funkcję PostgreSQL v5
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
          nadpisz_istniejace: false // Domyślnie nie nadpisuj
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
                  <p><strong>Rozplanowano:</strong> {stats.formatki_rozplanowane} formatek</p>
                  <p><strong>Średnie wykorzystanie:</strong> {stats.srednie_wykorzystanie}%</p>
                  <p><strong>Strategia:</strong> {stats.strategia_uzyta}</p>
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
          <p>Czy chcesz usunąć istniejące palety i utworzyć nowe używając strategii <strong>"{params.strategia}"</strong>?</p>
          <Alert
            message="Uwaga"
            description="Ta operacja usunie wszystkie istniejące palety i ich przypisania formatek."
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
          {previousResult.statystyki && (
            <Alert
              message="Informacje o istniejących paletach"
              description={`Obecnych palet: ${previousResult.statystyki.istniejace_palety}`}
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
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
          nadpisz_istniejace: true // Tym razem nadpisz
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

  /**
   * NOWA FUNKCJA - Inteligentne usuwanie palet
   */
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
          
          // Pokaż szczegóły operacji
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

  /**
   * NOWA FUNKCJA - Reorganizacja palet
   */
  const handleReorganizuj = async () => {
    Modal.confirm({
      title: 'Reorganizacja palet',
      icon: <ThunderboltOutlined />,
      content: (
        <div>
          <p>Reorganizacja palet połączy formatki na paletach w bardziej optymalny sposób.</p>
          <Alert
            message="Co zostanie zrobione:"
            description={
              <ul>
                <li>Usunięcie pustych palet</li>
                <li>Optymalne przegrupowanie formatek</li>
                <li>Minimalizacja liczby palet</li>
                <li>Maksymalizacja wykorzystania przestrzeni</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </div>
      ),
      okText: 'Tak, reorganizuj',
      cancelText: 'Anuluj',
      onOk: async () => {
        try {
          setLoading(true);
          
          const response = await fetch(`/api/pallets/zko/${zkoId}/reorganize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategia: 'optymalizacja',
              operator: 'user'
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.sukces) {
              message.success(result.komunikat);
              
              // Pokaż porównanie przed/po
              if (result.przed_reorganizacja && result.po_reorganizacji) {
                Modal.success({
                  title: 'Reorganizacja zakończona',
                  content: (
                    <div>
                      <p><strong>Przed:</strong> {result.przed_reorganizacja.liczba_palet} palet</p>
                      <p><strong>Po:</strong> {result.po_reorganizacji.liczba_palet} palet</p>
                      <p><strong>Wykorzystanie:</strong> {Number(result.po_reorganizacji.srednie_wykorzystanie).toFixed(1)}%</p>
                    </div>
                  )
                });
              }
              
              fetchPalety();
              onRefresh?.();
            } else {
              message.warning(result.komunikat);
            }
          } else {
            const error = await response.json();
            message.error(error.error || 'Błąd reorganizacji');
          }
        } catch (error) {
          console.error('Error reorganizing pallets:', error);
          message.error('Błąd reorganizacji palet');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePrzeniesFormatki = (source: Paleta) => {
    const otherPalety = palety.filter(p => p.id !== source.id);
    if (otherPalety.length === 0) {
      message.warning(MESSAGES.NO_PALLETS);
      return;
    }
    
    setSourcePaleta(source);
    setTargetPaleta(otherPalety[0]);
    setPrzeniesModalVisible(true);
  };

  const handleZamknijPalete = async (paletaId: number) => {
    try {
      const response = await fetch(`/api/pallets/${paletaId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'user',
          uwagi: 'Zamknięcie palety z poziomu aplikacji'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.CLOSE_SUCCESS);
          fetchPalety();
        } else {
          message.warning(result.komunikat || MESSAGES.CLOSE_ERROR);
        }
      }
    } catch (error) {
      console.error('Error closing pallet:', error);
      message.error(MESSAGES.CLOSE_ERROR);
    }
  };

  const handleViewDetails = (paleta: Paleta) => {
    setSelectedPaleta(paleta);
    setDetailsModalVisible(true);
  };

  // Statystyki do wyświetlenia
  const pustePalety = palety.filter(p => (p.ilosc_formatek || 0) === 0);
  const avgWykorzystanie = palety.length > 0 
    ? Math.round(palety.reduce((sum, p) => sum + (p.procent_wykorzystania || 0), 0) / palety.length)
    : 0;

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Zarządzanie paletami</Text>
          {loading && <Spin size="small" />}
          {avgWykorzystanie > 0 && (
            <Text type="secondary">
              (wykorzystanie: {avgWykorzystanie}%)
            </Text>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button 
            onClick={() => setPlanowanieModalVisible(true)}
            icon={<SettingOutlined />}
            type="primary"
            loading={loading}
          >
            Planuj V5
          </Button>
          
          {palety.length > 0 && (
            <>
              <Button 
                onClick={handleReorganizuj}
                icon={<ThunderboltOutlined />}
                loading={loading}
              >
                Reorganizuj
              </Button>
              
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
      styles={{
        body: { padding: '12px' }
      }}
    >
      {palety.length === 0 ? (
        <Alert
          message="Brak palet"
          description={
            <div>
              <p>Palety zostaną utworzone automatycznie po dodaniu pozycji do ZKO.</p>
              <p>Nowy algorytm V5 oferuje inteligentne planowanie z uwzględnieniem:</p>
              <ul>
                <li>Kolory i oklejanie formatek</li>
                <li>Optymalne wykorzystanie przestrzeni</li>
                <li>Limity wagi i wysokości</li>
                <li>Różne strategie paletyzacji</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          action={
            <Space direction="vertical">
              <Button 
                onClick={() => setPlanowanieModalVisible(true)} 
                type="primary"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Utwórz palety V5
              </Button>
            </Space>
          }
        />
      ) : (
        <>
          <PaletyStats palety={palety} />
          <PaletyTable
            palety={palety}
            loading={loading}
            onViewDetails={handleViewDetails}
            onTransferFormatki={handlePrzeniesFormatki}
            onClosePaleta={handleZamknijPalete}
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

      {sourcePaleta && targetPaleta && (
        <PaletaPrzeniesFormatki
          visible={przeniesModalVisible}
          sourcePaleta={sourcePaleta}
          targetPaleta={targetPaleta}
          palety={palety}
          onClose={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
          }}
          onSuccess={() => {
            setPrzeniesModalVisible(false);
            setSourcePaleta(null);
            setTargetPaleta(null);
            fetchPalety();
            onRefresh?.();
          }}
        />
      )}

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