import React, { useState, useMemo } from 'react';
import { Card, Tag, Badge, Typography, Empty, Spin, Space, Input, Button, Row, Col } from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined, 
  CloseOutlined,
  FireOutlined,
  StarFilled,
  InboxOutlined 
} from '@ant-design/icons';
import type { Plyta } from './types';

const { Text } = Typography;
const { Search } = Input;

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
  placeholder = "Szukaj płyty..."
}) => {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const selectedPlyta = useMemo(() => 
    plyty.find(p => p.kolor_nazwa === value) || null,
    [plyty, value]
  );

  // Sortuj płyty według popularności i stanu magazynowego
  const sortedPlyty = useMemo(() => {
    return [...plyty]
      .filter(p => p.aktywna !== false)
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
    let filtered = sortedPlyty;
    
    if (search) {
      const searchWords = search.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      filtered = sortedPlyty.filter(p => {
        const searchText = `${p.kolor_nazwa} ${p.nazwa} ${p.opis || ''} ${p.grubosc}mm`.toLowerCase();
        return searchWords.every(word => searchText.includes(word));
      });
    }
    
    // Pokazuj TOP 10 lub wszystkie jeśli showAll
    return showAll ? filtered : filtered.slice(0, 10);
  }, [sortedPlyty, search, showAll]);

  const handleSelect = (plyta: Plyta) => {
    onChange?.(plyta);
    setSearch('');
    setShowAll(false);
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

  const getPopularityStars = (plyta: any) => {
    const popularity = plyta.popularnosc || 1;
    if (popularity >= 4) {
      return (
        <Space size={2}>
          <FireOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />
          <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>TOP</Text>
        </Space>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="small" />
      </div>
    );
  }

  // Jeśli mamy wybraną płytę - pokazujemy kompaktową kartę
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
          body: { padding: '6px 10px' }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
            <Text strong style={{ fontSize: '12px', color: '#52c41a' }}>
              {selectedPlyta.kolor_nazwa}
            </Text>
            {selectedPlyta.struktura === 1 && (
              <Tag color="gold" style={{ fontSize: '9px', padding: '0 3px', margin: 0, height: '16px', lineHeight: '14px' }}>
                STR
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {selectedPlyta.grubosc}mm • {selectedPlyta.dlugosc}×{selectedPlyta.szerokosc}mm • Stan: {selectedPlyta.stan_magazynowy}
            </Text>
          </Space>
          <Button 
            size="small" 
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={handleClear}
            style={{ fontSize: '10px', height: '20px' }}
          />
        </div>
      </Card>
    );
  }

  // Jeśli nie ma wybranej płyty - pokazujemy listę do wyboru
  return (
    <div>
      {/* Wyszukiwarka */}
      <Search
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 8 }}
        prefix={<SearchOutlined />}
      />

      {/* Lista płyt - PROSTA BEZ CARDS */}
      <div style={{ 
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        maxHeight: 320,
        overflowY: 'auto',
        backgroundColor: '#fff'
      }}>
        {filteredPlyty.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty 
              description={search ? `Brak płyt dla "${search}"` : "Brak dostępnych płyt"} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 40 }}
            />
          </div>
        ) : (
          <>
            {filteredPlyty.map((plyta, index) => {
              const isDisabled = plyta.stan_magazynowy === 0;
              const popularity = (plyta as any).popularnosc || 1;
              
              return (
                <div
                  key={plyta.id}
                  onClick={() => !isDisabled && handleSelect(plyta)}
                  style={{
                    padding: '6px 10px',
                    borderBottom: index < filteredPlyty.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    backgroundColor: '#fff',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  <Row align="middle" gutter={8}>
                    <Col flex="auto">
                      <Space size="small" align="center">
                        {/* Popularność */}
                        {popularity >= 4 && (
                          <FireOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} title="Popularna" />
                        )}
                        
                        {/* Nazwa */}
                        <Text strong style={{ fontSize: '12px' }}>
                          {plyta.kolor_nazwa}
                        </Text>
                        
                        {/* Tagi */}
                        {plyta.struktura === 1 && (
                          <Tag color="gold" style={{ fontSize: '9px', padding: '0 2px', margin: 0, height: '14px', lineHeight: '12px' }}>
                            STR
                          </Tag>
                        )}
                        
                        {/* Grubość */}
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {plyta.grubosc}mm
                        </Text>
                        
                        {/* Cena */}
                        {plyta.cena_za_plyte && (
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            {plyta.cena_za_plyte.toFixed(2)} zł
                          </Text>
                        )}
                      </Space>
                    </Col>
                    
                    <Col>
                      {/* Stan magazynowy */}
                      <Badge 
                        count={plyta.stan_magazynowy || 0} 
                        overflowCount={999}
                        style={{ 
                          backgroundColor: isDisabled ? '#d9d9d9' : getStockColor(plyta.stan_magazynowy),
                          fontSize: '10px'
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              );
            })}
            
            {/* Pokaż więcej */}
            {!showAll && sortedPlyty.length > 10 && (
              <div style={{ 
                padding: '8px', 
                textAlign: 'center', 
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <Button 
                  size="small" 
                  type="link" 
                  onClick={() => setShowAll(true)}
                >
                  Pokaż wszystkie ({sortedPlyty.length - 10} więcej)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: '10px' }}>
          <FireOutlined style={{ color: '#ff4d4f' }} /> = Popularna płyta • 
          <InboxOutlined style={{ marginLeft: 8 }} /> = Stan magazynowy
        </Text>
      </div>
    </div>
  );
};
