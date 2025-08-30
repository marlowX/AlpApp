import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Select, 
  Space, 
  Typography, 
  Alert, 
  Spin,
  Tag,
  Tooltip,
  Badge
} from 'antd';
import { 
  InfoCircleOutlined,
  AppstoreOutlined,
  TableOutlined 
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface Pozycja {
  id: number;
  pozycja_id?: number;
  rozkroj_id?: number;
  kod_rozkroju?: string;
  rozkroj_opis?: string;
  kolor_plyty: string;
  nazwa_plyty: string;
  ilosc_plyt: number;
  typy_formatek?: number;
  sztuk_formatek?: number;
  uwagi?: string;
}

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
}

export const PozycjaSelector: React.FC<PozycjaSelectorProps> = ({
  zkoId,
  selectedPozycjaId,
  onSelect,
  loading = false
}) => {
  const [pozycje, setPozycje] = useState<Pozycja[]>([]);
  const [loadingPozycje, setLoadingPozycje] = useState(false);

  useEffect(() => {
    fetchPozycje();
  }, [zkoId]);

  const fetchPozycje = async () => {
    try {
      setLoadingPozycje(true);
      
      // Pobierz pozycje z backendu
      const response = await fetch(`/api/zko/${zkoId}/pozycje`);
      
      if (response.ok) {
        const data = await response.json();
        const pozycjeData = data.pozycje || data || [];
        
        setPozycje(pozycjeData);
        
        // Jeśli jest tylko jedna pozycja, automatycznie ją wybierz
        if (pozycjeData.length === 1 && !selectedPozycjaId) {
          onSelect(pozycjeData[0].id || pozycjeData[0].pozycja_id);
        }
      } else {
        console.error('Error fetching pozycje:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching pozycje:', error);
    } finally {
      setLoadingPozycje(false);
    }
  };

  const selectedPozycja = pozycje.find(p => (p.id || p.pozycja_id) === selectedPozycjaId);

  // Funkcja formatująca numer pozycji
  const formatPozycjaNr = (pozycja: Pozycja, index: number) => {
    // Użyj ID pozycji jako numer jeśli nie ma innego pola
    const numer = pozycja.pozycja_id || pozycja.id;
    return `#${numer}`;
  };

  // Funkcja formatująca liczbę formatek
  const formatFormatkiInfo = (pozycja: Pozycja) => {
    if (pozycja.sztuk_formatek && pozycja.typy_formatek) {
      return `${pozycja.typy_formatek} typów (${pozycja.sztuk_formatek} szt.)`;
    } else if (pozycja.typy_formatek) {
      return `${pozycja.typy_formatek} typów formatek`;
    }
    return 'Brak formatek';
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center">
          <AppstoreOutlined />
          <Text strong>Wybierz pozycję ZKO:</Text>
          
          <Select
            style={{ minWidth: 500 }}
            placeholder="Wybierz pozycję do zarządzania paletami"
            value={selectedPozycjaId}
            onChange={onSelect}
            loading={loadingPozycje || loading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const content = option?.children as any;
              const searchText = JSON.stringify(content).toLowerCase();
              return searchText.includes(input.toLowerCase());
            }}
          >
            {pozycje.map((pozycja, index) => (
              <Option key={pozycja.id || pozycja.pozycja_id} value={pozycja.id || pozycja.pozycja_id}>
                <Space>
                  <Badge 
                    count={formatPozycjaNr(pozycja, index)} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <Tag color="blue">{pozycja.kolor_plyty}</Tag>
                  <Text>{pozycja.nazwa_plyty}</Text>
                  <Text type="secondary">({pozycja.ilosc_plyt} płyt)</Text>
                  <Tag color="green" icon={<TableOutlined />}>
                    {formatFormatkiInfo(pozycja)}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>

          {selectedPozycja && selectedPozycja.kod_rozkroju && (
            <Tooltip title={`Rozkrój: ${selectedPozycja.kod_rozkroju} - ${selectedPozycja.rozkroj_opis || ''}`}>
              <InfoCircleOutlined />
            </Tooltip>
          )}
        </Space>

        {selectedPozycja && (
          <Alert
            message={
              <Space>
                <Text strong>Wybrana pozycja:</Text>
                <Badge 
                  count={formatPozycjaNr(selectedPozycja, 0)} 
                  style={{ backgroundColor: '#52c41a' }}
                />
                <Text>{selectedPozycja.kolor_plyty}</Text>
              </Space>
            }
            description={
              <Space direction="vertical">
                <Text>
                  {selectedPozycja.nazwa_plyty} | {selectedPozycja.ilosc_plyt} płyt
                </Text>
                <Text>
                  Formatki: {formatFormatkiInfo(selectedPozycja)}
                </Text>
                {selectedPozycja.kod_rozkroju && (
                  <Text type="secondary">
                    Rozkrój: {selectedPozycja.kod_rozkroju} - {selectedPozycja.rozkroj_opis || ''}
                  </Text>
                )}
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        {pozycje.length === 0 && !loadingPozycje && (
          <Alert
            message="Brak pozycji w ZKO"
            description="To ZKO nie ma jeszcze dodanych pozycji. Dodaj pozycje, aby móc tworzyć palety."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};