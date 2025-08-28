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
        .slice(0, 15);
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

    return sortedFiltered.slice(0, 30); // Max 30 wyników
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
                <Text strong style={{ color: '#52c41a' }}>
                  {selectedPlyta.kolor_nazwa}
                </Text>
                {selectedPlyta.struktura === 1 && (
                  <Tag color="gold">STRUKTURA</Tag>
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
              placeholder="Wpisz część nazwy, koloru lub opisu (np: 'biał 18' znajdzie 'BIAŁY 18mm')"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              autoFocus
              size="large"
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                💡 Wskazówka: Możesz wpisać wiele słów - zostaną wyszukane wszystkie pasujące płyty
              </Text>
            </div>
          </div>

          {searchText && (
            <Alert
              message={`Szukam: "${searchText}" - znaleziono ${filteredPlyty.length} płyt`}
              type="info"
              icon={<SearchOutlined />}
              style={{ marginBottom: 8 }}
              closable={false}
            />
          )}

          <div style={{ maxHeight: 450, overflowY: 'auto', paddingRight: 4 }}>
            {filteredPlyty.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <Text>Brak płyt spełniających kryteria</Text>
                    {searchText && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Spróbuj użyć innych słów kluczowych
                      </Text>
                    )}
                  </Space>
                }
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
                      border: plyta.kolor_nazwa === value ? '2px solid #52c41a' : '1px solid #d9d9d9',
                      opacity: plyta.stan_magazynowy === 0 ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div>
                          <Text strong style={{
                            color: plyta.stan_magazynowy > 0 ? '#1890ff' : '#999',
                            fontSize: '14px'
                          }}>
                            {plyta.kolor_nazwa}
                          </Text>
                          {plyta.struktura === 1 && (
                            <Tag color="gold" style={{ marginLeft: 4 }}>
                              STRUKTURA
                            </Tag>
                          )}
                          {plyta.stan_magazynowy === 0 && (
                            <Tag color="error" style={{ marginLeft: 4 }}>
                              BRAK
                            </Tag>
                          )}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {plyta.nazwa} • {plyta.grubosc}mm
                            {plyta.dlugosc && plyta.szerokosc &&
                              ` • ${plyta.dlugosc}x${plyta.szerokosc}mm`
                            }
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
                        {plyta.cena_za_plyte !== undefined && plyta.cena_za_plyte !== null && (
                          <div style={{ marginTop: 2 }}>
                            <Text style={{ fontSize: '10px', color: '#999' }}>
                              Cena: {formatPrice(plyta.cena_za_plyte)} zł/płyta
                              {plyta.cena_za_m2 !== undefined && plyta.cena_za_m2 !== null &&
                                ` | ${formatPrice(plyta.cena_za_m2)} zł/m²`
                              }
                            </Text>
                          </div>
                        )}
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
                        {plyta.stan_magazynowy === 0 && (
                          <WarningOutlined style={{ color: '#ff4d4f', marginTop: 4 }} />
                        )}
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
              {!searchText && ' (pokazuję tylko płyty dostępne na magazynie)'}
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
