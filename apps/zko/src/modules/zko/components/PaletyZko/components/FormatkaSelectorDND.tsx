/**
 * @fileoverview Selektor formatek z DRAG & DROP - wersja kompaktowa
 * @module PaletyZko/components/FormatkaSelectorDND
 */

import React, { useState } from 'react';
import {
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Badge,
  Empty,
  Divider
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Formatka } from '../types';
import { FormatkaItem } from './FormatkaItem';
import { formatujKolor, formatujWage, obliczWageSztuki } from '../utils';

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
    <div className="formatka-selector-compact">
      {/* Statystyki */}
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <Space>
          <Tag color="green">{totalSztuk} szt.</Tag>
          <Tag color="blue">{formatujWage(totalWaga)}</Tag>
          <Tag>{filteredFormatki.length} typów</Tag>
        </Space>
      </div>

      {/* Filtry - kompaktowe */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
        <Input
          placeholder="Szukaj formatki..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
        />
        
        <Space style={{ width: '100%' }}>
          <Select
            value={filterKolor}
            onChange={setFilterKolor}
            style={{ flex: 1 }}
            placeholder="Kolor"
            size="small"
          >
            <Option value="all">Wszystkie</Option>
            {uniqueKolory.map(kolor => (
              <Option key={kolor} value={kolor}>
                <Badge color={kolor} text={formatujKolor(kolor)} />
              </Option>
            ))}
          </Select>
          
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 100 }}
            size="small"
          >
            <Option value="rozmiar">Rozmiar</Option>
            <Option value="ilosc">Ilość</Option>
            <Option value="kolor">Kolor</Option>
          </Select>
        </Space>
      </Space>

      <Divider style={{ margin: '12px 0' }} />

      {/* Lista formatek z drag & drop */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          Ładowanie...
        </div>
      ) : filteredFormatki.length > 0 ? (
        <div style={{ 
          maxHeight: 'calc(100vh - 500px)', 
          minHeight: 300,
          overflowY: 'auto',
          paddingRight: 4
        }}>
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
          style={{ padding: '20px 0' }}
        />
      )}
    </div>
  );
};
