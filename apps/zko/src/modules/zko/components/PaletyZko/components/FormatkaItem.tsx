/**
 * @fileoverview Element formatki z obsługą DRAG - wersja kompaktowa
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Typography, Tag, Checkbox, Space } from 'antd';
import { DragOutlined } from '@ant-design/icons';
import { Formatka } from '../types';

const { Text } = Typography;

interface FormatkaItemProps {
  formatka: Formatka;
  onSelectFormatka?: (formatka: Formatka, ilosc: number) => void;
}

export const FormatkaItem: React.FC<FormatkaItemProps> = ({
  formatka,
  onSelectFormatka
}) => {
  const dostepne = formatka.sztuki_dostepne || formatka.ilosc_dostepna || 0;
  const [przeciagajWszystkie, setPrzeciagajWszystkie] = useState(true);

  // Setup drag source
  const [{ opacity, isDragging }, drag] = useDrag({
    type: 'FORMATKA',
    item: () => ({
      type: 'FORMATKA',
      formatka,
      ilosc: przeciagajWszystkie ? dostepne : dostepne
    }),
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1,
      isDragging: monitor.isDragging()
    })
  });

  // Formatowanie nazwy
  const dlugosc = Math.round(formatka.dlugosc || formatka.wymiar_x || 0);
  const szerokosc = Math.round(formatka.szerokosc || formatka.wymiar_y || 0);
  const kolorRaw = formatka.kolor || formatka.kolor_plyty || 'BRAK';
  const kolor = kolorRaw.split(' ')[0];
  const nazwa = `${dlugosc}×${szerokosc}-${kolor}`;
  const grubosc = formatka.grubosc ? `${formatka.grubosc}mm` : '18mm';

  return (
    <div 
      ref={drag}
      className="formatka-item-compact"
      style={{
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '6px 10px',
        marginBottom: '2px',
        background: isDragging ? '#e6f7ff' : '#ffffff',
        border: isDragging ? '1px solid #1890ff' : '1px solid #f0f0f0',
        borderRadius: '3px',
        transition: 'all 0.1s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minHeight: '32px'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = '#fafafa';
          e.currentTarget.style.borderColor = '#d9d9d9';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#f0f0f0';
        }
      }}
    >
      {/* Ikona przeciągania */}
      <DragOutlined 
        style={{ 
          fontSize: '12px',
          color: isDragging ? '#1890ff' : '#bfbfbf',
          flexShrink: 0
        }}
      />

      {/* Główne informacje - wszystko w jednej linii */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        minWidth: 0
      }}>
        {/* Nazwa formatki */}
        <Text strong style={{ 
          fontSize: '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {nazwa}
        </Text>
        
        {/* Grubość */}
        <Text type="secondary" style={{ 
          fontSize: '11px',
          flexShrink: 0
        }}>
          {grubosc}
        </Text>
        
        {/* Pozycja */}
        <Text type="secondary" style={{ 
          fontSize: '10px',
          marginLeft: 'auto'
        }}>
          Poz: {formatka.pozycja_id || 99}
        </Text>
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={przeciagajWszystkie}
        onChange={(e) => setPrzeciagajWszystkie(e.target.checked)}
        style={{ marginLeft: '4px' }}
      />

      {/* Ilość */}
      <Tag 
        color="green" 
        style={{ 
          margin: 0,
          fontSize: '11px',
          padding: '0 6px',
          height: '18px',
          lineHeight: '18px',
          minWidth: '45px',
          textAlign: 'center'
        }}
      >
        {dostepne} szt
      </Tag>
    </div>
  );
};