/**
 * @fileoverview Komponent wyświetlający istniejące palety
 * @module ExistingPalettes
 * 
 * UWAGA: Maksymalnie 300 linii kodu na plik!
 * Jeśli plik przekracza limit, należy go rozbić na podkomponenty.
 */

import React from 'react';
import { Card, Space, Typography, Badge, Tooltip } from 'antd';
import { PaletyTable } from './PaletyTable';

const { Text } = Typography;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  kolor: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  numer_pozycji?: number;
  nazwa_plyty?: string;
  kolor_plyty?: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

interface ExistingPalettesProps {
  palety: Paleta[];
  loading: boolean;
  podsumowanie: any;
  deletingId: number | null;
  onViewDetails: (paleta: Paleta) => void;
  onDelete: (paletaId: number) => void;
}

export const ExistingPalettes: React.FC<ExistingPalettesProps> = ({
  palety,
  loading,
  podsumowanie,
  deletingId,
  onViewDetails,
  onDelete
}) => {
  if (palety.length === 0) return null;

  // Funkcja renderowania szczegółów formatek
  const renderFormatkiDetails = (paleta: Paleta) => {
    const formatki = paleta.formatki_szczegoly || [];
    
    if (formatki.length === 0) {
      return <Text type="secondary">Brak formatek</Text>;
    }

    const totalSztuk = formatki.reduce((sum, f) => sum + (f.ilosc || 0), 0);
    const uniqueColors = [...new Set(formatki.map(f => f.kolor).filter(Boolean))];

    return (
      <Tooltip
        title={
          <div>
            <strong>Szczegóły formatek:</strong>
            {formatki.map((f: FormatkaDetail, idx: number) => (
              <div key={f.formatka_id || idx}>
                • {f.nazwa || `${f.dlugosc}x${f.szerokosc}`}: {f.ilosc} szt.
                {f.kolor && ` (${f.kolor})`}
              </div>
            ))}
            <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 8 }}>
              <strong>Razem: {totalSztuk} szt.</strong>
            </div>
          </div>
        }
      >
        <Space direction="vertical" size={0}>
          <Text strong>{totalSztuk} szt.</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatki.length} typów
          </Text>
          {uniqueColors.length > 0 && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              {uniqueColors.join(', ')}
            </Text>
          )}
        </Space>
      </Tooltip>
    );
  };

  return (
    <Card 
      size="small" 
      style={{ 
        marginBottom: 16, 
        border: '2px solid #52c41a',
        backgroundColor: '#f6ffed'
      }}
      title={
        <Space>
          <Badge count={palety.length} style={{ backgroundColor: '#52c41a' }} />
          <Text strong style={{ color: '#52c41a' }}>Istniejące palety (wykonane)</Text>
          {podsumowanie && (
            <Text type="secondary">
              {podsumowanie.sztuk_total} szt. | {podsumowanie.waga_total?.toFixed(2)} kg
            </Text>
          )}
        </Space>
      }
    >
      <PaletyTable
        palety={palety}
        loading={loading}
        onViewDetails={onViewDetails}
        renderFormatkiColumn={renderFormatkiDetails}
        onDelete={onDelete}
        deletingId={deletingId}
      />
    </Card>
  );
};