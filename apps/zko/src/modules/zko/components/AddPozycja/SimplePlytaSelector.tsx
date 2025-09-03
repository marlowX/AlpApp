import React, { useState, useMemo } from 'react';
import { Input, Card, Tag, Badge, Typography, Empty, Spin, Space, Button } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import type { Plyta } from './types';

const { Text } = Typography;
const { Search } = Input;

interface SimplePlytaSelectorProps {
  plyty: Plyta[];
  loading?: boolean;
  value?: string;
  onChange?: (plyta: Plyta | null) => void;
  placeholder?: string;
}

export const SimplePlytaSelector: React.FC<SimplePlytaSelectorProps> = ({
  plyty,
  loading = false,
  value,
  onChange,
  placeholder = "Wpisz nazwę koloru płyty..."
}) => {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const selectedPlyta = useMemo(() => 
    plyty.find(p => p.kolor_nazwa === value) || null,
    [plyty, value]
  );

  const filteredPlyty = useMemo(() => {
    if (!search || !focused) return [];
    
    const searchWords = search.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    return plyty
      .filter(p => {
        const searchText = `${p.kolor_nazwa} ${p.nazwa} ${p.opis || ''} ${p.grubosc}mm`.toLowerCase();
        return searchWords.every(word => searchText.includes(word));
      })
      .sort((a, b) => {
        // Najpierw dokładne dopasowanie
        if (a.kolor_nazwa.toLowerCase() === search.toLowerCase()) return -1;
        if (b.kolor_nazwa.toLowerCase() === search.toLowerCase()) return 1;
        // Potem według stanu magazynowego
        return b.stan_magazynowy - a.stan_magazynowy;
      })
      .slice(0, 15);
  }, [plyty, search, focused]);

  const handleSelect = (plyta: Plyta) => {
    onChange?.(plyta);
    setSearch('');
    setFocused(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setSearch('');
  };

  const getStockColor = (stock: number) => {
    if (stock > 20) return '#52c41a';
    if (stock > 5) return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="small" />
      </div>
    );
  }

  // Jeśli mamy wybraną płytę - pokazujemy ładną kartę
  if (selectedPlyta) {
    return (
      <Card 
        size="small" 
        style={{ 
          backgroundColor: '#f6ffed', 
          borderColor: '#52c41a',
          borderWidth: '2px'
        }}
        styles={{
          body: { padding: '8px 12px' }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Space align="center" style={{ marginBottom: 4 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              <Text strong style={{ fontSize: '13px', color: '#52c41a' }}>
                {selectedPlyta.kolor_nazwa}
              </Text>
              {selectedPlyta.struktura === 1 && (
                <Tag color="gold" style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}>
                  STRUKTURA
                </Tag>
              )}
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {selectedPlyta.nazwa} • {selectedPlyta.grubosc}mm • {selectedPlyta.dlugosc}×{selectedPlyta.szerokosc}mm
              </Text>
            </div>
          </div>
          <Space>
            <Badge 
              count={selectedPlyta.stan_magazynowy} 
              style={{ 
                backgroundColor: getStockColor(selectedPlyta.stan_magazynowy),
                marginRight: 8
              }}
              title={`Stan magazynowy: ${selectedPlyta.stan_magazynowy} szt.`}
            />
            <Button 
              size="small" 
              type="text"
              danger
              icon={<CloseOutlined />}
              onClick={handleClear}
              style={{ fontSize: '11px' }}
            >
              Usuń
            </Button>
          </Space>
        </div>
      </Card>
    );
  }

  // Jeśli nie ma wybranej płyty - pokazujemy wyszukiwarkę
  return (
    <div style={{ position: 'relative' }}>
      <Search
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        allowClear
        prefix={<SearchOutlined />}
        style={{ width: '100%' }}
        autoComplete="off"
      />
      
      {/* Podpowiedź */}
      {!focused && !search && (
        <Text type="secondary" style={{ fontSize: '10px', marginTop: 2, display: 'block' }}>
          💡 Wpisz część nazwy koloru, np: "biał", "dąb", "18mm"
        </Text>
      )}
      
      {/* Lista wyników */}
      {focused && filteredPlyty.length > 0 && (
        <Card 
          size="small" 
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 4px)', 
            left: 0, 
            right: 0, 
            zIndex: 2100,
            maxHeight: 400,
            overflow: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          styles={{
            body: { padding: '4px' }
          }}
        >
          {filteredPlyty.map((plyta, index) => (
            <Card
              key={plyta.id}
              size="small"
              hoverable
              onClick={() => handleSelect(plyta)}
              onMouseDown={(e) => e.preventDefault()}
              style={{ 
                marginBottom: index < filteredPlyty.length - 1 ? 4 : 0,
                cursor: 'pointer',
                border: '1px solid #f0f0f0',
                opacity: plyta.stan_magazynowy === 0 ? 0.6 : 1
              }}
              styles={{
                body: { padding: '8px 10px' }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 2 }}>
                    <Text strong style={{ fontSize: '12px', color: plyta.stan_magazynowy > 0 ? '#1890ff' : '#999' }}>
                      {plyta.kolor_nazwa}
                    </Text>
                    {plyta.struktura === 1 && (
                      <Tag color="gold" style={{ marginLeft: 6, fontSize: '9px', padding: '0 3px', lineHeight: '14px', height: '14px' }}>
                        STR
                      </Tag>
                    )}
                    {plyta.stan_magazynowy === 0 && (
                      <Tag color="error" style={{ marginLeft: 6, fontSize: '9px', padding: '0 3px', lineHeight: '14px', height: '14px' }}>
                        BRAK
                      </Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    {plyta.grubosc}mm • {plyta.dlugosc}×{plyta.szerokosc}mm
                    {plyta.cena_za_plyte && ` • ${plyta.cena_za_plyte.toFixed(2)} zł`}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge 
                    count={plyta.stan_magazynowy} 
                    overflowCount={999}
                    style={{ 
                      backgroundColor: getStockColor(plyta.stan_magazynowy),
                      fontSize: '10px'
                    }}
                  />
                  <div style={{ fontSize: '9px', color: '#999', marginTop: 2 }}>
                    {plyta.stan_magazynowy > 0 ? 'szt.' : 'brak'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {filteredPlyty.length >= 15 && (
            <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Pokazano pierwsze 15 wyników - zawęź wyszukiwanie
              </Text>
            </div>
          )}
        </Card>
      )}
      
      {/* Brak wyników */}
      {focused && search && filteredPlyty.length === 0 && (
        <Card 
          size="small" 
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 4px)', 
            left: 0, 
            right: 0, 
            zIndex: 2100,
            textAlign: 'center'
          }}
        >
          <Empty 
            description={
              <span>
                Nie znaleziono płyt dla <strong>"{search}"</strong>
              </span>
            } 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ height: 40 }}
          />
        </Card>
      )}
    </div>
  );
};
