/**
 * @fileoverview Element formatki z obsługą DRAG - ULEPSZONA WERSJA
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import {
  Card,
  Space,
  Typography,
  Tag,
  Badge,
  InputNumber,
  Button,
  Tooltip,
  Checkbox
} from 'antd';
import {
  DragOutlined,
  CopyOutlined,
  CodeSandboxOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Formatka } from '../types';
import { formatujKolor } from '../utils';

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
  
  // DOMYŚLNIE WSZYSTKIE SZTUKI
  const [ilosc, setIlosc] = useState(dostepne);
  const [isDragging, setIsDragging] = useState(false);
  const [przeciagajWszystkie, setPrzeciagajWszystkie] = useState(true);

  // Aktualizuj ilość gdy zmieni się dostępność
  useEffect(() => {
    if (przeciagajWszystkie) {
      setIlosc(dostepne);
    }
  }, [dostepne, przeciagajWszystkie]);

  // Setup drag source
  const [{ opacity }, drag, dragPreview] = useDrag({
    type: 'FORMATKA',
    item: () => {
      setIsDragging(true);
      // Użyj aktualnej ilości (wszystkie lub ręcznie ustawiona)
      const iloscDoPrzeciagniecia = przeciagajWszystkie ? dostepne : ilosc;
      return {
        type: 'FORMATKA',
        formatka,
        ilosc: iloscDoPrzeciagniecia
      };
    },
    end: () => {
      setIsDragging(false);
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  });

  const wymiary = `${formatka.dlugosc || formatka.wymiar_x || 0} × ${formatka.szerokosc || formatka.wymiar_y || 0} mm`;
  const grubosc = formatka.grubosc ? `${formatka.grubosc} mm` : '';

  return (
    <div ref={dragPreview} style={{ opacity }}>
      <Card
        className="formatka-item"
        size="small"
        style={{
          cursor: 'move',
          marginBottom: 8,
          border: isDragging ? '2px solid #1890ff' : undefined,
          backgroundColor: isDragging ? '#e6f7ff' : undefined
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Główna linia z drag handle */}
          <Space ref={drag} style={{ cursor: 'grab', width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <DragOutlined style={{ color: '#8c8c8c' }} />
              <div>
                <Space>
                  <CodeSandboxOutlined />
                  <Text strong>{wymiary}</Text>
                  {grubosc && <Text type="secondary">| {grubosc}</Text>}
                </Space>
              </div>
            </Space>
            <Tag color="green" style={{ margin: 0 }}>
              {dostepne} szt.
            </Tag>
          </Space>

          {/* Druga linia - kolor i nazwa */}
          <Space size="small" style={{ paddingLeft: 24 }}>
            <Badge 
              color={formatka.kolor} 
              text={formatujKolor(formatka.kolor)}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatka.nazwa_plyty || 'FORMATKA'}
            </Text>
          </Space>

          {/* Trzecia linia - kontrolki ilości */}
          <div style={{ paddingLeft: 24, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Checkbox
                checked={przeciagajWszystkie}
                onChange={(e) => {
                  setPrzeciagajWszystkie(e.target.checked);
                  if (e.target.checked) {
                    setIlosc(dostepne);
                  }
                }}
              >
                <Text style={{ fontSize: 12 }}>
                  Przeciągnij wszystkie
                </Text>
              </Checkbox>
              
              {!przeciagajWszystkie && (
                <InputNumber
                  min={1}
                  max={dostepne}
                  value={ilosc}
                  onChange={(val) => setIlosc(val || 1)}
                  size="small"
                  style={{ width: 80 }}
                  addonAfter="szt"
                />
              )}
            </Space>
            
            {/* Informacja o ilości do przeciągnięcia */}
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <Tag color={isDragging ? 'blue' : 'default'} icon={<CheckCircleOutlined />}>
                Do przeciągnięcia: {przeciagajWszystkie ? dostepne : ilosc} szt.
              </Tag>
            </div>
          </div>
        </Space>

        {/* Informacje dodatkowe */}
        {formatka.pozycja_id && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Pozycja: {formatka.pozycja_id}
              </Text>
              {formatka.data_produkcji && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  | {new Date(formatka.data_produkcji).toLocaleDateString()}
                </Text>
              )}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};
