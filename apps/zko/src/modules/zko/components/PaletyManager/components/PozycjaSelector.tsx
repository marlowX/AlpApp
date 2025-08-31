import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space,
  Spin,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { PozycjaCard } from './PozycjaCard';

const { Text } = Typography;

interface Pozycja {
  id: number;
  numer_pozycji: number;
  nazwa_plyty: string;
  kolor_plyty: string;
  symbol_plyty: string;
  ilosc_plyt: number;
}

interface PozycjaStats {
  formatki_total: number;
  sztuk_planowanych: number;
  sztuk_w_paletach: number;
  sztuk_dostepnych: number;
  procent_zapaletyzowania: number;
}

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
}

export const PozycjaSelector: React.FC<PozycjaSelectorProps> = ({
  zkoId,
  selectedPozycjaId,
  onSelect,
  loading = false
}) => {
  const [pozycje, setPozycje] = useState<Pozycja[]>([]);
  const [loadingPozycje, setLoadingPozycje] = useState(false);
  const [pozycjeStats, setPozycjeStats] = useState<Record<number, PozycjaStats>>({});

  useEffect(() => {
    fetchPozycje();
  }, [zkoId]);

  const fetchPozycje = async () => {
    try {
      setLoadingPozycje(true);
      
      // Pobierz pozycje z ZKO
      const response = await fetch(`/api/zko/${zkoId}/pozycje`);
      if (response.ok) {
        const data = await response.json();
        const pozycjeData = data.pozycje || [];
        setPozycje(pozycjeData);
        
        // Pobierz statystyki formatek dla każdej pozycji
        await fetchPozycjeStats(pozycjeData);
        
        // Auto-select pozycji z dostępnymi formatkami
        if (pozycjeData.length === 1 && !selectedPozycjaId) {
          // Sprawdź czy ma dostępne formatki przed auto-select
          setTimeout(() => {
            const stats = pozycjeStats[pozycjeData[0].id];
            if (stats && stats.sztuk_dostepnych > 0) {
              onSelect(pozycjeData[0].id);
            }
          }, 500); // Poczekaj na pobranie statystyk
        }
      } else {
        console.error('Failed to fetch pozycje:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching pozycje:', error);
    } finally {
      setLoadingPozycje(false);
    }
  };

  const fetchPozycjeStats = async (pozycjeList: Pozycja[]) => {
    const stats: Record<number, PozycjaStats> = {};
    
    for (const pozycja of pozycjeList) {
      try {
        // Pobierz informacje o formatkach i paletach dla pozycji
        const response = await fetch(`/api/pallets/position/${pozycja.id}/available-formatki`);
        if (response.ok) {
          const data = await response.json();
          const podsumowanie = data.podsumowanie || {};
          
          // Oblicz statystyki
          stats[pozycja.id] = {
            formatki_total: podsumowanie.formatki_total || 0,
            sztuk_planowanych: podsumowanie.sztuk_planowanych || 0,
            sztuk_w_paletach: podsumowanie.sztuk_w_paletach || 0,
            sztuk_dostepnych: podsumowanie.sztuk_dostepnych || 0,
            procent_zapaletyzowania: podsumowanie.sztuk_planowanych > 0 
              ? Math.round((podsumowanie.sztuk_w_paletach / podsumowanie.sztuk_planowanych) * 100)
              : 0
          };
          
          console.log(`Pozycja ${pozycja.id} (#${pozycja.numer_pozycji}) stats:`, {
            api_response: podsumowanie,
            calculated_stats: stats[pozycja.id]
          });
        } else {
          console.warn(`Failed to fetch stats for pozycja ${pozycja.id}`);
          // Ustaw domyślne wartości
          stats[pozycja.id] = {
            formatki_total: 0,
            sztuk_planowanych: 0,
            sztuk_w_paletach: 0,
            sztuk_dostepnych: 0,
            procent_zapaletyzowania: 0
          };
        }
      } catch (error) {
        console.error(`Error fetching stats for pozycja ${pozycja.id}:`, error);
        // Ustaw domyślne wartości w przypadku błędu
        stats[pozycja.id] = {
          formatki_total: 0,
          sztuk_planowanych: 0,
          sztuk_w_paletach: 0,
          sztuk_dostepnych: 0,
          procent_zapaletyzowania: 0
        };
      }
    }
    
    setPozycjeStats(stats);
    
    // Auto-select dla jedynej pozycji z dostępnymi formatkami
    if (pozycjeList.length === 1 && !selectedPozycjaId) {
      const pozycja = pozycjeList[0];
      const pozycjaStats = stats[pozycja.id];
      
      if (pozycjaStats && pozycjaStats.sztuk_dostepnych > 0) {
        onSelect(pozycja.id);
      }
    }
  };

  const formatNumber = (num: number): string => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toString();
  };

  if (loadingPozycje) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin tip="Ładowanie pozycji ZKO..." />
        </div>
      </Card>
    );
  }

  if (pozycje.length === 0) {
    return (
      <Alert
        message="Brak pozycji w ZKO"
        description="To ZKO nie ma jeszcze zdefiniowanych pozycji do zarządzania paletami."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  const availablePozycje = pozycje.filter(p => {
    const stats = pozycjeStats[p.id];
    return stats && stats.sztuk_dostepnych > 0;
  });

  return (
    <Card 
      title={
        <Space>
          <AppstoreOutlined />
          <Text strong>Wybierz pozycję do zarządzania paletami</Text>
          <Tag color="blue">Pozycji: {pozycje.length}</Tag>
          {availablePozycje.length > 0 && (
            <Tag color="green">Dostępnych: {availablePozycje.length}</Tag>
          )}
          {selectedPozycjaId && (
            <Tag color="purple">Wybrana: #{pozycje.find(p => p.id === selectedPozycjaId)?.numer_pozycji}</Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* Grid pozycji */}
      <Row gutter={[16, 16]}>
        {pozycje.map(pozycja => {
          const stats = pozycjeStats[pozycja.id] || {
            formatki_total: 0,
            sztuk_planowanych: 0,
            sztuk_w_paletach: 0,
            sztuk_dostepnych: 0,
            procent_zapaletyzowania: 0
          };
          
          const isSelected = selectedPozycjaId === pozycja.id;
          const canBeSelected = stats.sztuk_dostepnych > 0;
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={pozycja.id}>
              <PozycjaCard
                pozycja={pozycja}
                stats={stats}
                isSelected={isSelected}
                canBeSelected={canBeSelected}
                onSelect={onSelect}
              />
            </Col>
          );
        })}
      </Row>

      {/* Podsumowanie wybranej pozycji */}
      {selectedPozycjaId && pozycjeStats[selectedPozycjaId] && (
        <Alert
          message="Wybrana pozycja"
          description={
            <Space>
              <Text>Pozycja #{pozycje.find(p => p.id === selectedPozycjaId)?.numer_pozycji}:</Text>
              <Text strong>{pozycje.find(p => p.id === selectedPozycjaId)?.nazwa_plyty}</Text>
              <Text>
                ({formatNumber(pozycjeStats[selectedPozycjaId].sztuk_dostepnych)} szt. do zapaletyzowania
                z {formatNumber(pozycjeStats[selectedPozycjaId].sztuk_planowanych)} planowanych)
              </Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* Ostrzeżenie gdy wszystkie pozycje są w pełni zapaletyzowane */}
      {pozycje.length > 0 && 
       Object.values(pozycjeStats).length > 0 &&
       Object.values(pozycjeStats).every(stats => stats.sztuk_dostepnych === 0) && (
        <Alert
          message="Brak pozycji do zarządzania"
          description="Wszystkie pozycje w tym ZKO mają już w pełni przypisane formatki do palet."
          type="warning"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Informacje pomocnicze */}
      {pozycje.length > availablePozycje.length && availablePozycje.length > 0 && (
        <Alert
          message={`Uwaga: ${pozycje.length - availablePozycje.length} pozycji jest w pełni zapaletyzowanych`}
          description="Niektóre pozycje nie są dostępne do wyboru, ponieważ wszystkie ich formatki zostały już przypisane do palet."
          type="info"
          style={{ marginTop: 16 }}
          showIcon
        />
      )}
    </Card>
  );
};