/**
 * @fileoverview Pojedynczy element formatki - tylko Drag & Drop wszystkich sztuk
 * @module PaletyZko/components/FormatkaItem
 */

import React from 'react';
import { useDrag } from 'react-dnd';
import { Space, Tag, Typography } from 'antd';
import { DragOutlined } from '@ant-design/icons';
import { Formatka, ItemTypes } from '../types';

const { Text } = Typography;

interface FormatkaItemProps {
  formatka: Formatka;
  onSelectFormatka?: (formatka: Formatka, ilosc: number) => void;
  disableDrag?: boolean;
}

export const FormatkaItem: React.FC<FormatkaItemProps> = ({ 
  formatka, 
  onSelectFormatka,
  disableDrag = false 
}) => {
  // ZAWSZE PRZECIĄGAMY WSZYSTKIE DOSTĘPNE FORMATKI
  const iloscDoPrzeciagniecia = formatka.sztuki_dostepne;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FORMATKA,
    item: () => ({
      formatka,
      ilosc: iloscDoPrzeciagniecia // Zawsze wszystkie dostępne
    }),
    canDrag: !disableDrag && formatka.sztuki_dostepne > 0,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [formatka, iloscDoPrzeciagniecia, disableDrag]);

  // Wyciągnij kolor z nazwy formatki lub użyj pola kolor
  const getKolorFromNazwa = () => {
    if (formatka.kolor) return formatka.kolor;
    if (formatka.nazwa_formatki) {
      const parts = formatka.nazwa_formatki.split(' - ');
      if (parts.length > 1) {
        return parts[1];
      }
    }
    return 'NIEZNANY';
  };

  const kolor = getKolorFromNazwa();
  
  // Wyciągnij wymiary
  const wymiary = formatka.nazwa_formatki 
    ? formatka.nazwa_formatki.split(' - ')[0] 
    : `${formatka.dlugosc}×${formatka.szerokosc}`;

  return (
    <div
      ref={drag}
      className={`formatka-ultra-compact-item ${isDragging ? 'dragging' : ''} ${formatka.sztuki_dostepne === 0 ? 'disabled' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        marginBottom: '4px',
        backgroundColor: isDragging ? '#e6f7ff' : formatka.sztuki_dostepne === 0 ? '#f5f5f5' : '#fff',
        border: '1px solid',
        borderColor: isDragging ? '#40a9ff' : '#e8e8e8',
        borderRadius: '4px',
        cursor: formatka.sztuki_dostepne > 0 && !disableDrag ? 'grab' : 'not-allowed',
        opacity: isDragging ? 0.8 : formatka.sztuki_dostepne === 0 ? 0.6 : 1,
        transition: 'all 0.2s',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        if (formatka.sztuki_dostepne > 0 && !disableDrag && !isDragging) {
          e.currentTarget.style.backgroundColor = '#fafafa';
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && formatka.sztuki_dostepne > 0) {
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.borderColor = '#e8e8e8';
          e.currentTarget.style.transform = 'translateX(0)';
        }
      }}
      title={`Przeciągnij wszystkie ${iloscDoPrzeciagniecia} sztuk formatki ${wymiary} - ${kolor}`}
    >
      {/* Ikona przeciągania */}
      <div 
        style={{ 
          marginRight: '8px',
          color: isDragging ? '#1890ff' : formatka.sztuki_dostepne === 0 ? '#d9d9d9' : '#8c8c8c',
          transition: 'color 0.2s'
        }}
      >
        <DragOutlined style={{ fontSize: '14px' }} />
      </div>

      {/* Główna zawartość */}
      <div style={{ flex: 1 }}>
        <Space size={4} style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={6} style={{ flex: 1, minWidth: 0 }}>
            {/* Wymiary */}
            <Text strong style={{ 
              fontSize: '13px', 
              minWidth: '90px',
              color: isDragging ? '#1890ff' : '#000',
              whiteSpace: 'nowrap'
            }}>
              {wymiary}
            </Text>
            
            {/* Kolor */}
            <Tag 
              color={isDragging ? "blue" : "default"}
              style={{ 
                margin: 0, 
                fontSize: '11px',
                padding: '0 6px',
                height: '20px',
                lineHeight: '18px',
                whiteSpace: 'nowrap'
              }}
            >
              {kolor}
            </Tag>

            {/* Grubość */}
            <Text type="secondary" style={{ 
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              {formatka.grubosc || 18}mm
            </Text>
          </Space>

          {/* Dostępna ilość - wyróżniona */}
          <Tag 
            color={formatka.sztuki_dostepne > 0 ? 'green' : 'default'}
            style={{ 
              margin: 0, 
              fontSize: '13px',
              minWidth: '60px',
              textAlign: 'center',
              fontWeight: 'bold',
              padding: '2px 8px'
            }}
          >
            {formatka.sztuki_dostepne} szt
          </Tag>
        </Space>

        {/* Dodatkowe informacje - druga linia */}
        {formatka.nazwa_plyty && (
          <div style={{ marginTop: '4px' }}>
            <Text type="secondary" style={{ 
              fontSize: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block'
            }}>
              Płyta: {formatka.nazwa_plyty}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};