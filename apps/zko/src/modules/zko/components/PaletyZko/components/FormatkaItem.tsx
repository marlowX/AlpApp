/**
 * @fileoverview Pojedynczy element formatki - ULTRA KOMPAKTOWY z Drag & Drop
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Space, Tag, InputNumber, Button, Typography } from 'antd';
import { DragOutlined, PlusOutlined } from '@ant-design/icons';
import { Formatka, ItemTypes } from '../types';
import { formatujWage } from '../utils';

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
  const [ilosc, setIlosc] = useState<number>(1);
  const [isManualMode, setIsManualMode] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.FORMATKA,
    item: () => ({
      formatka,
      ilosc: ilosc
    }),
    canDrag: !disableDrag && formatka.sztuki_dostepne > 0 && ilosc > 0,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [formatka, ilosc, disableDrag]);

  const handleAdd = () => {
    if (onSelectFormatka && ilosc > 0) {
      onSelectFormatka(formatka, ilosc);
      setIlosc(1);
      setIsManualMode(false);
    }
  };

  const handleQuickAdd = (qty: number) => {
    if (onSelectFormatka) {
      onSelectFormatka(formatka, qty);
    }
  };

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
      ref={preview}
      className={`formatka-ultra-compact-item ${isDragging ? 'dragging' : ''} ${formatka.sztuki_dostepne === 0 ? 'disabled' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px',
        marginBottom: '4px',
        backgroundColor: isDragging ? '#e6f7ff' : formatka.sztuki_dostepne === 0 ? '#f5f5f5' : '#fff',
        border: '1px solid',
        borderColor: isDragging ? '#40a9ff' : '#e8e8e8',
        borderRadius: '4px',
        cursor: formatka.sztuki_dostepne > 0 ? 'move' : 'not-allowed',
        opacity: isDragging ? 0.5 : formatka.sztuki_dostepne === 0 ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (formatka.sztuki_dostepne > 0) {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && formatka.sztuki_dostepne > 0) {
          e.currentTarget.style.backgroundColor = '#fff';
        }
      }}
    >
      {/* Uchwyt do przeciągania */}
      <div 
        ref={drag}
        style={{ 
          cursor: formatka.sztuki_dostepne > 0 ? 'grab' : 'not-allowed',
          marginRight: '8px',
          color: formatka.sztuki_dostepne === 0 ? '#d9d9d9' : '#8c8c8c'
        }}
      >
        <DragOutlined style={{ fontSize: '12px' }} />
      </div>

      {/* Główna zawartość */}
      <div style={{ flex: 1 }}>
        <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size={4}>
            {/* Wymiary */}
            <Text strong style={{ fontSize: '12px', minWidth: '80px' }}>
              {wymiary}
            </Text>
            
            {/* Kolor */}
            <Tag 
              color="blue" 
              style={{ 
                margin: 0, 
                fontSize: '10px',
                padding: '0 4px',
                height: '18px',
                lineHeight: '16px'
              }}
            >
              {kolor}
            </Tag>

            {/* Grubość */}
            <Text type="secondary" style={{ fontSize: '10px' }}>
              {formatka.grubosc || 18}mm
            </Text>
          </Space>

          {/* Ilości i przyciski */}
          <Space size={2}>
            {/* Dostępna ilość */}
            <Tag 
              color={formatka.sztuki_dostepne > 0 ? 'green' : 'default'}
              style={{ 
                margin: 0, 
                fontSize: '11px',
                minWidth: '45px',
                textAlign: 'center'
              }}
            >
              {formatka.sztuki_dostepne} szt
            </Tag>

            {/* Tryb manualny lub szybkie przyciski */}
            {formatka.sztuki_dostepne > 0 && (
              isManualMode ? (
                <Space size={2}>
                  <InputNumber
                    size="small"
                    min={1}
                    max={formatka.sztuki_dostepne}
                    value={ilosc}
                    onChange={(val) => setIlosc(val || 1)}
                    style={{ width: '50px', fontSize: '11px' }}
                    onPressEnter={handleAdd}
                  />
                  <Button
                    size="small"
                    type="primary"
                    onClick={handleAdd}
                    style={{ fontSize: '11px', padding: '0 6px' }}
                  >
                    OK
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setIsManualMode(false);
                      setIlosc(1);
                    }}
                    style={{ fontSize: '11px', padding: '0 6px' }}
                  >
                    ✕
                  </Button>
                </Space>
              ) : (
                <Space size={1}>
                  {/* Szybkie przyciski dla typowych ilości */}
                  {[1, 5, 10].map(qty => (
                    qty <= formatka.sztuki_dostepne && (
                      <Button
                        key={qty}
                        size="small"
                        onClick={() => handleQuickAdd(qty)}
                        style={{ 
                          fontSize: '10px', 
                          padding: '0 4px',
                          height: '20px',
                          minWidth: '24px'
                        }}
                      >
                        +{qty}
                      </Button>
                    )
                  ))}
                  
                  {/* Przycisk do trybu manualnego */}
                  <Button
                    size="small"
                    icon={<PlusOutlined style={{ fontSize: '10px' }} />}
                    onClick={() => setIsManualMode(true)}
                    style={{ 
                      fontSize: '10px', 
                      padding: '0 4px',
                      height: '20px'
                    }}
                    title="Podaj własną ilość"
                  />
                </Space>
              )
            )}
          </Space>
        </Space>

        {/* Dodatkowe informacje - druga linia */}
        {formatka.nazwa_plyty && (
          <div style={{ marginTop: '2px' }}>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Płyta: {formatka.nazwa_plyty}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};