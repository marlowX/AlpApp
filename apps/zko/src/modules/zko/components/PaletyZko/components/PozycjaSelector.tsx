/**
 * @fileoverview Komponent wyboru pozycji ZKO - widok kafelkowy z auto-odświeżaniem
 * @module PaletyZko/components/PozycjaSelector
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Space, Typography, Tag, Spin, Row, Col, Card, Progress, Badge, Empty, Button } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { PozycjaZKO } from '../types';
import { componentStyles, colors, dimensions, styleHelpers } from '../styles/theme';

const { Text, Title } = Typography;

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
  refreshTrigger?: number; // Nowy prop do wymuszania odświeżenia
}

// Używamy proxy z Vite - /api jest przekierowane na localhost:5001
const API_URL = '/api';

export const PozycjaSelector: React.FC<PozycjaSelectorProps> = ({
  zkoId,
  selectedPozycjaId,
  onSelect,
  loading = false,
  refreshTrigger = 0
}) => {
  const [pozycje, setPozycje] = useState<PozycjaZKO[]>([]);
  const [loadingPozycje, setLoadingPozycje] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchPozycje = useCallback(async () => {
    if (!zkoId) return;
    
    setLoadingPozycje(true);
    try {
      // Pobieramy szczegóły ZKO z pozycjami
      const response = await axios.get(
        `${API_URL}/zko/${zkoId}?_t=${Date.now()}` // Dodaj timestamp aby wymusić świeże dane
      );
      
      if (response.data && response.data.pozycje) {
        const pozycjeData = response.data.pozycje || [];
        
        // Nadaj numery pozycjom
        const pozycjeWithNumbers = pozycjeData.map((p: any, index: number) => ({
          ...p,
          numer_pozycji: p.numer_pozycji || index + 1
        }));
        
        setPozycje(pozycjeWithNumbers);
        
        // Jeśli nie ma wybranej pozycji, wybierz pierwszą
        if (!selectedPozycjaId && pozycjeWithNumbers.length > 0) {
          onSelect(pozycjeWithNumbers[0].id);
        }
        // Jeśli wybrana pozycja już nie istnieje, wybierz pierwszą
        else if (selectedPozycjaId && !pozycjeWithNumbers.find((p: any) => p.id === selectedPozycjaId)) {
          if (pozycjeWithNumbers.length > 0) {
            onSelect(pozycjeWithNumbers[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Błąd pobierania pozycji:', error);
      setPozycje([]);
    } finally {
      setLoadingPozycje(false);
      setLastRefresh(Date.now());
    }
  }, [zkoId, selectedPozycjaId, onSelect]);

  // Odświeżaj gdy zmieni się zkoId lub refreshTrigger
  useEffect(() => {
    fetchPozycje();
  }, [zkoId, refreshTrigger]);

  // Funkcja ręcznego odświeżania
  const handleRefresh = useCallback(() => {
    fetchPozycje();
  }, [fetchPozycje]);

  // Auto-odświeżanie co 30 sekund
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPozycje();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPozycje]);

  // Oblicz procent formatek na paletach dla każdej pozycji
  const calculateProgress = (pozycja: PozycjaZKO) => {
    // Można tu dodać rzeczywiste obliczenia na podstawie danych o paletach
    const total = pozycja.ilosc_formatek || pozycja.sztuk_formatek || 100;
    const onPallets = pozycja.formatki_na_paletach || 0;
    return {
      percent: total > 0 ? Math.round((onPallets / total) * 100) : 0,
      onPallets,
      total
    };
  };

  if (loadingPozycje && pozycje.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: dimensions.spacingXl }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: dimensions.spacingMd }}>
          Ładowanie pozycji ZKO...
        </Text>
      </div>
    );
  }

  if (pozycje.length === 0 && !loadingPozycje) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: colors.borderBase }} />}
        description={
          <Space direction="vertical">
            <Text>Brak pozycji w tym ZKO</Text>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              size="small"
            >
              Odśwież
            </Button>
          </Space>
        }
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={dimensions.spacingMd}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: dimensions.spacingSm
      }}>
        <Text strong style={{ fontSize: dimensions.fontSizeBase }}>
          Wybierz pozycję ZKO:
        </Text>
        <Space size={dimensions.spacingSm}>
          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
            Ostatnie odświeżenie: {new Date(lastRefresh).toLocaleTimeString('pl-PL')}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            size="small"
            loading={loadingPozycje}
            style={{ height: dimensions.buttonHeightSmall }}
          >
            Odśwież
          </Button>
        </Space>
      </div>

      <Row gutter={[dimensions.spacingSm, dimensions.spacingSm]}>
        {pozycje.map(pozycja => {
          const isSelected = pozycja.id === selectedPozycjaId;
          const progress = calculateProgress(pozycja);
          const numerPozycji = pozycja.numer_pozycji || pozycja.id;
          
          return (
            <Col key={pozycja.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                onClick={() => onSelect(pozycja.id)}
                style={{
                  ...componentStyles.positionTile.base,
                  ...(isSelected ? componentStyles.positionTile.selected : {}),
                  position: 'relative',
                }}
                styles={{
                  body: {
                    padding: dimensions.spacingSm,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: dimensions.spacingXs
                  }
                }}
              >
                {/* Numer pozycji */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: dimensions.fontSizeLarge,
                      color: isSelected ? colors.primary : colors.textPrimary
                    }}
                  >
                    Poz. {numerPozycji}
                  </Text>
                  {isSelected && (
                    <CheckCircleOutlined 
                      style={{ 
                        color: colors.primary,
                        fontSize: dimensions.iconSizeBase
                      }} 
                    />
                  )}
                </div>

                {/* Kolor płyty jako mały tag */}
                <Tag 
                  color={pozycja.kolor_plyty?.toLowerCase() || 'default'}
                  style={{
                    ...componentStyles.tag.base,
                    fontSize: 10,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {pozycja.kolor_plyty || 'Brak koloru'}
                </Tag>

                {/* Nazwa płyty - skrócona */}
                <Text 
                  style={{ 
                    fontSize: 11,
                    color: colors.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={pozycja.nazwa_plyty}
                >
                  {pozycja.nazwa_plyty || 'Brak nazwy'}
                </Text>

                {/* Ilość płyt i formatek */}
                <Space direction="vertical" size={0} style={{ fontSize: 10 }}>
                  <Text style={{ color: colors.textSecondary }}>
                    {pozycja.ilosc_plyt || 0} płyt
                  </Text>
                  {(pozycja.sztuk_formatek || pozycja.ilosc_formatek) && (
                    <Text style={{ color: colors.textSecondary }}>
                      {pozycja.sztuk_formatek || pozycja.ilosc_formatek || 0} formatek
                    </Text>
                  )}
                </Space>

                {/* Progress bar pokazujący procent formatek na paletach */}
                <div style={{ marginTop: 'auto' }}>
                  <Progress 
                    percent={progress.percent}
                    size="small"
                    strokeColor={styleHelpers.getCompletionColor(progress.percent)}
                    showInfo={false}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                    {progress.percent}% na paletach
                  </Text>
                </div>

                {/* Dodatkowa informacja o stanie */}
                {progress.percent === 100 && (
                  <Badge 
                    status="success" 
                    text="Kompletne"
                    style={{
                      position: 'absolute',
                      top: dimensions.spacingXs,
                      right: dimensions.spacingXs,
                      fontSize: 10
                    }}
                  />
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Podsumowanie wybranej pozycji */}
      {selectedPozycjaId && pozycje.length > 0 && (
        <Card
          size="small"
          style={{
            backgroundColor: colors.bgSecondary,
            marginTop: dimensions.spacingSm,
            borderRadius: dimensions.buttonBorderRadius
          }}
          styles={{
            body: {
              padding: dimensions.spacingSm
            }
          }}
        >
          <Space size="small">
            <Text type="secondary" style={{ fontSize: dimensions.fontSizeSmall }}>
              Wybrano:
            </Text>
            <Tag 
              color="green" 
              style={{ ...componentStyles.tag.base, margin: 0 }}
            >
              Poz. {pozycje.find(p => p.id === selectedPozycjaId)?.numer_pozycji || selectedPozycjaId}
            </Tag>
            {pozycje.find(p => p.id === selectedPozycjaId) && (
              <>
                <Text style={{ fontSize: dimensions.fontSizeSmall }}>
                  {pozycje.find(p => p.id === selectedPozycjaId)?.nazwa_plyty}
                </Text>
                <Tag style={{ ...componentStyles.tag.base, margin: 0 }}>
                  {pozycje.find(p => p.id === selectedPozycjaId)?.kolor_plyty}
                </Tag>
              </>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};