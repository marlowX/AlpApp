/**
 * @fileoverview Komponent wyboru pozycji ZKO - widok kafelkowy z auto-odświeżaniem
 * @module PaletyZko/components/PozycjaSelector
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Space, Typography, Tag, Spin, Row, Col, Card, Progress, Badge, Empty, Button } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { PozycjaZKO } from '../types';
import { colors, dimensions } from '../styles/theme';

const { Text, Title } = Typography;

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
  refreshTrigger?: number;
}

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
        setPozycje(pozycjeData);
        
        if (!selectedPozycjaId && pozycjeData.length > 0) {
          onSelect(pozycjeData[0].id);
        } else if (selectedPozycjaId && !pozycjeData.find((p: any) => p.id === selectedPozycjaId)) {
          if (pozycjeData.length > 0) {
            onSelect(pozycjeData[0].id);
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

  // Oblicz szerokość kafelka na podstawie ilości pozycji
  const getCardWidth = () => {
    const count = pozycje.length;
    if (count <= 2) return '50%';
    if (count === 3) return '33.33%';
    if (count === 4) return '25%';
    if (count === 5) return '20%';
    return '16.66%'; // 6 lub więcej
  };

  if (loadingPozycje && pozycje.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 8 }}>
          Ładowanie pozycji ZKO...
        </Text>
      </div>
    );
  }

  if (pozycje.length === 0 && !loadingPozycje) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
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
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8
      }}>
        <Text strong style={{ fontSize: 14 }}>
          Wybierz pozycję ZKO:
        </Text>
        <Space size={8}>
          <Text style={{ fontSize: 10, color: '#8c8c8c' }}>
            Ostatnie odświeżenie: {new Date(lastRefresh).toLocaleTimeString('pl-PL')}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            size="small"
            loading={loadingPozycje}
          >
            Odśwież
          </Button>
        </Space>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        width: '100%'
      }}>
        {pozycje.map(pozycja => {
          const isSelected = pozycja.id === selectedPozycjaId;
          const progress = calculateProgress(pozycja);
          const cardWidth = getCardWidth();
          
          // Pobierz formatki dla tej pozycji
          const formatki = pozycja.formatki || [];
          const formatkiSummary = formatki.slice(0, 2).map(f => 
            `${f.dlugosc}×${f.szerokosc} ${f.kolor || pozycja.kolor_plyty} - ${f.sztuki || 0}szt`
          );
          
          return (
            <div
              key={pozycja.id}
              style={{
                width: `calc(${cardWidth} - 8px)`,
                minWidth: '150px'
              }}
            >
              <Card
                hoverable
                onClick={() => onSelect(pozycja.id)}
                style={{
                  height: '160px',
                  position: 'relative',
                  border: isSelected ? '2px solid #1890ff' : '1px solid #e8e8e8',
                  background: isSelected ? '#e6f7ff' : 'white',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
                bodyStyle={{
                  padding: '10px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {/* Nagłówek - ID pozycji */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: '14px',
                      color: isSelected ? '#1890ff' : '#000'
                    }}
                  >
                    Pozycja {pozycja.id}
                  </Text>
                  {isSelected && (
                    <CheckCircleOutlined 
                      style={{ 
                        color: '#1890ff',
                        fontSize: '12px'
                      }} 
                    />
                  )}
                </div>

                {/* Kolor i nazwa płyty */}
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <Tag 
                    color={pozycja.kolor_plyty?.toLowerCase() === 'biały' ? 'default' : 'blue'}
                    style={{
                      fontSize: '10px',
                      padding: '0 4px',
                      margin: 0,
                      height: '18px',
                      lineHeight: '16px'
                    }}
                  >
                    {pozycja.kolor_plyty || 'BRAK'}
                  </Tag>
                  <Text 
                    style={{ 
                      fontSize: '10px',
                      color: '#8c8c8c',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                    title={pozycja.nazwa_plyty}
                  >
                    {pozycja.nazwa_plyty || '-'}
                  </Text>
                </div>

                {/* Ilość płyt */}
                <Text style={{ 
                  fontSize: '11px', 
                  color: '#595959'
                }}>
                  {pozycja.ilosc_plyt || 0} płyt
                </Text>

                {/* Lista formatek */}
                <div style={{ 
                  flex: 1,
                  overflow: 'hidden',
                  fontSize: '10px',
                  color: '#8c8c8c'
                }}>
                  {formatkiSummary.length > 0 ? (
                    formatkiSummary.map((f, idx) => (
                      <div key={idx} style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {f}
                      </div>
                    ))
                  ) : (
                    <Text style={{ fontSize: '10px', color: '#bfbfbf' }}>
                      Brak formatek
                    </Text>
                  )}
                  {formatki.length > 2 && (
                    <Text style={{ fontSize: '9px', color: '#bfbfbf' }}>
                      +{formatki.length - 2} więcej...
                    </Text>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 'auto' }}>
                  <Progress 
                    percent={progress.percent}
                    size="small"
                    strokeColor={progress.percent === 100 ? '#52c41a' : '#1890ff'}
                    showInfo={false}
                    style={{ marginBottom: '2px' }}
                  />
                  <Text style={{ fontSize: '9px', color: '#8c8c8c' }}>
                    {progress.percent}% na paletach
                  </Text>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Podsumowanie wybranej pozycji */}
      {selectedPozycjaId && pozycje.length > 0 && (
        <Card
          size="small"
          style={{
            backgroundColor: '#f5f5f5',
            marginTop: 8,
            borderRadius: 4
          }}
          bodyStyle={{
            padding: 8
          }}
        >
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Wybrano:
            </Text>
            <Tag color="green" style={{ margin: 0 }}>
              Pozycja {selectedPozycjaId}
            </Tag>
            {pozycje.find(p => p.id === selectedPozycjaId) && (
              <>
                <Text style={{ fontSize: 12 }}>
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