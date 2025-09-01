/**
 * @fileoverview Selektor formatek z DRAG & DROP
 * @module PaletyZko/components/FormatkaSelectorDND
 */

import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Badge,
  Empty,
  Alert,
  Divider
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  DragOutlined
} from '@ant-design/icons';
import { Formatka } from '../types';
import { FormatkaItem } from './FormatkaItem';
import { formatujWymiary, formatujKolor, formatujWage, obliczWageSztuki } from '../utils';

const { Text, Title } = Typography;
const { Option } = Select;

interface FormatkaSelectorDNDProps {
  formatki: Formatka[];
  loading?: boolean;
  onSelectFormatka?: (formatka: Formatka, ilosc: number) => void;
}

export const FormatkaSelectorDND: React.FC<FormatkaSelectorDNDProps> = ({
  formatki,
  loading = false,
  onSelectFormatka
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterKolor, setFilterKolor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rozmiar' | 'ilosc' | 'kolor'>('rozmiar');

  // Konwersja do nowego formatu
  const formatkiConverted: Formatka[] = formatki.map(f => ({
    ...f,
    dlugosc: f.wymiar_x || f.dlugosc || 0,
    szerokosc: f.wymiar_y || f.szerokosc || 0,
    sztuki_dostepne: f.ilosc_dostepna || f.sztuki_dostepne || 0,
    nazwa_plyty: f.numer_formatki || f.nazwa_plyty || 'FORMATKA'
  }));

  // Filtrowanie i sortowanie
  const filteredFormatki = formatkiConverted
    .filter(f => {
      const matchSearch = !searchText || 
        `${f.dlugosc} × ${f.szerokosc}`.includes(searchText) ||
        (f.nazwa_plyty && f.nazwa_plyty.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchKolor = filterKolor === 'all' || f.kolor === filterKolor;
      
      return matchSearch && matchKolor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rozmiar':
          return (b.dlugosc * b.szerokosc) - (a.dlugosc * a.szerokosc);
        case 'ilosc':
          return b.sztuki_dostepne - a.sztuki_dostepne;
        case 'kolor':
          return (a.kolor || '').localeCompare(b.kolor || '');
        default:
          return 0;
      }
    });

  // Unikalne kolory
  const uniqueKolory = Array.from(new Set(formatki.map(f => f.kolor).filter(Boolean)));

  // Statystyki
  const totalSztuk = formatkiConverted.reduce((sum, f) => sum + f.sztuki_dostepne, 0);
  const totalWaga = formatkiConverted.reduce((sum, f) => sum + (obliczWageSztuki(f) * f.sztuki_dostepne), 0);

  return (
    <div className="formatka-selector">
      {/* Nagłówek ze statystykami */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0 }}>
            <AppstoreOutlined /> Dostępne formatki ({formatki.length})
          </Title>
          <Space>
            <Tag color="green">{totalSztuk} szt.</Tag>
            <Tag color="blue">{formatujWage(totalWaga)}</Tag>
          </Space>
        </Space>
      </div>

      {/* Filtry */}
      <Space style={{ width: '100%', marginBottom: 16 }} wrap>
        <Input
          placeholder="Szukaj formatki..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        
        <Select
          value={filterKolor}
          onChange={setFilterKolor}
          style={{ width: 150 }}
          placeholder="Wszystkie kolory"
        >
          <Option value="all">Wszystkie kolory</Option>
          {uniqueKolory.map(kolor => (
            <Option key={kolor} value={kolor}>
              <Badge color={kolor} text={formatujKolor(kolor)} />
            </Option>
          ))}
        </Select>
        
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 150 }}
        >
          <Option value="rozmiar">Sortuj po rozmiarze</Option>
          <Option value="ilosc">Sortuj po ilości</Option>
          <Option value="kolor">Sortuj po kolorze</Option>
        </Select>
      </Space>

      {/* Instrukcja drag & drop */}
      {totalSztuk > 0 && (
        <Alert
          message={
            <Space>
              <DragOutlined />
              <span>Przeciągnij i upuść formatki na palety</span>
            </Space>
          }
          description={
            <div>
              <p style={{ margin: '4px 0' }}>
                • Przeciągnij formatkę z listy poniżej na wybraną paletę w zakładce "Palety"
              </p>
              <p style={{ margin: '4px 0' }}>
                • Ustaw ilość sztuk przed przeciągnięciem
              </p>
              <p style={{ margin: '4px 0' }}>
                • Możesz też kliknąć przycisk kopiowania aby dodać ręcznie
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Divider />

      {/* Lista formatek z drag & drop */}
      {loading ? (
        <Card loading style={{ marginTop: 16 }} />
      ) : filteredFormatki.length > 0 ? (
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredFormatki.map(formatka => (
            <FormatkaItem
              key={formatka.id}
              formatka={formatka}
              onSelectFormatka={onSelectFormatka}
            />
          ))}
        </div>
      ) : (
        <Empty 
          description={
            searchText || filterKolor !== 'all' 
              ? "Brak formatek spełniających kryteria" 
              : "Brak dostępnych formatek"
          }
        />
      )}
    </div>
  );
};
