import React, { useState, useMemo } from 'react';
import { Typography, Empty, Spin } from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined, 
  FireOutlined
} from '@ant-design/icons';
import type { Plyta } from './types';

const { Text } = Typography;

interface BetterPlytaSelectorProps {
  plyty: Plyta[];
  loading?: boolean;
  value?: string;
  onChange?: (plyta: Plyta | null) => void;
  onAddPlyta?: (plyta: Plyta) => void; // Nowy prop dla dodawania
  placeholder?: string;
  selectedPlyty?: string[]; // Lista już wybranych płyt
}

export const BetterPlytaSelector: React.FC<BetterPlytaSelectorProps> = ({
  plyty,
  loading = false,
  value,
  onChange,
  onAddPlyta,
  placeholder = "Filtruj płyty...",
  selectedPlyty = []
}) => {
  const [search, setSearch] = useState('');

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
    // Jeśli płyta już jest wybrana, pomiń
    if (!selectedPlyty.includes(plyta.kolor_nazwa)) {
      onAddPlyta?.(plyta);
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
      {/* Wyszukiwarka - POPRAWIONA */}
      <div style={{ padding: '8px' }}>
        <div style={{ position: 'relative' }}>
          <SearchOutlined style={{ 
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#bfbfbf',
            fontSize: 14
          }} />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 30px 4px 32px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 12,
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#40a9ff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d9d9d9';
            }}
          />
          {search && (
            <span
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#bfbfbf',
                fontSize: 12
              }}
            >
              ✕
            </span>
          )}
        </div>
      </div>

      {/* Lista płyt */}
      <div style={{ 
        height: 240,
        overflowY: 'auto',
        overflowX: 'hidden',
        borderTop: '1px solid #f0f0f0'
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
              const isAlreadySelected = selectedPlyty.includes(plyta.kolor_nazwa);
              const popularity = (plyta as any).popularnosc || 1;
              
              return (
                <div
                  key={plyta.id}
                  onClick={() => !isAlreadySelected && handleSelect(plyta)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    cursor: isAlreadySelected ? 'not-allowed' : 'pointer',
                    backgroundColor: isAlreadySelected ? '#f5f5f5' : '#fff',
                    opacity: isAlreadySelected ? 0.6 : 1,
                    transition: 'all 0.2s',
                    borderBottom: '1px solid #fafafa'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAlreadySelected) {
                      e.currentTarget.style.backgroundColor = '#e6f7ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAlreadySelected) {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {/* Ikona */}
                  <div style={{ width: 24, marginRight: 8 }}>
                    {isAlreadySelected ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                    ) : popularity >= 4 ? (
                      <FireOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                    ) : null}
                  </div>
                  
                  {/* Nazwa */}
                  <div style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 12,
                      color: isAlreadySelected ? '#999' : '#000'
                    }}>
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

      {/* Podpowiedź */}
      <div style={{ 
        padding: '6px 12px',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        fontSize: 11,
        color: '#999',
        textAlign: 'center'
      }}>
        Kliknij na płytę aby dodać ją do rozkroju
      </div>
    </div>
  );
};
