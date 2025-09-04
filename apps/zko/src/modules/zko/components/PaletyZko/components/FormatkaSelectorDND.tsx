/**
 * @fileoverview Selektor formatek z DRAG & DROP - wersja ULTRA KOMPAKTOWA
 * @module PaletyZko/components/FormatkaSelectorDND
 */

import React, { useState } from 'react';
import { Input, Select, Space, Tag, Empty, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Formatka } from '../types';
import { FormatkaItem } from './FormatkaItem';
import { formatujWage } from '../utils';

const { Text } = Typography;
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
  const [sortBy, setSortBy] = useState<'rozmiar' | 'ilosc'>('rozmiar');

  // Konwersja do nowego formatu
  const formatkiConverted: Formatka[] = formatki.map(f => ({
    ...f,
    dlugosc: f.wymiar_x || f.dlugosc || 0,
    szerokosc: f.wymiar_y || f.szerokosc || 0,
    sztuki_dostepne: f.ilosc_dostepna || f.sztuki_dostepne || 0,
    nazwa_plyty: f.numer_formatki || f.nazwa_plyty || 'FORMATKA',
    kolor_plyty: f.kolor
  }));

  // Filtrowanie i sortowanie
  const filteredFormatki = formatkiConverted
    .filter(f => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        `${f.dlugosc} × ${f.szerokosc}`.includes(search) ||
        (f.nazwa_formatki && f.nazwa_formatki.toLowerCase().includes(search)) ||
        (f.kolor && f.kolor.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'rozmiar') {
        return (b.dlugosc * b.szerokosc) - (a.dlugosc * a.szerokosc);
      }
      return b.sztuki_dostepne - a.sztuki_dostepne;
    });

  // Statystyki - kompaktowa wersja
  const totalSztuk = formatkiConverted.reduce((sum, f) => sum + f.sztuki_dostepne, 0);

  return (
    <div className="formatka-selector-ultra-compact">
      {/* Mini statystyki */}
      <div style={{ 
        marginBottom: '8px', 
        padding: '4px 8px',
        background: '#f5f5f5',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <Tag color="green" style={{ margin: 0, fontSize: '11px' }}>
          {totalSztuk} szt.
        </Tag>
        <Tag style={{ margin: 0, fontSize: '11px' }}>
          {filteredFormatki.length} typów
        </Tag>
      </div>

      {/* Filtry - jeden wiersz, kompaktowe */}
      <div style={{ marginBottom: '8px' }}>
        <Space style={{ width: '100%' }}>
          <Input
            placeholder="Szukaj..."
            prefix={<SearchOutlined style={{ fontSize: '12px' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            style={{ flex: 1, fontSize: '12px' }}
          />
          
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 60, fontSize: '11px' }}
            size="small"
          >
            <Option value="rozmiar">Rozm.</Option>
            <Option value="ilosc">Ilość</Option>
          </Select>
        </Space>
      </div>

      {/* Lista formatek */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#8c8c8c',
          fontSize: '12px'
        }}>
          Ładowanie...
        </div>
      ) : filteredFormatki.length > 0 ? (
        <div style={{ 
          maxHeight: 'calc(100vh - 400px)', 
          minHeight: '200px',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '4px'
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
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {searchText ? "Brak wyników" : "Brak formatek"}
            </Text>
          }
          style={{ padding: '20px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};