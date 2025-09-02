/**
 * @fileoverview Karta palety z drag & drop - z przyciskiem zamykania i drukowania
 * @module PaletyZko/components/PaletaCardDND
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, Tag, Space, Typography, Progress, Button, Popconfirm, Tooltip, Dropdown, Menu, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  CloseOutlined,
  PrinterOutlined,
  MoreOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Paleta } from '../types';
import { formatujWage, formatujWysokosc, formatujPrzeznaczenie, getIkonaPrzeznaczenia } from '../utils';

const { Text, Title } = Typography;

interface PaletaCardDNDProps {
  paleta: Paleta;
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (paletaId: number) => void;
  onClose?: (paletaId: number) => void;
  onPrint?: (paletaId: number) => void;
  onShowDetails?: (paletaId: number) => void;
  onDropFormatka?: (formatka: any, ilosc: number, paletaId: number) => void;
  deleting?: boolean;
  closing?: boolean;
}

export const PaletaCardDND: React.FC<PaletaCardDNDProps> = ({
  paleta,
  onEdit,
  onDelete,
  onClose,
  onPrint,
  onShowDetails,
  onDropFormatka,
  deleting,
  closing
}) => {
  // Setup drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'FORMATKA',
    drop: (item: any) => {
      if (onDropFormatka) {
        onDropFormatka(item.formatka, item.ilosc, paleta.id);
      }
    },
    canDrop: () => paleta.status !== 'zamknieta' && paleta.status !== 'gotowa_do_transportu',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = isOver && canDrop;
  const isZamknieta = paleta.status === 'zamknieta' || paleta.status === 'gotowa_do_transportu';
  
  // Obliczenia - poprawione pobieranie wartości
  const sztuk = paleta.ilosc_formatek || paleta.sztuk_total || 0;
  const waga = paleta.waga_kg || paleta.waga_total || 0;
  const wysokosc = paleta.wysokosc_stosu || paleta.wysokosc_mm || 0;
  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  
  // Oblicz procenty wykorzystania
  const procentWagi = Math.min(Math.round((waga / maxWaga) * 100), 100);
  const procentWysokosci = Math.min(Math.round((wysokosc / maxWysokosc) * 100), 100);

  // Wyciągamy kolory
  const kolorRaw = paleta.kolory_na_palecie || paleta.kolor || '';
  const kolory = kolorRaw.split(',').map(k => k.trim()).filter(Boolean);

  // Menu akcji
  const menuItems: MenuProps['items'] = [
    {
      key: 'details',
      icon: <EyeOutlined />,
      label: 'Szczegóły',
      onClick: () => onShowDetails?.(paleta.id)
    },
    ...(sztuk > 0 && !isZamknieta ? [{
      key: 'close',
      icon: <CheckCircleOutlined />,
      label: 'Zamknij paletę',
      onClick: () => onClose?.(paleta.id)
    }] : []),
    ...(isZamknieta ? [{
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Drukuj etykietę',
      onClick: () => onPrint?.(paleta.id)
    }] : []),
    ...(sztuk === 0 && !isZamknieta ? [{
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Dodaj formatki',
      onClick: () => onEdit?.(paleta)
    }] : []),
    {
      type: 'divider' as const
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Usuń paletę',
      danger: true,
      onClick: () => {
        // Obsługiwane przez osobny Popconfirm
      }
    }
  ];

  return (
    <div ref={drop}>
      <Card
        className={`paleta-card ${isActive ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''} ${isZamknieta ? 'locked' : ''}`}
        size="small"
        hoverable
        onClick={() => onShowDetails?.(paleta.id)}
        style={{
          border: isActive ? '2px solid #52c41a' : isZamknieta ? '1px solid #faad14' : undefined,
          backgroundColor: isZamknieta ? '#fffbe6' : undefined,
          position: 'relative',
          cursor: 'pointer'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space size={4}>
              {isZamknieta ? (
                <LockOutlined style={{ fontSize: '14px', color: '#faad14' }} />
              ) : (
                <UnlockOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
              )}
              <Text strong style={{ fontSize: '13px' }}>{paleta.numer_palety}</Text>
            </Space>
            <Space size={4}>
              {/* Przycisk zamknięcia palety - tylko dla niezamkniętych z formatkami */}
              {sztuk > 0 && !isZamknieta && (
                <Tooltip title="Zamknij paletę">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    loading={closing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose?.(paleta.id);
                    }}
                    style={{ color: '#52c41a' }}
                  />
                </Tooltip>
              )}
              
              {/* Przycisk drukowania - tylko dla zamkniętych */}
              {isZamknieta && (
                <Tooltip title="Drukuj etykietę">
                  <Button
                    type="text"
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrint?.(paleta.id);
                    }}
                    style={{ color: '#1890ff' }}
                  />
                </Tooltip>
              )}

              {/* Menu z dodatkowymi opcjami */}
              <Dropdown
                menu={{ 
                  items: menuItems.filter(item => item.key !== 'delete'),
                  onClick: (e) => e.domEvent.stopPropagation()
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>

              {/* Przycisk usuwania */}
              <Popconfirm
                title="Czy na pewno usunąć paletę?"
                description={sztuk > 0 ? `Paleta zawiera ${sztuk} formatek` : undefined}
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDelete?.(paleta.id);
                }}
                okText="Tak"
                cancelText="Nie"
                placement="topRight"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  loading={deleting}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: -8 }}
                />
              </Popconfirm>
            </Space>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* Status palety */}
          {isZamknieta && (
            <div style={{ 
              background: 'linear-gradient(to right, #faad14, #ffc53d)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              PALETA ZAMKNIĘTA
            </div>
          )}

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
              <Text strong>{sztuk} szt.</Text>
              {sztuk === 0 && !isZamknieta && (
                <Tag color="default" style={{ fontSize: '10px' }}>Pusta</Tag>
              )}
            </div>
          </div>

          {/* Kolory */}
          {kolory.length > 0 && kolory[0] !== '-' && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>Kolory:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {kolory.slice(0, 3).map((kolor, idx) => (
                  <Tag key={idx} style={{ fontSize: '10px', margin: 0 }}>
                    {kolor}
                  </Tag>
                ))}
                {kolory.length > 3 && (
                  <Tag style={{ fontSize: '10px', margin: 0 }}>+{kolory.length - 3}</Tag>
                )}
              </div>
            </div>
          )}

          {/* Waga */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Waga: {formatujWage(waga)} / {maxWaga} kg
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Progress 
                percent={procentWagi} 
                showInfo={false}
                size="small"
                strokeColor={procentWagi > 90 ? '#ff4d4f' : procentWagi > 70 ? '#faad14' : '#52c41a'}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <Text type={procentWagi > 90 ? 'danger' : 'secondary'} style={{ fontSize: '10px', minWidth: '35px', textAlign: 'right' }}>
                {procentWagi}%
              </Text>
            </div>
          </div>

          {/* Wysokość */}
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Wysokość: {formatujWysokosc(wysokosc)} / {maxWysokosc} mm
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Progress 
                percent={procentWysokosci} 
                showInfo={false}
                size="small"
                strokeColor={procentWysokosci > 90 ? '#ff4d4f' : procentWysokosci > 70 ? '#faad14' : '#52c41a'}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <Text type={procentWysokosci > 90 ? 'danger' : 'secondary'} style={{ fontSize: '10px', minWidth: '35px', textAlign: 'right' }}>
                {procentWysokosci}%
              </Text>
            </div>
          </div>

          {/* Przycisk dodawania formatek dla pustych palet */}
          {sztuk === 0 && !isZamknieta && (
            <Button 
              type="dashed" 
              block 
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(paleta);
              }}
              style={{ marginTop: 8 }}
            >
              Dodaj formatki
            </Button>
          )}

          {/* Info o drag & drop */}
          {!isZamknieta && sztuk > 0 && canDrop && (
            <div style={{ 
              textAlign: 'center', 
              fontSize: '10px', 
              color: '#999',
              marginTop: '4px',
              padding: '4px',
              border: '1px dashed #d9d9d9',
              borderRadius: '4px'
            }}>
              Przeciągnij formatki tutaj
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};
