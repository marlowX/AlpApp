import React, { useState, useMemo } from 'react';
import { 
  Input, 
  Card, 
  Badge, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Empty,
  Spin,
  Tooltip
} from 'antd';
import { SearchOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Plyta } from './types';

const { Text, Paragraph } = Typography;
const { Search } = Input;

interface PlytySelectorV2Props {
  plyty: Plyta[];
  loading?: boolean;
  value?: string;
  onChange?: (plyta: Plyta | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PlytySelectorV2: React.FC<PlytySelectorV2Props> = ({
  plyty,
  loading = false,
  value,
  onChange,
  placeholder = "Wybierz płytę",
  disabled = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Wybrana płyta
  const selectedPlyta = useMemo(() => {
    return plyty.find(p => p.kolor_nazwa === value) || null;
  }, [plyty, value]);

  // Filtrowanie płyt
  const filteredPlyty = useMemo(() => {
    if (!searchText) return plyty.slice(0, 10); // Początkowo pokazuj tylko 10
    
    const filtered = plyty.filter(plyta => 
      plyta.opis.toLowerCase().includes(searchText.toLowerCase()) ||
      plyta.kolor_nazwa.toLowerCase().includes(searchText.toLowerCase()) ||
      plyta.nazwa.toLowerCase().includes(searchText.toLowerCase())
    );
    
    return filtered.slice(0, 20); // Max 20 wyników
  }, [plyty, searchText]);

  const handleSelectPlyta = (plyta: Plyta) => {
    onChange?.(plyta);
    setIsExpanded(false);
    setSearchText('');
  };

  const handleClear = () => {
    onChange?.(null);
  };

  const getStockColor = (stock: number) => {
    if (stock > 20) return '#52c41a';
    if (stock > 5) return '#faad14';
    return '#ff4d4f';
  };

  const getStockStatus = (stock: number) => {
    if (stock > 20) return 'Dobry stan';
    if (stock > 5) return 'Niski stan';
    return 'Bardzo niski';
  };

  if (loading) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
          <div style={{ marginTop: 8 }}>Ładowanie płyt...</div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Wyświetlenie wybranej płyty */}
      {selectedPlyta && !isExpanded && (
        <Card 
          size="small" 
          style={{ 
            borderColor: '#52c41a',
            backgroundColor: '#f6ffed',
            marginBottom: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ color: '#52c41a' }}>
                  {selectedPlyta.kolor_nazwa}
                </Text>
                {selectedPlyta.struktura === 1 && (
                  <Tag size="small" color="gold">STRUKTURA</Tag>
                )}
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {selectedPlyta.nazwa} • {selectedPlyta.grubosc}mm
                </Text>
              </div>
              <div style={{ marginTop: 2 }}>
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  {selectedPlyta.opis}
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tooltip title={getStockStatus(selectedPlyta.stan_magazynowy)}>
                <Badge 
                  count={selectedPlyta.stan_magazynowy} 
                  overflowCount={999}
                  style={{ 
                    backgroundColor: getStockColor(selectedPlyta.stan_magazynowy)
                  }}
                />
              </Tooltip>
              <Button size="small" onClick={() => setIsExpanded(true)} disabled={disabled}>
                Zmień
              </Button>
              <Button size="small" onClick={handleClear} disabled={disabled}>
                Usuń
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Przycisk do wyboru gdy brak wybranej płyty */}
      {!selectedPlyta && !isExpanded && (
        <Button 
          block
          onClick={() => setIsExpanded(true)}
          style={{ height: 40, textAlign: 'left' }}
          disabled={disabled}
        >
          <Space>
            <SearchOutlined />
            {placeholder}
          </Space>
        </Button>
      )}

      {/* Rozwinięty widok z wyszukiwaniem */}
      {isExpanded && (
        <Card size="small" style={{ marginTop: selectedPlyta ? 8 : 0 }}>
          <div style={{ marginBottom: 12 }}>
            <Search
              placeholder="Szukaj płyt po opisie, kolorze lub nazwie..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              autoFocus
            />
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredPlyty.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Brak płyt spełniających kryteria"
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {filteredPlyty.map(plyta => (
                  <Card
                    key={plyta.id}
                    size="small"
                    hoverable
                    onClick={() => handleSelectPlyta(plyta)}
                    style={{ 
                      cursor: 'pointer',
                      border: plyta.kolor_nazwa === value ? '2px solid #52c41a' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div>
                          <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                            {plyta.kolor_nazwa}
                          </Text>
                          {plyta.struktura === 1 && (
                            <Tag size="small" color="gold" style={{ marginLeft: 4 }}>
                              STRUKTURA
                            </Tag>
                          )}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {plyta.nazwa} • {plyta.grubosc}mm
                          </Text>
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <Paragraph 
                            ellipsis={{ rows: 1 }}
                            style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              margin: 0
                            }}
                          >
                            {plyta.opis}
                          </Paragraph>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <Tooltip title={getStockStatus(plyta.stan_magazynowy)}>
                          <Badge 
                            count={plyta.stan_magazynowy} 
                            overflowCount={999}
                            style={{ 
                              backgroundColor: getStockColor(plyta.stan_magazynowy)
                            }}
                          />
                        </Tooltip>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
                          {getStockStatus(plyta.stan_magazynowy)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <div style={{ 
            marginTop: 12, 
            paddingTop: 8, 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <InfoCircleOutlined /> Wyświetlono {filteredPlyty.length} z {plyty.length} płyt
            </Text>
            <Button size="small" onClick={() => setIsExpanded(false)}>
              Zamknij
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
