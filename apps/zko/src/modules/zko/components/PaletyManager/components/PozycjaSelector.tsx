import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Select, 
  Space, 
  Typography, 
  Alert, 
  Spin,
  Tag,
  Tooltip
} from 'antd';
import { 
  InfoCircleOutlined,
  AppstoreOutlined 
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface Pozycja {
  id: number;
  kolejnosc: number;
  kolor_plyty: string;
  ilosc_plyt: number;
  nazwa_plyty: string;
  uwagi?: string;
  kod_rozkroju?: string;
  rozkroj_opis?: string;
  formatki_count?: number;
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
      
      // Pobierz pozycje wraz z liczbą formatek
      const response = await fetch(`/api/zko/${zkoId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Pobierz pozycje z ZKO i dodaj licznik formatek
        const pozycjeData = data.pozycje || [];
        
        // Dla każdej pozycji pobierz liczbę formatek
        const pozycjeWithCounts = await Promise.all(
          pozycjeData.map(async (pozycja: any) => {
            try {
              const formatkiResponse = await fetch(`/api/zko/pozycje/${pozycja.id}/formatki`);
              if (formatkiResponse.ok) {
                const formatkiData = await formatkiResponse.json();
                return {
                  ...pozycja,
                  formatki_count: formatkiData.total || 0
                };
              }
            } catch (error) {
              console.warn(`Could not fetch formatki count for pozycja ${pozycja.id}`);
            }
            return {
              ...pozycja,
              formatki_count: 0
            };
          })
        );
        
        setPozycje(pozycjeWithCounts);
        
        // Jeśli jest tylko jedna pozycja, automatycznie ją wybierz
        if (pozycjeWithCounts.length === 1 && !selectedPozycjaId) {
          onSelect(pozycjeWithCounts[0].id);
        }
      } else {
        console.error('Error fetching ZKO details:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching pozycje:', error);
    } finally {
      setLoadingPozycje(false);
    }
  };

  const selectedPozycja = pozycje.find(p => p.id === selectedPozycjaId);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center">
          <AppstoreOutlined />
          <Text strong>Wybierz pozycję ZKO:</Text>
          
          <Select
            style={{ minWidth: 400 }}
            placeholder="Wybierz pozycję do zarządzania paletami"
            value={selectedPozycjaId}
            onChange={onSelect}
            loading={loadingPozycje || loading}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {pozycje.map(pozycja => (
              <Option key={pozycja.id} value={pozycja.id}>
                <Space>
                  <Text strong>#{pozycja.kolejnosc}</Text>
                  <Tag color="blue">{pozycja.kolor_plyty}</Tag>
                  <Text>{pozycja.nazwa_plyty}</Text>
                  <Text type="secondary">({pozycja.ilosc_plyt} płyt)</Text>
                  {pozycja.formatki_count !== undefined && (
                    <Tag color="green">{pozycja.formatki_count} formatek</Tag>
                  )}
                </Space>
              </Option>
            ))}
          </Select>

          {selectedPozycja && (
            <Tooltip title={`Rozkrój: ${selectedPozycja.kod_rozkroju || 'Nieznany'}`}>
              <InfoCircleOutlined />
            </Tooltip>
          )}
        </Space>

        {selectedPozycja && (
          <Alert
            message={`Wybrana pozycja: #${selectedPozycja.kolejnosc} - ${selectedPozycja.kolor_plyty}`}
            description={`${selectedPozycja.nazwa_plyty} | ${selectedPozycja.ilosc_plyt} płyt | ${selectedPozycja.formatki_count || 0} formatek | Rozkrój: ${selectedPozycja.kod_rozkroju || 'Nieznany'}`}
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