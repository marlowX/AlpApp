import React, { useMemo } from 'react';
import { Button, Tag, Space, Typography, InputNumber } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
  
  // Stan dla aktualnie edytowanego selektora
  const [editingIndex, setEditingIndex] = React.useState<number>(0);

  const handlePlytaChange = (plyta: Plyta | null) => {
    if (plyta) {
      const updatedKolor = {
        kolor: plyta.kolor_nazwa,
        nazwa: plyta.nazwa,
        ilosc: kolorePlyty[editingIndex]?.ilosc || 1,
        plyta_id: plyta.id,
        stan_magazynowy: plyta.stan_magazynowy,
        grubosc: plyta.grubosc,
        dlugosc: plyta.dlugosc,
        szerokosc: plyta.szerokosc
      };
      onUpdateKolor(editingIndex, '__FULL_UPDATE__', updatedKolor);
    } else if (editingIndex < kolorePlyty.length) {
      // Wyczyść wybraną płytę
      onUpdateKolor(editingIndex, '__FULL_UPDATE__', {
        kolor: '',
        nazwa: '',
        ilosc: 1,
        plyta_id: undefined,
        stan_magazynowy: undefined,
        grubosc: undefined,
        dlugosc: undefined,
        szerokosc: undefined
      });
    }
  };

  const handleAddNew = () => {
    // Dodaj nowy pusty slot i ustaw go jako aktywny
    const newKolory = [...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }];
    setEditingIndex(newKolory.length - 1);
    // Wywołaj callback aby parent zaktualizował stan
    onUpdateKolor(kolorePlyty.length, '__FULL_UPDATE__', { kolor: '', nazwa: '', ilosc: 1 });
  };

  const handleRemove = (index: number) => {
    onRemoveKolor(index);
    // Ustaw focus na pierwszy element lub 0
    if (editingIndex >= kolorePlyty.length - 1) {
      setEditingIndex(Math.max(0, kolorePlyty.length - 2));
    }
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>
          Kolory płyt do rozkroju
        </Text>
        {przekroczonyLimit && (
          <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ marginLeft: 8 }}>
            PRZEKROCZONY LIMIT! ({totalPlyty}/{maxPlytNaPozycje})
          </Tag>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Lewa strona - Selektor płyt */}
        <div style={{ flex: '1 1 60%', minWidth: 300 }}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Kliknij na płytę aby {kolorePlyty[editingIndex]?.kolor ? 'zmienić' : 'dodać'} do pozycji #{editingIndex + 1}
            </Text>
          </div>
          <BetterPlytaSelector
            plyty={plyty}
            loading={plytyLoading}
            value={kolorePlyty[editingIndex]?.kolor}
            onChange={handlePlytaChange}
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
              fontWeight: 500
            }}>
              Wybrane płyty ({kolorePlyty.filter(k => k.kolor).length})
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
                    Wybierz płytę z listy obok
                  </Text>
                </div>
              ) : (
                <>
                  {kolorePlyty.map((kolor, index) => {
                    if (!kolor.kolor) return null;
                    
                    const isEditing = index === editingIndex;
                    
                    return (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '6px 8px',
                          marginBottom: 6,
                          backgroundColor: isEditing ? '#e6f7ff' : '#f5f5f5',
                          borderRadius: 4,
                          border: isEditing ? '1px solid #1890ff' : '1px solid #e8e8e8',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleEditClick(index)}
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
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Text type="secondary" style={{ fontSize: 10 }}>szt.</Text>
                          {kolorePlyty.length > 1 && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(index);
                              }}
                              style={{ fontSize: 10 }}
                            />
                          )}
                        </Space>
                      </div>
                    );
                  })}
                  
                  {/* Przycisk dodaj kolejną płytę */}
                  {kolorePlyty.length < 5 && totalPlyty < maxPlytNaPozycje && (
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={handleAddNew}
                      style={{ 
                        width: '100%', 
                        marginTop: 8, 
                        fontSize: 11,
                        height: 28
                      }}
                    >
                      Dodaj kolejny kolor płyty
                    </Button>
                  )}
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
