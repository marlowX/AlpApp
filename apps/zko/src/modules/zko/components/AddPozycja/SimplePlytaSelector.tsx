import React, { useState, useMemo } from 'react';
import { Input, List, Card, Tag, Badge, Typography, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
  placeholder = "Wpisz nazwę płyty..."
}) => {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const selectedPlyta = useMemo(() => 
    plyty.find(p => p.kolor_nazwa === value) || null,
    [plyty, value]
  );

  const filteredPlyty = useMemo(() => {
    if (!search || !focused) return [];
    
    const searchLower = search.toLowerCase();
    return plyty
      .filter(p => 
        p.kolor_nazwa.toLowerCase().includes(searchLower) ||
        p.nazwa.toLowerCase().includes(searchLower) ||
        (p.opis && p.opis.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => b.stan_magazynowy - a.stan_magazynowy)
      .slice(0, 10);
  }, [plyty, search, focused]);

  const handleSelect = (plyta: Plyta) => {
    onChange?.(plyta);
    setSearch(plyta.kolor_nazwa);
    setFocused(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setSearch('');
  };

  if (loading) {
    return <Spin size="small" />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {selectedPlyta ? (
        <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>{selectedPlyta.kolor_nazwa}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {selectedPlyta.grubosc}mm • Stan: {selectedPlyta.stan_magazynowy} szt.
              </Text>
            </div>
            <a onClick={handleClear}>Zmień</a>
          </div>
        </Card>
      ) : (
        <>
          <Search
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            allowClear
            prefix={<SearchOutlined />}
          />
          
          {focused && filteredPlyty.length > 0 && (
            <Card 
              size="small" 
              style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 1050,
                marginTop: 4,
                maxHeight: 300,
                overflow: 'auto'
              }}
            >
              <List
                size="small"
                dataSource={filteredPlyty}
                renderItem={plyta => (
                  <List.Item 
                    onClick={() => handleSelect(plyta)}
                    style={{ cursor: 'pointer', padding: '4px 0' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: '12px' }}>
                          {plyta.kolor_nazwa}
                        </Text>
                        <Badge 
                          count={plyta.stan_magazynowy} 
                          style={{ 
                            backgroundColor: plyta.stan_magazynowy > 20 ? '#52c41a' : 
                                           plyta.stan_magazynowy > 5 ? '#faad14' : '#ff4d4f',
                            fontSize: '10px'
                          }}
                        />
                      </div>
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {plyta.grubosc}mm • {plyta.dlugosc}×{plyta.szerokosc}mm
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}
          
          {focused && search && filteredPlyty.length === 0 && (
            <Card size="small" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1050, marginTop: 4 }}>
              <Empty description="Nie znaleziono płyt" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          )}
        </>
      )}
    </div>
  );
};
