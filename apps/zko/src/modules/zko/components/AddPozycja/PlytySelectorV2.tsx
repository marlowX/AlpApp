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
  Tooltip,
  Alert
} from 'antd';
import { SearchOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
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

  // Ulepszone filtrowanie płyt - rozbijamy frazę na słowa i szukamy każdego
  const filteredPlyty = useMemo(() => {
    if (!searchText) {
      // Początkowo pokazuj tylko aktywne płyty z dobrym stanem
      return plyty
        .filter(p => p.aktywna !== false && p.stan_magazynowy > 0)
        .sort((a, b) => b.stan_magazynowy - a.stan_magazynowy)
        .slice(0, 10); // Zmniejszone z 15 na 10
    }

    // Rozbij frazę wyszukiwania na słowa
    const searchWords = searchText.toLowerCase().split(/\s+/).filter(word => word.length > 0);

    const filtered = plyty.filter(plyta => {
      const searchableText = [
        plyta.opis,
        plyta.kolor_nazwa,
        plyta.nazwa,
        plyta.grubosc?.toString(),
        plyta.struktura === 1 ? 'struktura' : '',
      ].join(' ').toLowerCase();

      // Sprawdź czy wszystkie słowa z wyszukiwania znajdują się w tekście
      return searchWords.every(word => searchableText.includes(word));
    });

    // Sortuj wyniki - najpierw dokładne dopasowania, potem częściowe
    const sortedFiltered = filtered.sort((a, b) => {
      const aExact = a.kolor_nazwa.toLowerCase() === searchText.toLowerCase();
      const bExact = b.kolor_nazwa.toLowerCase() === searchText.toLowerCase();

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Następnie sortuj po stanie magazynowym
      return b.stan_magazynowy - a.stan_magazynowy;
    });

    return sortedFiltered.slice(0, 20); // Zmniejszone z 30 na 20
  }, [plyty, searchText]);

  const handleSelectPlyta = (plyta: Plyta) => {
    console.log('✅ Wybrano płytę:', plyta);
    onChange?.(plyta);
    setIsExpanded(false);
    setSearchText('');
  };

  const handleClear = () => {
    console.log('🗑️ Czyszczenie wyboru płyty');
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
    if (stock === 0) return 'Brak na magazynie!';
    return 'Bardzo niski';
  };

  // Pomocnicza funkcja do bezpiecznego formatowania ceny
  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return 'N/A';
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    // Jeśli to string, spróbuj przekonwertować
    const numPrice = parseFloat(price as any);
    return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
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
                <Text strong style={{ color: '#52c41a', fontSize: '13px' }}>
                  {selectedPlyta.kolor_nazwa}
                </Text>
                {selectedPlyta.struktura === 1 && (
                  <Tag color="gold" style={{ fontSize: '10px', padding: '0 4px', height: '16px', lineHeight: '16px' }}>
                    STRUKTURA
                  </Tag>
                )}
              </Space>
              <div style={{ marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {selectedPlyta.nazwa} • {selectedPlyta.grubosc}mm • {selectedPlyta.dlugosc}×{selectedPlyta.szerokosc}mm
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tooltip title={getStockStatus(selectedPlyta.stan_magazynowy)}>
                <Badge
                  count={selectedPlyta.stan_magazynowy}
                  overflowCount={999}
                  style={{
                    backgroundColor: getStockColor(selectedPlyta.stan_magazynowy),
                    fontSize: '10px'
                  }}
                />
              </Tooltip>
              <Button size="small" onClick={() => setIsExpanded(true)} disabled={disabled} style={{ fontSize: '11px', height: '22px' }}>
                Zmień
              </Button>
              <Button size="small" onClick={handleClear} disabled={disabled} style={{ fontSize: '11px', height: '22px' }}>
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
          style={{ height: 32, textAlign: 'left' }}
          disabled={disabled}
        >
          <Space>
            <SearchOutlined />
            {placeholder}
          </Space>
        </Button>
      )}

      {/* Rozwinięty widok z wyszukiwaniem - ZMNIEJSZONA WYSOKOŚĆ */}
      {isExpanded && (
        <Card size="small" style={{ marginTop: selectedPlyta ? 8 : 0 }}>
          <div style={{ marginBottom: 8 }}>
            <Search
              placeholder="Wpisz część nazwy, koloru lub opisu (np: 'biał 18')"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              autoFocus
              size="middle"
              style={{ fontSize: '12px' }}
            />
            <div style={{ marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                💡 Możesz wpisać wiele słów - zostaną wyszukane wszystkie pasujące płyty
              </Text>
            </div>
          </div>

          {searchText && (
            <div style={{ marginBottom: 6, padding: '4px 8px', background: '#e6f7ff', borderRadius: '3px' }}>
              <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                Szukam: "{searchText}" - znaleziono {filteredPlyty.length} płyt
              </Text>
            </div>
          )}

          {/* ZMNIEJSZONA WYSOKOŚĆ LISTY z 450px na 280px */}
          <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {filteredPlyty.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                imageStyle={{ height: 40 }}
                description={
                  <Text style={{ fontSize: '12px' }}>
                    Brak płyt spełniających kryteria
                  </Text>
                }
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={2}>
                {filteredPlyty.map(plyta => (
                  <Card
                    key={plyta.id}
                    size="small"
                    hoverable
                    onClick={() => handleSelectPlyta(plyta)}
                    style={{
                      cursor: 'pointer',
                      border: plyta.kolor_nazwa === value ? '2px solid #52c41a' : '1px solid #d9d9d9',
                      opacity: plyta.stan_magazynowy === 0 ? 0.6 : 1
                    }}
                    styles={{
                      body: { padding: '6px 10px' }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Text strong style={{
                            color: plyta.stan_magazynowy > 0 ? '#1890ff' : '#999',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {plyta.kolor_nazwa}
                          </Text>
                          {plyta.struktura === 1 && (
                            <Tag color="gold" style={{ 
                              fontSize: '9px', 
                              padding: '0 3px', 
                              height: '14px', 
                              lineHeight: '14px',
                              margin: 0
                            }}>
                              STR
                            </Tag>
                          )}
                          {plyta.stan_magazynowy === 0 && (
                            <Tag color="error" style={{ 
                              fontSize: '9px', 
                              padding: '0 3px', 
                              height: '14px', 
                              lineHeight: '14px',
                              margin: 0
                            }}>
                              BRAK
                            </Tag>
                          )}
                        </div>
                        <div style={{ marginTop: 1 }}>
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            {plyta.grubosc}mm • {plyta.dlugosc}×{plyta.szerokosc}mm
                            {plyta.cena_za_plyte && ` • ${formatPrice(plyta.cena_za_plyte)} zł`}
                          </Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '60px' }}>
                        <Badge
                          count={plyta.stan_magazynowy}
                          overflowCount={999}
                          style={{
                            backgroundColor: getStockColor(plyta.stan_magazynowy),
                            fontSize: '10px'
                          }}
                        />
                        <div style={{ fontSize: '9px', color: '#666', marginTop: 1 }}>
                          {plyta.stan_magazynowy > 0 ? 'szt.' : 'brak'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <div style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              <InfoCircleOutlined /> Wyświetlono {filteredPlyty.length} z {plyty.length} płyt
            </Text>
            <Button size="small" onClick={() => setIsExpanded(false)} style={{ fontSize: '11px', height: '22px' }}>
              Zamknij
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};