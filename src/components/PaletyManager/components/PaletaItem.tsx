import React from 'react';
import { Card, Button, Tag, Progress, Tooltip, Space } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Paleta, Formatka } from '../types';

interface PaletaItemProps {
  paleta: Paleta;
  index: number;
  dostepneFormatki: Formatka[];
  onAddFormatka: (paletaId: string, formatkaId: number, ilosc: number) => void;
  onRemoveFormatka: (paletaId: string, formatkaId: number) => void;
  onUpdateIlosc: (paletaId: string, formatkaId: number, nowaIlosc: number) => void;
  onDeletePaleta: (paletaId: string) => void;
  onDodajWszystkie?: (paletaId: string, formatkaId: number) => void;
}

export const PaletaItem: React.FC<PaletaItemProps> = ({
  paleta,
  index,
  dostepneFormatki,
  onAddFormatka,
  onRemoveFormatka,
  onUpdateIlosc,
  onDeletePaleta,
  onDodajWszystkie
}) => {
  // Oblicz wagę i wysokość
  const obliczWage = () => {
    return paleta.formatki.reduce((sum, f) => {
      const formatka = dostepneFormatki.find(df => df.id === f.formatka_id);
      if (!formatka) return sum;
      const waga = (formatka.dlugosc * formatka.szerokosc * 18 * 0.8) / 1000000000;
      return sum + (waga * f.ilosc);
    }, 0);
  };

  const obliczWysokosc = () => {
    return paleta.formatki.reduce((sum, f) => sum + (f.ilosc * 18), 0);
  };

  const waga = obliczWage();
  const wysokosc = obliczWysokosc();
  const wykorzystanieWagi = (waga / paleta.max_waga) * 100;
  const wykorzystanieWysokosci = (wysokosc / paleta.max_wysokosc) * 100;

  // Kolory dla przeznaczenia
  const getPrzeznaczenieBadge = () => {
    const colors: Record<string, string> = {
      MAGAZYN: 'blue',
      OKLEINIARKA: 'orange',
      WIERCENIE: 'purple',
      CIECIE: 'red',
      WYSYLKA: 'green'
    };
    const icons: Record<string, string> = {
      MAGAZYN: '📦',
      OKLEINIARKA: '🎨',
      WIERCENIE: '🔧',
      CIECIE: '✂️',
      WYSYLKA: '🚚'
    };
    return (
      <Tag color={colors[paleta.przeznaczenie] || 'default'}>
        {icons[paleta.przeznaczenie]} {paleta.przeznaczenie}
      </Tag>
    );
  };

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <span>
            Paleta {index + 1} 
            {paleta.numer_palety && (
              <Tag color="blue" className="ml-2">{paleta.numer_palety}</Tag>
            )}
          </span>
          <Space>
            {getPrzeznaczenieBadge()}
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => onDeletePaleta(paleta.id)}
            />
          </Space>
        </div>
      }
      className="mb-4"
    >
      {/* Statystyki palety */}
      <div className="mb-4">
        <div className="mb-2">
          <span>Waga: {waga.toFixed(2)} / {paleta.max_waga} kg</span>
          <Progress 
            percent={Math.min(wykorzystanieWagi, 100)} 
            status={wykorzystanieWagi > 90 ? 'exception' : 'normal'}
            strokeColor={wykorzystanieWagi > 90 ? '#ff4d4f' : undefined}
          />
        </div>
        <div>
          <span>Wysokość: {wysokosc} / {paleta.max_wysokosc} mm</span>
          <Progress 
            percent={Math.min(wykorzystanieWysokosci, 100)}
            status={wykorzystanieWysokosci > 90 ? 'exception' : 'normal'}
            strokeColor={wykorzystanieWysokosci > 90 ? '#ff4d4f' : undefined}
          />
        </div>
      </div>

      {/* Lista formatek w palecie */}
      <div className="space-y-2">
        {paleta.formatki.map((formatkaWPalecie) => {
          const formatka = dostepneFormatki.find(f => f.id === formatkaWPalecie.formatka_id);
          if (!formatka) return null;
          
          return (
            <div key={formatkaWPalecie.formatka_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex-1">
                <span className="font-medium">{formatka.nazwa}</span>
                <Tag color="blue" className="ml-2">{formatka.kolor}</Tag>
                <span className="text-sm text-gray-500 ml-2">
                  {formatka.dlugosc}x{formatka.szerokosc}mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formatkaWPalecie.ilosc}
                  onChange={(e) => {
                    const nowaIlosc = parseInt(e.target.value) || 0;
                    onUpdateIlosc(paleta.id, formatkaWPalecie.formatka_id, nowaIlosc);
                  }}
                  className="w-20 px-2 py-1 border rounded"
                  min="0"
                />
                <span className="text-sm">szt.</span>
                {onDodajWszystkie && (
                  <Tooltip title="Dodaj wszystkie dostępne">
                    <Button
                      size="small"
                      onClick={() => onDodajWszystkie(paleta.id, formatkaWPalecie.formatka_id)}
                    >
                      Wszystkie
                    </Button>
                  </Tooltip>
                )}
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={() => onRemoveFormatka(paleta.id, formatkaWPalecie.formatka_id)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dodawanie nowych formatek */}
      {paleta.formatki.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          Brak formatek - użyj przycisku "Dodaj formatkę" poniżej
        </div>
      )}
    </Card>
  );
};
