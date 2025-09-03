import React, { useState, useMemo } from 'react';
import { Typography, Empty, Spin, Input } from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined, 
  FireOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { Plyta } from './types';

const { Text } = Typography;

interface BetterPlytaSelectorProps {
  plyty: Plyta[];
  loading?: boolean;
  value?: string;
  onChange?: (plyta: Plyta | null) => void;
  placeholder?: string;
}

export const BetterPlytaSelector: React.FC<BetterPlytaSelectorProps> = ({
  plyty,
  loading = false,
  value,
  onChange,
  placeholder = "Filtruj płyty..."
}) => {
  const [search, setSearch] = useState('');

  const selectedPlyta = useMemo(() => 
    plyty.find(p => p.kolor_nazwa === value) || null,
    [plyty, value]
  );

  // Sortuj płyty według popularności i stanu magazynowego
  const sortedPlyty = useMemo(() => {
    return [...plyty]
      .filter(p => p.aktywna !== false && p.stan_magazynowy > 0)
      .sort((a, b) => {
        // Najpierw według popularności (jeśli istnieje)
        const popA = (a as any).popularnosc || 1;
        const popB = (b as any).popularnosc || 1;
        if (popA !== popB) return popB - popA;
        
        // Potem według stanu magazynowego
        const stockA = a.stan_magazynowy || 0;
        const stockB = b.stan_magazynowy || 0;
        return stockB - stockA;
      });
  }, [plyty]);

  // Filtruj płyty według wyszukiwania
  const filteredPlyty = useMemo(() => {
    if (!search) return sortedPlyty.slice(0, 15); // Pokazuj TOP 15
    
    const searchWords = search.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    return sortedPlyty
      .filter(p => {
        const searchText = `${p.kolor_nazwa} ${p.grubosc}`.toLowerCase();
        return searchWords.every(word => searchText.includes(word));
      })
      .slice(0, 20);
  }, [sortedPlyty, search]);

  const handleSelect = (plyta: Plyta) => {
    if (selectedPlyta?.id === plyta.id) {
      // Odznacz jeśli klikamy na już wybraną
      onChange?.(null);
    } else {
      onChange?.(plyta);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#fff',
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      overflow: 'hidden'
    }}>
      {/* Wyszukiwarka */}
      <div style={{ 
        padding: '8px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          style={{ 
            border: '1px solid #e8e8e8',
            borderRadius: 4
          }}
        />
      </div>

      {/* Lista płyt */}
      <div style={{ 
        height: 240,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {filteredPlyty.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Empty 
              description={search ? `Brak płyt dla "${search}"` : "Brak dostępnych płyt"} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 40 }}
            />
          </div>
        ) : (
          <div>
            {filteredPlyty.map((plyta) => {
              const isSelected = selectedPlyta?.id === plyta.id;
              const popularity = (plyta as any).popularnosc || 1;
              
              return (
                <div
                  key={plyta.id}
                  onClick={() => handleSelect(plyta)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                    borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                    transition: 'all 0.2s',
                    borderBottom: '1px solid #fafafa'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {/* Ikona */}
                  <div style={{ width: 24, marginRight: 8 }}>
                    {isSelected ? (
                      <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                    ) : popularity >= 4 ? (
                      <FireOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                    ) : null}
                  </div>
                  
                  {/* Nazwa */}
                  <div style={{ flex: 1 }}>
                    <Text strong={isSelected} style={{ fontSize: 12 }}>
                      {plyta.kolor_nazwa}
                    </Text>
                    {plyta.struktura === 1 && (
                      <Text 
                        style={{ 
                          fontSize: 9,
                          marginLeft: 6,
                          padding: '0 4px',
                          backgroundColor: '#fff7e6',
                          color: '#fa8c16',
                          borderRadius: 2
                        }}
                      >
                        STR
                      </Text>
                    )}
                  </div>
                  
                  {/* Grubość */}
                  <div style={{ width: 60, textAlign: 'right', marginRight: 12 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {plyta.grubosc}mm
                    </Text>
                  </div>
                  
                  {/* Stan */}
                  <div style={{ 
                    minWidth: 32,
                    padding: '2px 6px',
                    borderRadius: 10,
                    backgroundColor: 
                      plyta.stan_magazynowy > 20 ? '#f6ffed' : 
                      plyta.stan_magazynowy > 5 ? '#fff7e6' : '#fff2e8',
                    color: 
                      plyta.stan_magazynowy > 20 ? '#52c41a' : 
                      plyta.stan_magazynowy > 5 ? '#fa8c16' : '#ff4d4f',
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    {plyta.stan_magazynowy}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info o wybranej płycie */}
      {selectedPlyta && (
        <div style={{ 
          padding: '6px 12px',
          backgroundColor: '#e6f7ff',
          borderTop: '1px solid #91d5ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
            <Text style={{ fontSize: 11 }}>
              Wybrano: <strong>{selectedPlyta.kolor_nazwa}</strong> {selectedPlyta.grubosc}mm • {selectedPlyta.dlugosc}×{selectedPlyta.szerokosc}mm
            </Text>
          </div>
          <CloseOutlined 
            style={{ 
              fontSize: 10, 
              color: '#999',
              cursor: 'pointer',
              padding: 4
            }}
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
