import React from 'react';
import { Typography, InputNumber, Space, Button } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { BetterPlytaSelector } from './BetterPlytaSelector';
import type { KolorPlyty, Plyta } from './types';

const { Text } = Typography;

interface KolorePlytyTableProps {
  kolorePlyty: KolorPlyty[];
  plyty: Plyta[];
  plytyLoading?: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  onRemoveKolor: (index: number) => void;
  maxPlytNaPozycje?: number;
}

export const KolorePlytyTable: React.FC<KolorePlytyTableProps> = ({
  kolorePlyty,
  plyty,
  plytyLoading = false,
  searchText,
  onSearchChange,
  onUpdateKolor,
  onRemoveKolor,
  maxPlytNaPozycje = 5
}) => {
  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  const przekroczonyLimit = totalPlyty > maxPlytNaPozycje;
  
  // Lista już wybranych kolorów
  const selectedColors = kolorePlyty
    .filter(k => k.kolor)
    .map(k => k.kolor);

  const handleAddPlyta = (plyta: Plyta) => {
    // Sprawdź czy płyta już jest dodana
    const existingIndex = kolorePlyty.findIndex(k => k.kolor === plyta.kolor_nazwa);
    if (existingIndex !== -1) {
      // Jeśli już jest, zwiększ ilość
      const currentQty = kolorePlyty[existingIndex].ilosc || 1;
      if (totalPlyty < maxPlytNaPozycje) {
        onUpdateKolor(existingIndex, 'ilosc', Math.min(currentQty + 1, maxPlytNaPozycje - totalPlyty + currentQty));
      }
      return;
    }

    // Znajdź pierwszy pusty slot lub dodaj nowy
    const emptyIndex = kolorePlyty.findIndex(k => !k.kolor);
    const targetIndex = emptyIndex !== -1 ? emptyIndex : kolorePlyty.length;
    
    // Nie dodawaj jeśli przekroczymy limit
    if (targetIndex >= maxPlytNaPozycje || totalPlyty >= maxPlytNaPozycje) {
      return;
    }

    // Dodaj nową płytę
    const newKolor = {
      kolor: plyta.kolor_nazwa,
      nazwa: plyta.nazwa,
      ilosc: 1,
      plyta_id: plyta.id,
      stan_magazynowy: plyta.stan_magazynowy,
      grubosc: plyta.grubosc,
      dlugosc: plyta.dlugosc,
      szerokosc: plyta.szerokosc
    };

    onUpdateKolor(targetIndex, '__FULL_UPDATE__', newKolor);
  };

  const handleRemove = (index: number) => {
    onRemoveKolor(index);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>
          Kolory płyt do rozkroju
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Lewa strona - Selektor płyt */}
        <div style={{ flex: '1 1 60%', minWidth: 300 }}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Kliknij na płytę aby dodać do pozycji
            </Text>
          </div>
          <BetterPlytaSelector
            plyty={plyty}
            loading={plytyLoading}
            onAddPlyta={handleAddPlyta}
            selectedPlyty={selectedColors}
            placeholder="Filtruj płyty..."
          />
        </div>

        {/* Prawa strona - Wybrane płyty */}
        <div style={{ flex: '1 1 40%', minWidth: 250 }}>
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            overflow: 'hidden',
            minHeight: 280
          }}>
            {/* Nagłówek */}
            <div style={{ 
              padding: '8px 12px',
              backgroundColor: '#fafafa',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Wybrane płyty ({kolorePlyty.filter(k => k.kolor).length})</span>
              {przekroczonyLimit && (
                <Text type="danger" style={{ fontSize: 11 }}>
                  <ExclamationCircleOutlined /> Limit: {maxPlytNaPozycje}
                </Text>
              )}
            </div>
            
            {/* Lista wybranych */}
            <div style={{ padding: 12 }}>
              {kolorePlyty.filter(k => k.kolor).length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: '#999'
                }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Kliknij na płytę z listy obok
                  </Text>
                </div>
              ) : (
                <>
                  {kolorePlyty.map((kolor, index) => {
                    if (!kolor.kolor) return null;
                    
                    return (
                      <div 
                        key={`${kolor.kolor}-${index}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '6px 8px',
                          marginBottom: 6,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 4,
                          border: '1px solid #e8e8e8'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 12 }}>
                            {kolor.kolor}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>
                            {kolor.grubosc}mm • {kolor.dlugosc}×{kolor.szerokosc}mm
                          </Text>
                        </div>
                        
                        <Space size="small">
                          <InputNumber
                            min={1}
                            max={maxPlytNaPozycje - totalPlyty + kolor.ilosc}
                            value={kolor.ilosc}
                            onChange={(value) => onUpdateKolor(index, 'ilosc', value || 1)}
                            size="small"
                            style={{ width: 50, fontSize: 11 }}
                          />
                          <Text type="secondary" style={{ fontSize: 10 }}>szt.</Text>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(index)}
                            style={{ fontSize: 10 }}
                          />
                        </Space>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            
            {/* Podsumowanie */}
            {kolorePlyty.filter(k => k.kolor).length > 0 && (
              <div style={{ 
                padding: '8px 12px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                fontSize: 11
              }}>
                <Space split="|">
                  <Text type="secondary">
                    Pozycji: {kolorePlyty.filter(k => k.kolor).length}
                  </Text>
                  <Text type={przekroczonyLimit ? 'danger' : 'secondary'}>
                    Łącznie płyt: {totalPlyty}/{maxPlytNaPozycje}
                  </Text>
                </Space>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
