/**
 * @fileoverview Element formatki z obsługą DRAG - WERSJA FINALNA
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Space, Typography, Tag, Checkbox, Tooltip } from 'antd';
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
  const [ilosc, setIlosc] = useState(dostepne);
  const [przeciagajWszystkie, setPrzeciagajWszystkie] = useState(true);

  useEffect(() => {
    if (przeciagajWszystkie) {
      setIlosc(dostepne);
    }
  }, [dostepne, przeciagajWszystkie]);

  // Setup drag source - cały element jest przeciągalny
  const [{ opacity, isDragging }, drag] = useDrag({
    type: 'FORMATKA',
    item: () => {
      const iloscDoPrzeciagniecia = przeciagajWszystkie ? dostepne : ilosc;
      return {
        type: 'FORMATKA',
        formatka,
        ilosc: iloscDoPrzeciagniecia
      };
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1,
      isDragging: monitor.isDragging()
    })
  });

  // Formatowanie nazwy: 562x310-CZARNY
  const dlugosc = Math.round(formatka.dlugosc || formatka.wymiar_x || 0);
  const szerokosc = Math.round(formatka.szerokosc || formatka.wymiar_y || 0);
  const kolor = formatka.kolor || formatka.kolor_plyty || 'BRAK';
  const nazwa = `${dlugosc}×${szerokosc}-${kolor}`;
  const grubosc = formatka.grubosc ? `${formatka.grubosc}mm` : '18mm';

  return (
    <div 
      ref={drag}
      className="formatka-item-final"
      style={{
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '10px 12px 10px 36px',
        marginBottom: '3px',
        background: isDragging ? '#e6f7ff' : '#ffffff',
        border: isDragging ? '2px solid #1890ff' : '1px solid #e8e8e8',
        borderRadius: '4px',
        transition: 'all 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = '#fafafa';
          e.currentTarget.style.borderColor = '#40a9ff';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#e8e8e8';
        }
      }}
    >
      {/* Ikona przeciągania - lepiej widoczna */}
      <DragOutlined 
        style={{ 
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '14px',
          color: isDragging ? '#1890ff' : '#bfbfbf'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        {/* Główne informacje */}
        <div style={{ flex: 1 }}>
          {/* Nazwa formatki */}
          <div style={{ marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>
              {nazwa}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
              {grubosc}
            </Text>
          </div>
          
          {/* Dodatkowe info */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              FORMATKA · Poz: {formatka.pozycja_id || 79}
            </Text>
          </div>
        </div>

        {/* Ilość dostępna */}
        <Tag 
          color="green" 
          style={{ 
            margin: 0,
            padding: '2px 8px',
            fontSize: '13px',
            fontWeight: 600,
            minWidth: '50px',
            textAlign: 'center'
          }}
        >
          {dostepne} szt.
        </Tag>
      </div>

      {/* Checkbox i info o przeciąganiu */}
      <div style={{ 
        marginTop: '8px', 
        paddingTop: '8px', 
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Checkbox
          checked={przeciagajWszystkie}
          onChange={(e) => {
            setPrzeciagajWszystkie(e.target.checked);
            if (e.target.checked) {
              setIlosc(dostepne);
            }
          }}
          style={{ fontSize: '12px' }}
        >
          <Text style={{ fontSize: '12px' }}>
            Przeciągnij wszystkie
          </Text>
        </Checkbox>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Do przeciągnięcia: {przeciagajWszystkie ? dostepne : ilosc} szt.
        </Text>
      </div>
    </div>
  );
};
