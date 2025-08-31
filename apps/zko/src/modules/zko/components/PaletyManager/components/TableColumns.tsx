/**
 * @fileoverview Helper komponenty dla kolumn tabeli palet
 * @module TableColumns
 * 
 * Wydzielone renderery kolumn dla PaletyTable
 * Maksymalnie 300 linii kodu!
 */

import React from 'react';
import { Space, Tag, Typography, Progress, Text as AntText } from 'antd';
import { 
  BgColorsOutlined,
  NumberOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Interfejsy
interface FormatkaDetail {
  formatka_id: number;
  pozycja_id?: number;
  ilosc: number;
  nazwa: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
  nazwa_plyty?: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  pozycje_lista?: string;
  numer_pozycji?: number;
  nazwa_plyty?: string;
  kolor_plyty?: string;
  przeznaczenie?: string;
  kierunek?: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  waga_kg?: number;
  kolory_na_palecie: string;
  formatki_szczegoly?: FormatkaDetail[];
  formatki?: FormatkaDetail[];
  procent_wykorzystania?: number;
}

// Helper funkcje
export const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'PRZYGOTOWANE': 'blue',
    'W_PRODUKCJI': 'orange',
    'WYPRODUKOWANE': 'green',
    'WYSLANE': 'purple',
    'DOSTARCZONE': 'cyan',
    'przygotowanie': 'blue'
  };
  return statusColors[status] || 'default';
};

export const getPrzeznaczenieBadge = (przeznaczenie?: string) => {
  const icons: Record<string, string> = {
    'MAGAZYN': '📦',
    'OKLEINIARKA': '🎨',
    'WIERCENIE': '🔧',
    'CIECIE': '✂️',
    'WYSYLKA': '🚚'
  };
  
  const colors: Record<string, string> = {
    'MAGAZYN': 'blue',
    'OKLEINIARKA': 'orange',
    'WIERCENIE': 'purple',
    'CIECIE': 'red',
    'WYSYLKA': 'green'
  };

  if (!przeznaczenie) return null;

  return (
    <Tag color={colors[przeznaczenie] || 'default'}>
      {icons[przeznaczenie]} {przeznaczenie}
    </Tag>
  );
};

