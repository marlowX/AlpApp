/**
 * @fileoverview Element formatki z obsługą DRAG
 * @module PaletyZko/components/FormatkaItem
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  Card,
  Space,
  Typography,
  Tag,
  Badge,
  InputNumber,
  Button,
  Tooltip
} from 'antd';
import {
  DragOutlined,
  CopyOutlined,
  CodeSandboxOutlined
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
  const [ilosc, setIlosc] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Setup drag source
  const [{ opacity }, drag, dragPreview] = useDrag({
    type: 'FORMATKA',
    item: () => {
      setIsDragging(true);
      return {
        type: 'FORMATKA',
        formatka,
        ilosc
      };
    },
    end: () => {
      setIsDragging(false);
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  });

  const dostepne = formatka.sztuki_dostepne || 0;
  const wymiary = `${formatka.dlugosc} × ${formatka.szerokosc} mm`;
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
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space ref={drag} style={{ cursor: 'grab' }}>
            <DragOutlined style={{ color: '#8c8c8c' }} />
            <div>
              <div style={{ marginBottom: 4 }}>
                <Space>
                  <CodeSandboxOutlined />
                  <Text strong>{wymiary}</Text>
                  {grubosc && <Text type="secondary">| {grubosc}</Text>}
                </Space>
              </div>
              
              <Space size="small">
                <Badge 
                  color={formatka.kolor} 
                  text={formatujKolor(formatka.kolor)}
                />
                <Text type="secondary">{formatka.nazwa_plyty}</Text>
                <Tag color="green">{dostepne} szt. dostępne</Tag>
              </Space>
            </div>
          </Space>

          <Space>
            <Tooltip title="Ilość do przeniesienia">
              <InputNumber
                min={1}
                max={dostepne}
                value={ilosc}
                onChange={(val) => setIlosc(val || 1)}
                size="small"
                style={{ width: 80 }}
                addonAfter="szt"
              />
            </Tooltip>
            <Tooltip title="Dodaj ręcznie">
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={() => onSelectFormatka?.(formatka, ilosc)}
              />
            </Tooltip>
          </Space>
        </Space>

        {/* Informacje dodatkowe */}
        {formatka.pozycja_id && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pozycja: {formatka.pozycja_id}
              </Text>
              {formatka.data_produkcji && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  | Wyprodukowano: {new Date(formatka.data_produkcji).toLocaleDateString()}
                </Text>
              )}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};
