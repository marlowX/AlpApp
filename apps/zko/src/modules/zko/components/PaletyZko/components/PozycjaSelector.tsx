/**
 * @fileoverview Komponent wyboru pozycji ZKO
 * @module PaletyZko/components/PozycjaSelector
 */

import React, { useEffect, useState } from 'react';
import { Select, Space, Typography, Tag, Spin } from 'antd';
import axios from 'axios';
import { PozycjaZKO } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface PozycjaSelectorProps {
  zkoId: number;
  selectedPozycjaId?: number;
  onSelect: (pozycjaId: number) => void;
  loading?: boolean;
}

// Używamy proxy z Vite - /api jest przekierowane na localhost:5001
const API_URL = '/api';

export const PozycjaSelector: React.FC<PozycjaSelectorProps> = ({
  zkoId,
  selectedPozycjaId,
  onSelect,
  loading = false
}) => {
  const [pozycje, setPozycje] = useState<PozycjaZKO[]>([]);
  const [loadingPozycje, setLoadingPozycje] = useState(false);

  useEffect(() => {
    const fetchPozycje = async () => {
      setLoadingPozycje(true);
      try {
        // POPRAWIONY ENDPOINT - używamy /api/zko/:id aby pobrać szczegóły ZKO z pozycjami
        const response = await axios.get(`${API_URL}/zko/${zkoId}`);
        if (response.data && response.data.pozycje) {
          setPozycje(response.data.pozycje || []);
          
          // Automatycznie wybierz pierwszą pozycję jeśli nie ma wybranej
          if (!selectedPozycjaId && response.data.pozycje?.length > 0) {
            onSelect(response.data.pozycje[0].id);
          }
        }
      } catch (error) {
        console.error('Błąd pobierania pozycji:', error);
      } finally {
        setLoadingPozycje(false);
      }
    };

    if (zkoId) {
      fetchPozycje();
    }
  }, [zkoId]); // Usunąłem selectedPozycjaId i onSelect z dependencies aby uniknąć nieskończonej pętli

  const selectedPozycja = pozycje.find(p => p.id === selectedPozycjaId);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text strong>Wybierz pozycję ZKO:</Text>
      <Select
        value={selectedPozycjaId}
        onChange={onSelect}
        style={{ width: '100%' }}
        placeholder="Wybierz pozycję do zarządzania paletami"
        loading={loading || loadingPozycje}
        disabled={loading || loadingPozycje}
        notFoundContent={loadingPozycje ? <Spin size="small" /> : 'Brak pozycji'}
      >
        {pozycje.map(pozycja => (
          <Option key={pozycja.id} value={pozycja.id}>
            <Space>
              <Text>Poz. {pozycja.kolejnosc || pozycja.id}</Text>
              <Tag color="blue">{pozycja.kolor_plyty}</Tag>
              <Text type="secondary">{pozycja.nazwa_plyty}</Text>
              <Text>({pozycja.ilosc_plyt} płyt)</Text>
            </Space>
          </Option>
        ))}
      </Select>
      
      {selectedPozycja && (
        <Space>
          <Text type="secondary">Wybrana pozycja:</Text>
          <Tag color="green">Poz. {selectedPozycja.kolejnosc || selectedPozycja.id}</Tag>
          <Text>{selectedPozycja.nazwa_plyty}</Text>
          <Tag>{selectedPozycja.kolor_plyty}</Tag>
        </Space>
      )}
    </Space>
  );
};