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
  refreshTrigger?: number;
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
      const response = await axios.get(
        `${API_URL}/zko/${zkoId}?_t=${Date.now()}`
      );
      
      if (response.data && response.data.pozycje) {
        const pozycjeData = response.data.pozycje || [];
        
        const pozycjeWithNumbers = pozycjeData.map((p: any, index: number) => ({
          ...p,
          numer_pozycji: p.numer_pozycji || index + 1
        }));
        
        setPozycje(pozycjeWithNumbers);
        
        if (!selectedPozycjaId && pozycjeWithNumbers.length > 0) {
          onSelect(pozycjeWithNumbers[0].id);
        } else if (selectedPozycjaId && !pozycjeWithNumbers.find((p: any) => p.id === selectedPozycjaId)) {
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

  useEffect(() => {
    fetchPozycje();
  }, [zkoId, refreshTrigger]);

  const handleRefresh = useCallback(() => {
    fetchPozycje();
  }, [fetchPozycje]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPozycje();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPozycje]);

  const calculateProgress = (pozycja: PozycjaZKO) => {
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
                  minHeight: '140px',
                  height: '140px', // Stała wysokość
                  width: '100%', // Pełna szerokość
                  position: 'relative',
                  border: isSelected ? '2px solid #1890ff' : '1px solid #e8e8e8',
                  background: isSelected ? '#e6f7ff' : 'white',
                  cursor: 'pointer',
                  overflow: 'hidden' // Ukryj nadmiar
                }}
                bodyStyle={{
                  padding: '10px',
                  height: '100%',
                  width: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  overflow: 'hidden'
                }}
              >
                {/* Numer pozycji */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: '14px',
                      color: isSelected ? colors.primary : colors.textPrimary,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Poz. {numerPozycji}
                  </Text>
                  {isSelected && (
                    <CheckCircleOutlined 
                      style={{ 
                        color: colors.primary,
                        fontSize: '12px'
                      }} 
                    />
                  )}
                </div>

                {/* Kolor płyty */}
                <div style={{ flexShrink: 0 }}>
                  <Tag 
                    color={pozycja.kolor_plyty?.toLowerCase() === 'biały' ? 'default' : 'blue'}
                    style={{
                      fontSize: '10px',
                      padding: '0 4px',
                      margin: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {pozycja.kolor_plyty || 'Brak koloru'}
                  </Tag>
                </div>

                {/* Nazwa płyty */}
                <Text 
                  style={{ 
                    fontSize: '11px',
                    color: colors.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title={pozycja.nazwa_plyty}
                >
                  {pozycja.nazwa_plyty || 'Brak nazwy'}
                </Text>

                {/* Ilość płyt */}
                <Text style={{ 
                  fontSize: '10px', 
                  color: colors.textSecondary,
                  flexShrink: 0
                }}>
                  {pozycja.ilosc_plyt || 0} płyt
                </Text>

                {/* Progress bar - na dole */}
                <div style={{ 
                  marginTop: 'auto',
                  flexShrink: 0
                }}>
                  <Progress 
                    percent={progress.percent}
                    size="small"
                    strokeColor={progress.percent === 100 ? '#52c41a' : '#1890ff'}
                    showInfo={false}
                    style={{ marginBottom: '2px' }}
                  />
                  <Text style={{ fontSize: '9px', color: colors.textSecondary }}>
                    {progress.percent}% na paletach
                  </Text>
                </div>
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
          bodyStyle={{
            padding: dimensions.spacingSm
          }}
        >
          <Space size="small">
            <Text type="secondary" style={{ fontSize: dimensions.fontSizeSmall }}>
              Wybrano:
            </Text>
            <Tag 
              color="green" 
              style={{ margin: 0 }}
            >
              Poz. {pozycje.find(p => p.id === selectedPozycjaId)?.numer_pozycji || selectedPozycjaId}
            </Tag>
            {pozycje.find(p => p.id === selectedPozycjaId) && (
              <>
                <Text style={{ fontSize: dimensions.fontSizeSmall }}>
                  {pozycje.find(p => p.id === selectedPozycjaId)?.nazwa_plyty}
                </Text>
                <Tag style={{ margin: 0 }}>
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