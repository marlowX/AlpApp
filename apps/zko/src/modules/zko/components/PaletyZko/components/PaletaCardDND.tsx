/**
 * @fileoverview Karta palety z drag & drop - z przyciskiem usuwania
 * @module PaletyZko/components/PaletaCardDND
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, Tag, Space, Typography, Progress, Button, Popconfirm, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  EyeOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Paleta } from '../types';
import { formatujWage, formatujWysokosc, formatujPrzeznaczenie, getIkonaPrzeznaczenia } from '../utils';

const { Text, Title } = Typography;

interface PaletaCardDNDProps {
  paleta: Paleta;
  onEdit: (paleta: Paleta) => void;
  onDelete: (paletaId: number) => void;
  onClose: (paletaId: number) => void;
  onShowDetails: (paletaId: number) => void;
  onDropFormatka: (formatka: any, ilosc: number, paletaId: number) => void;
  deleting?: number | null;
}

export const PaletaCardDND: React.FC<PaletaCardDNDProps> = ({
  paleta,
  onEdit,
  onDelete,
  onClose,
  onShowDetails,
  onDropFormatka,
  deleting
}) => {
  // Setup drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'FORMATKA',
    drop: (item: any) => {
      onDropFormatka(item.formatka, item.ilosc, paleta.id);
    },
    canDrop: () => paleta.status !== 'zamknieta',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = isOver && canDrop;
  const sztuk = paleta.ilosc_formatek || paleta.sztuk_total || 0;
  const waga = paleta.waga_kg || 0;
  const wysokosc = paleta.wysokosc_stosu || 0;
  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  const procentWagi = Math.round((waga / maxWaga) * 100);
  const procentWysokosci = Math.round((wysokosc / maxWysokosc) * 100);

  // Wyciągamy kolor bez liczby arkuszy
  const kolorRaw = paleta.kolory_na_palecie || paleta.kolor || '';
  const kolor = kolorRaw.split(' ')[0] || '-';

  return (
    <div ref={drop}>
      <Card
        className={`paleta-card ${isActive ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''} ${paleta.status === 'zamknieta' ? 'locked' : ''}`}
        size="small"
        hoverable
        onClick={() => onShowDetails(paleta.id)}
        style={{
          border: isActive ? '2px solid #52c41a' : undefined,
          position: 'relative'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <LockOutlined style={{ fontSize: '14px' }} />
              <Text strong style={{ fontSize: '13px' }}>{paleta.numer_palety}</Text>
            </Space>
            {/* Przycisk usuwania na kafelku */}
            <Popconfirm
              title="Czy na pewno usunąć paletę?"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(paleta.id);
              }}
              okText="Tak"
              cancelText="Nie"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<CloseOutlined />}
                loading={deleting === paleta.id}
                onClick={(e) => e.stopPropagation()}
                style={{ marginRight: -8 }}
              />
            </Popconfirm>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* Przeznaczenie */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>Przeznaczenie:</Text>
            <div>
              <Tag color="blue" style={{ margin: 0 }}>
                {getIkonaPrzeznaczenia(paleta.przeznaczenie || 'MAGAZYN')} {formatujPrzeznaczenie(paleta.przeznaczenie || 'MAGAZYN')}
              </Tag>
            </div>
          </div>

          {/* Formatki */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>Formatki:</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>{sztuk} formatek</Text>
              {paleta.status === 'zamknieta' && (
                <Tag color="orange" style={{ fontSize: '10px' }}>Zamknięta</Tag>
              )}
            </div>
          </div>

          {/* Kolor */}
          {kolor && kolor !== '-' && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>Kolory:</Text>
              <Text>{kolor}</Text>
            </div>
          )}

          {/* Waga */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>Waga:</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{formatujWage(waga)}</Text>
              <Text type="secondary" style={{ fontSize: '10px' }}>{procentWagi}%</Text>
            </div>
            <Progress 
              percent={procentWagi} 
              showInfo={false}
              size="small"
              strokeColor={procentWagi > 90 ? '#ff4d4f' : '#1890ff'}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Wysokość */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>Wysokość:</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{formatujWysokosc(wysokosc)}</Text>
              <Text type="secondary" style={{ fontSize: '10px' }}>{procentWysokosci}%</Text>
            </div>
            <Progress 
              percent={procentWysokosci} 
              showInfo={false}
              size="small"
              strokeColor={procentWysokosci > 90 ? '#ff4d4f' : '#52c41a'}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Przycisk dodawania formatek dla pustych palet */}
          {sztuk === 0 && paleta.status !== 'zamknieta' && (
            <Button 
              type="dashed" 
              block 
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(paleta);
              }}
              style={{ marginTop: 8 }}
            >
              Dodaj formatki
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};