// Renderer dla kolumny Pozycje
export const renderPozycje = (record: Paleta) => {
  if (!record.pozycje_lista) {
    return <Text type="secondary" style={{ fontSize: 11 }}>-</Text>;
  }
  
  const pozycje = record.pozycje_lista.split(',').map(p => p.trim());
  
  return (
    <Space direction="vertical" size={2}>
      {pozycje.map((poz, idx) => (
        <Tag 
          key={idx}
          color="blue" 
          style={{ 
            fontSize: 11,
            margin: 0,
            padding: '0 6px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <NumberOutlined style={{ fontSize: 10, marginRight: 3 }} />
          {poz}
        </Tag>
      ))}
    </Space>
  );
};

// Renderer dla kolumny Kolory
export const renderKolory = (kolory: string) => {
  if (!kolory) return <Text type="secondary" style={{ fontSize: 11 }}>-</Text>;
  
  const koloryArray = kolory.split(',').map(k => k.trim()).filter(k => k);
  return (
    <Space size={4} wrap>
      {koloryArray.map((kolor, index) => (
        <Tag 
          key={index} 
          style={{ 
            fontSize: 10,
            padding: '0 6px',
            margin: 0
          }}
        >
          <BgColorsOutlined style={{ fontSize: 10, marginRight: 2 }} />
          {kolor}
        </Tag>
      ))}
    </Space>
  );
};

// Renderer dla kolumny Wysokość
export const renderWysokosc = (wysokosc: number) => {
  const wysokoscNum = Number(wysokosc) || 0;
  const percent = Math.round((wysokoscNum / 1440) * 100);
  return (
    <Space direction="vertical" size={0} align="center">
      <Text strong style={{ fontSize: 12 }}>{wysokoscNum} mm</Text>
      <Progress 
        percent={percent} 
        size="small" 
        showInfo={false}
        strokeColor={wysokoscNum > 1440 ? '#ff4d4f' : '#52c41a'}
        style={{ width: 80 }}
      />
      <Text type="secondary" style={{ fontSize: 10 }}>
        {percent}%
      </Text>
    </Space>
  );
};

// Renderer dla kolumny Waga
export const renderWaga = (waga?: number | string) => {
  if (!waga && waga !== 0) return <Text type="secondary" style={{ fontSize: 11 }}>-</Text>;
  
  const wagaNum = Number(waga);
  if (!Number.isFinite(wagaNum)) return <Text type="secondary" style={{ fontSize: 11 }}>-</Text>;
  
  const percent = Math.round((wagaNum / 700) * 100);
  return (
    <Space direction="vertical" size={0} align="center">
      <Text strong style={{ fontSize: 12 }}>{wagaNum.toFixed(1)} kg</Text>
      <Progress 
        percent={percent} 
        size="small" 
        showInfo={false}
        strokeColor={wagaNum > 700 ? '#ff4d4f' : '#52c41a'}
        style={{ width: 80 }}
      />
      <Text type="secondary" style={{ fontSize: 10 }}>
        {percent}%
      </Text>
    </Space>
  );
};

// Renderer dla kolumny Wykorzystanie
export const renderWykorzystanie = (record: Paleta) => {
  const percent = Number(record.procent_wykorzystania) || 
                 Math.round(((record.sztuk_total || record.ilosc_formatek || 0) / 80) * 100);
  return (
    <Space direction="vertical" size={0} align="center">
      <Progress 
        type="circle" 
        percent={percent} 
        width={45}
        strokeColor={
          percent >= 80 ? '#52c41a' :
          percent >= 50 ? '#faad14' : '#ff4d4f'
        }
        format={(p) => <span style={{ fontSize: 10 }}>{p}%</span>}
      />
      <Text type="secondary" style={{ fontSize: 10 }}>
        wykorzystania
      </Text>
    </Space>
  );
};

// Renderer dla kolumny Formatki
export const renderFormatki = (paleta: Paleta) => {
  const formatki = paleta.formatki || paleta.formatki_szczegoly || [];
  
  if (formatki.length === 0) {
    return <Text type="secondary">Brak formatek</Text>;
  }

  // Grupuj formatki według pozycji
  const formatkiByPozycja = formatki.reduce((acc, f) => {
    const pozId = f.pozycja_id || 'unknown';
    if (!acc[pozId]) {
      acc[pozId] = [];
    }
    acc[pozId].push(f);
    return acc;
  }, {} as Record<string, FormatkaDetail[]>);

  // Wyświetl formatki
  const allFormatki: JSX.Element[] = [];
  let totalCount = 0;
  
  Object.entries(formatkiByPozycja).forEach(([pozycjaId, pozFormatki]) => {
    // Nagłówek pozycji jeśli jest więcej niż jedna
    if (Object.keys(formatkiByPozycja).length > 1 && pozycjaId !== 'unknown') {
      allFormatki.push(
        <div key={`header-${pozycjaId}`} style={{ marginTop: totalCount > 0 ? 8 : 0, marginBottom: 4 }}>
          <Tag color="blue" style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
            <NumberOutlined style={{ fontSize: 10, marginRight: 2 }} />
            Pozycja {pozycjaId}
          </Tag>
        </div>
      );
    }
    
    // Sortuj według wymiarów
    pozFormatki
      .sort((a, b) => {
        const aSize = (a.dlugosc || 0) * (a.szerokosc || 0);
        const bSize = (b.dlugosc || 0) * (b.szerokosc || 0);
        return bSize - aSize;
      })
      .forEach((f) => {
        const formatkaName = f.dlugosc && f.szerokosc 
          ? `${Number(f.dlugosc).toFixed(0)}×${Number(f.szerokosc).toFixed(0)}`
          : f.nazwa || 'Formatka';
        
        allFormatki.push(
          <div key={`${pozycjaId}-${f.formatka_id}-${totalCount}`} 
               style={{ fontSize: 12, marginBottom: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Text strong style={{ minWidth: '80px' }}>{formatkaName}</Text>
            <Text type="secondary">→</Text>
            <Text strong style={{ color: '#1890ff' }}>{f.ilosc} szt.</Text>
          </div>
        );
        totalCount++;
      });
  });

  const totalSztuk = formatki.reduce((sum, f) => sum + (f.ilosc || 0), 0);

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
        {allFormatki}
      </div>
      {formatki.length > 0 && (
        <div style={{ 
          marginTop: 6, 
          paddingTop: 6, 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
            <BoxPlotOutlined style={{ marginRight: 4 }} />
            Σ {totalSztuk} szt.
          </Text>
          <Text type="secondary" style={{ fontSize: 10 }}>
            {formatki.length} typów
          </Text>
        </div>
      )}
    </Space>
  );
};