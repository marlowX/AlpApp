/**
 * @fileoverview Test page for drag & drop debugging
 * @module PaletyZko/DebugPage
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

export const PaletyDebugPage: React.FC = () => {
  const [formatki, setFormatki] = useState<any[]>([]);
  const [palety, setPalety] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pobierz formatki dla pozycji 79 (która ma formatki 337-341)
  const fetchFormatki = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/zko/pozycje/79/formatki');
      setFormatki(response.data.formatki || []);
      message.success(`Pobrano ${response.data.formatki?.length} formatek`);
    } catch (error) {
      message.error('Błąd pobierania formatek');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz palety dla ZKO 28
  const fetchPalety = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/pallets/zko/28/details');
      setPalety(response.data.palety || []);
      message.success(`Pobrano ${response.data.palety?.length} palet`);
    } catch (error) {
      message.error('Błąd pobierania palet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Test dodania formatki do palety
  const testDodajFormatke = async (paletaId: number, formatkaId: number, ilosc: number) => {
    setLoading(true);
    try {
      console.log('Wysyłam:', { paletaId, formatkaId, ilosc });
      
      const response = await axios.post(`/api/pallets/${paletaId}/update-formatki`, {
        formatki: [{ formatka_id: formatkaId, ilosc: ilosc }],
        przeznaczenie: 'MAGAZYN',
        uwagi: 'Test z debug page'
      });
      
      console.log('Odpowiedź:', response.data);
      
      if (response.data.sukces) {
        message.success('Formatka dodana pomyślnie!');
        await fetchPalety(); // Odśwież palety
      } else {
        message.error(response.data.komunikat || 'Błąd dodawania');
      }
    } catch (error: any) {
      message.error('Błąd: ' + (error.response?.data?.error || error.message));
      console.error('Szczegóły błędu:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Test wywołania funkcji PostgreSQL bezpośrednio
  const testPostgresFunction = async (paletaId: number, formatkaId: number, ilosc: number) => {
    setLoading(true);
    try {
      console.log('Test funkcji PostgreSQL pal_edytuj:', { paletaId, formatkaId, ilosc });
      
      const response = await axios.post('/api/test/pal-edytuj', {
        paleta_id: paletaId,
        formatki: [{ formatka_id: formatkaId, ilosc: ilosc }],
        przeznaczenie: 'MAGAZYN',
        uwagi: 'Test bezpośredni',
        operator: 'debug_user'
      });
      
      console.log('Wynik funkcji:', response.data);
      message.success('Funkcja wykonana!');
    } catch (error: any) {
      message.error('Błąd funkcji: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormatki();
    fetchPalety();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Debug Drag & Drop</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Przyciski akcji */}
        <Card title="Akcje">
          <Space>
            <Button onClick={fetchFormatki} loading={loading}>
              Pobierz formatki
            </Button>
            <Button onClick={fetchPalety} loading={loading}>
              Pobierz palety
            </Button>
          </Space>
        </Card>

        {/* Lista formatek */}
        <Card title={`Formatki (${formatki.length})`}>
          {formatki.map(f => (
            <div key={f.id} style={{ marginBottom: 16, padding: 8, border: '1px solid #d9d9d9' }}>
              <Space direction="vertical">
                <Text strong>ID: {f.id}</Text>
                <Text>Nazwa: {f.nazwa_formatki}</Text>
                <Text>Wymiary: {f.dlugosc} × {f.szerokosc} mm</Text>
                <Text>Ilość planowana: {f.ilosc_planowana}</Text>
                <Text>Pozycja ID: {f.pozycja_id}</Text>
                <Button 
                  size="small"
                  onClick={() => {
                    const paletaId = palety[0]?.id;
                    if (paletaId) {
                      testDodajFormatke(paletaId, f.id, 10);
                    } else {
                      message.warning('Brak palet!');
                    }
                  }}
                  disabled={!palety.length}
                >
                  Dodaj 10 szt. do pierwszej palety
                </Button>
              </Space>
            </div>
          ))}
        </Card>

        {/* Lista palet */}
        <Card title={`Palety (${palety.length})`}>
          {palety.map(p => (
            <div key={p.id} style={{ marginBottom: 16, padding: 8, border: '1px solid #d9d9d9' }}>
              <Space direction="vertical">
                <Text strong>ID: {p.id} | {p.numer_palety}</Text>
                <Text>Status: {p.status}</Text>
                <Text>Formatek: {p.ilosc_formatek || 0}</Text>
                <Text>Formatki IDs: {JSON.stringify(p.formatki_ids)}</Text>
                <Paragraph>
                  Szczegóły: {JSON.stringify(p.formatki_szczegoly || [])}
                </Paragraph>
                <Space>
                  <Button 
                    size="small"
                    onClick={() => {
                      const formatkaId = formatki[0]?.id;
                      if (formatkaId) {
                        testDodajFormatke(p.id, formatkaId, 5);
                      } else {
                        message.warning('Brak formatek!');
                      }
                    }}
                    disabled={!formatki.length}
                  >
                    Dodaj pierwszą formatkę (5 szt.)
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => {
                      const formatkaId = formatki[0]?.id;
                      if (formatkaId) {
                        testPostgresFunction(p.id, formatkaId, 3);
                      }
                    }}
                    disabled={!formatki.length}
                  >
                    Test funkcji PostgreSQL
                  </Button>
                </Space>
              </Space>
            </div>
          ))}
        </Card>

        {/* Konsola */}
        <Card title="Konsola">
          <Paragraph>
            <Text code>
              {`// Przykład wywołania
const response = await axios.post('/api/pallets/670/update-formatki', {
  formatki: [
    { formatka_id: 337, ilosc: 10 },
    { formatka_id: 338, ilosc: 5 }
  ],
  przeznaczenie: 'MAGAZYN',
  uwagi: 'Test'
});`}
            </Text>
          </Paragraph>
        </Card>
      </Space>
    </div>
  );
};

export default PaletyDebugPage;
