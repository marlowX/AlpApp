/**
 * @fileoverview Komponent wyboru pozycji ZKO
 * @module PozycjaSelector
 * 
 * MAKSYMALNIE 300 LINII KODU!
 * Wyświetla kafle pozycji do wyboru z ID z bazy danych
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space,
  Spin,
  Alert,
  Empty
} from 'antd';
import { 
  CheckCircleOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { PozycjaCard } from './PozycjaCard';

const { Text, Title } = Typography;

interface Pozycja {
  id: number; // ID z bazy danych (np. 72)
  pozycja_id?: number; // Alternatywne ID
  numer_pozycji: number; // Numer kolejny (1, 2, 3...)
  nazwa_plyty: string;
  kolor_plyty: string;
  symbol_plyty?: string;
  ilosc_plyt: number;
  typy_formatek?: number;
  sztuk_formatek?: number;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zkoId) {
      fetchPozycje();
    }
  }, [zkoId]);

  const fetchPozycje = async () => {
    try {
      setLoadingPozycje(true);
      setError(null);
      
      const response = await fetch(`/api/zko/${zkoId}/pozycje`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Mapuj dane - zachowaj oryginalne ID z bazy
        const pozycjeData = (data.pozycje || []).map((p: any) => ({
          ...p,
          id: p.pozycja_id || p.id, // Używaj ID z bazy
          pozycja_id: p.pozycja_id || p.id, // Zapisz też jako pozycja_id
          numer_pozycji: p.numer_pozycji || 0, // Numer kolejny
          typy_formatek: p.typy_formatek || 0,
          sztuk_formatek: p.sztuk_formatek || 0
        }));
        
        console.log('Loaded pozycje:', pozycjeData.map((p: Pozycja) => ({
          id: p.id,
          numer: p.numer_pozycji,
          nazwa: p.nazwa_plyty
        })));
        
        setPozycje(pozycjeData);
        
        // Pobierz statystyki dla każdej pozycji
        if (pozycjeData.length > 0) {
          await fetchPozycjeStats(pozycjeData);
        }
        
        // Auto-select gdy jest tylko jedna pozycja
        if (pozycjeData.length === 1 && !selectedPozycjaId) {
          onSelect(pozycjeData[0].id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Błąd pobierania pozycji');
        console.error('Failed to fetch pozycje:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching pozycje:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoadingPozycje(false);
    }
  };

  const fetchPozycjeStats = async (pozycjeList: Pozycja[]) => {
    const stats: Record<number, PozycjaStats> = {};
    
    // Pobierz statystyki równolegle dla szybszego ładowania
    const promises = pozycjeList.map(async (pozycja) => {
      try {
        const response = await fetch(`/api/pallets/position/${pozycja.id}/available-formatki`);
        if (response.ok) {
          const data = await response.json();
          const podsumowanie = data.podsumowanie || {};
          
          stats[pozycja.id] = {
            formatki_total: podsumowanie.formatki_total || pozycja.typy_formatek || 0,
            sztuk_planowanych: podsumowanie.sztuk_planowanych || pozycja.sztuk_formatek || 0,
            sztuk_w_paletach: podsumowanie.sztuk_w_paletach || 0,
            sztuk_dostepnych: podsumowanie.sztuk_dostepnych || pozycja.sztuk_formatek || 0,
            procent_zapaletyzowania: podsumowanie.sztuk_planowanych > 0 
              ? Math.round((podsumowanie.sztuk_w_paletach / podsumowanie.sztuk_planowanych) * 100)
              : 0
          };
        } else {
          // Użyj danych z pozycji jako fallback
          stats[pozycja.id] = {
            formatki_total: pozycja.typy_formatek || 0,
            sztuk_planowanych: pozycja.sztuk_formatek || 0,
            sztuk_w_paletach: 0,
            sztuk_dostepnych: pozycja.sztuk_formatek || 0,
            procent_zapaletyzowania: 0
          };
        }
      } catch (error) {
        console.error(`Error fetching stats for pozycja ${pozycja.id}:`, error);
        // Fallback wartości
        stats[pozycja.id] = {
          formatki_total: pozycja.typy_formatek || 0,
          sztuk_planowanych: pozycja.sztuk_formatek || 0,
          sztuk_w_paletach: 0,
          sztuk_dostepnych: pozycja.sztuk_formatek || 0,
          procent_zapaletyzowania: 0
        };
      }
    });
    
    await Promise.all(promises);
    setPozycjeStats(stats);
  };

  // Loading state
  if (loadingPozycje || loading) {
    return (
      <Card style={{ marginBottom: 16, textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Ładowanie pozycji ZKO..." />
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        message="Błąd ładowania pozycji"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Empty state
  if (pozycje.length === 0) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical">
              <Text>Brak pozycji w tym ZKO</Text>
              <Text type="secondary">Dodaj pozycje aby móc zarządzać paletami</Text>
            </Space>
          }
        />
      </Card>
    );
  }

  const availablePozycje = pozycje.filter(p => {
    const stats = pozycjeStats[p.id];
    return stats && stats.sztuk_dostepnych > 0;
  });

  // Znajdź wybraną pozycję
  const selectedPozycja = pozycje.find(p => p.id === selectedPozycjaId);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Nagłówek */}
      <Card 
        size="small"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <AppstoreOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0 }}>Wybierz pozycję do zarządzania paletami</Title>
          </Space>
          <Space>
            <Tag color="blue">
              <FileTextOutlined /> Pozycji: {pozycje.length}
            </Tag>
            {availablePozycje.length > 0 && (
              <Tag color="green">Dostępnych: {availablePozycje.length}</Tag>
            )}
            {selectedPozycjaId && selectedPozycja && (
              <Tag color="purple">
                <DatabaseOutlined /> Wybrana: ID {selectedPozycjaId}
              </Tag>
            )}
          </Space>
        </Space>
      </Card>

      {/* Grid z kaflami pozycji */}
      <Row gutter={[12, 12]}>
        {pozycje.map(pozycja => {
          const stats = pozycjeStats[pozycja.id] || {
            formatki_total: pozycja.typy_formatek || 0,
            sztuk_planowanych: pozycja.sztuk_formatek || 0,
            sztuk_w_paletach: 0,
            sztuk_dostepnych: pozycja.sztuk_formatek || 0,
            procent_zapaletyzowania: 0
          };
          
          const isSelected = selectedPozycjaId === pozycja.id;
          const canBeSelected = stats.sztuk_dostepnych > 0;
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={pozycja.id}>
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

      {/* Informacje o wybranej pozycji */}
      {selectedPozycjaId && selectedPozycja && pozycjeStats[selectedPozycjaId] && (
        <Alert
          message={
            <Space>
              <CheckCircleOutlined />
              <Text strong>
                Wybrana pozycja ID {selectedPozycjaId} 
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  (kolejność: {selectedPozycja.numer_pozycji})
                </Text>
              </Text>
            </Space>
          }
          description={
            <Space>
              <Text>{selectedPozycja.nazwa_plyty}</Text>
              <Text>•</Text>
              <Text type="success">
                {pozycjeStats[selectedPozycjaId].sztuk_dostepnych} szt. do zapaletyzowania
              </Text>
              <Text>z {pozycjeStats[selectedPozycjaId].sztuk_planowanych} planowanych</Text>
            </Space>
          }
          type="success"
          style={{ marginTop: 16 }}
        />
      )}

      {/* Ostrzeżenie gdy wszystko zapaletyzowane */}
      {pozycje.length > 0 && availablePozycje.length === 0 && (
        <Alert
          message="Wszystkie pozycje są w pełni zapaletyzowane"
          description="Wszystkie formatki zostały już przypisane do palet. Nie ma nic do zarządzania."
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};