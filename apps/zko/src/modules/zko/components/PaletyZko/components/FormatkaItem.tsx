/**
 * @fileoverview Element formatki z obsługą DRAG - WERSJA KOMPAKTOWA
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Space, Typography, Tag, Checkbox, Tooltip } from 'antd';
import { DragOutlined, CodeSandboxOutlined } from '@ant-design/icons';
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

  const wymiary = `${formatka.dlugosc || formatka.wymiar_x || 0} × ${formatka.szerokosc || formatka.wymiar_y || 0} mm`;
  const grubosc = formatka.grubosc ? `${formatka.grubosc} mm` : '18 mm';
  const kolor = formatka.kolor || formatka.kolor_plyty || 'BRAK';

  return (
    <div 
      ref={drag}
      className="formatka-item-compact"
      style={{
        opacity,
        cursor: 'grab',
        padding: '8px 12px',
        marginBottom: '4px',
        background: isDragging ? '#e6f7ff' : '#ffffff',
        border: isDragging ? '2px solid #1890ff' : '1px solid #f0f0f0',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f9f9f9';
        e.currentTarget.style.borderColor = '#d9d9d9';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#f0f0f0';
          e.currentTarget.style.transform = 'translateX(0)';
        }
      }}
    >
      {/* Ikona przeciągania - zawsze widoczna po lewej */}
      <div style={{ 
        position: 'absolute',
        left: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.3,
        transition: 'opacity 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.3';
      }}>
        <DragOutlined style={{ fontSize: '16px', color: '#8c8c8c' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Główne informacje */}
        <div style={{ flex: 1 }}>
          <Space size="small">
            <CodeSandboxOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
            <Text strong style={{ fontSize: '13px' }}>
              {wymiary}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              | {grubosc}
            </Text>
          </Space>
          
          {/* Kolor i nazwa - druga linia, mniejsza */}
          <div style={{ marginTop: '2px' }}>
            <Space size="small">
              <Tag 
                color={kolor.toLowerCase()} 
                style={{ 
                  fontSize: '10px', 
                  padding: '0 4px',
                  margin: 0,
                  lineHeight: '16px'
                }}
              >
                {kolor}
              </Tag>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {formatka.nazwa_plyty || 'FORMATKA'}
              </Text>
              {formatka.pozycja_id && (
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  Poz: {formatka.pozycja_id}
                </Text>
              )}
            </Space>
          </div>
        </div>

        {/* Ilość dostępna */}
        <Tag 
          color="green" 
          style={{ 
            margin: 0,
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {dostepne} szt.
        </Tag>
      </div>

      {/* Checkbox i info o przeciąganiu - kompaktowa wersja */}
      <div style={{ 
        marginTop: '6px', 
        paddingTop: '6px', 
        borderTop: '1px dashed #f0f0f0',
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
          style={{ fontSize: '11px' }}
        >
          <Text style={{ fontSize: '11px', color: '#595959' }}>
            Przeciągnij wszystkie
          </Text>
        </Checkbox>
        
        <Tooltip title={`Zostanie przeciągnięte ${przeciagajWszystkie ? dostepne : ilosc} szt.`}>
          <Tag 
            color={isDragging ? 'blue' : 'default'}
            style={{ 
              margin: 0,
              fontSize: '11px',
              padding: '0 6px',
              cursor: 'help'
            }}
          >
            Do przeciągnięcia: {przeciagajWszystkie ? dostepne : ilosc} szt.
          </Tag>
        </Tooltip>
      </div>
    </div>
  );
};
