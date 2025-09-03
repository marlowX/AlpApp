/**
 * @fileoverview Karta palety z drag & drop - minimalistyczny design
 * @module PaletyZko/components/PaletaCardDND
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, Tag, Space, Typography, Progress, Button, Popconfirm, Tooltip, Badge } from 'antd';
import {
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  DragOutlined
} from '@ant-design/icons';
import { Paleta } from '../types';
import { colors, dimensions, componentStyles, styleHelpers } from '../styles/theme';

const { Text } = Typography;

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
  
  // Obliczenia
  const sztuk = paleta.ilosc_formatek || 0;
  const waga = paleta.waga_kg || 0;
  const wysokosc = paleta.wysokosc_stosu || 0;
  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  
  const procentWagi = Math.min(Math.round((waga / maxWaga) * 100), 100);
  const procentWysokosci = Math.min(Math.round((wysokosc / maxWysokosc) * 100), 100);
  const procentWypelnienia = Math.round((procentWagi + procentWysokosci) / 2);

  const kolorRaw = paleta.kolory_na_palecie || '';
  const kolory = kolorRaw.split(',').map(k => k.trim()).filter(k => k && k !== '-');

  // Określ kolor statusu
  const getStatusStyle = () => {
    if (isZamknieta) return { 
      borderColor: colors.warning, 
      backgroundColor: '#fffbe6',
      borderWidth: 2
    };
    if (sztuk === 0) return { 
      borderStyle: 'dashed' as const,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgSecondary
    };
    if (isActive) return {
      borderColor: colors.success,
      backgroundColor: colors.bgHover,
      borderWidth: 2,
      boxShadow: `0 0 0 3px ${colors.success}20`
    };
    return {
      borderColor: colors.borderBase
    };
  };

  return (
    <div ref={drop} style={{ height: '100%' }}>
      <Card
        className={`paleta-card ${isActive ? 'drag-over' : ''} ${isZamknieta ? 'status-zamknieta' : sztuk === 0 ? 'empty' : 'status-otwarta'}`}
        size="small"
        hoverable
        onClick={() => onShowDetails?.(paleta.id)}
        style={{
          ...componentStyles.paleta.base,
          ...getStatusStyle(),
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease'
        }}
        styles={{
          body: {
            padding: dimensions.spacingSm,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Nagłówek z numerem palety i statusem */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: dimensions.spacingSm,
          paddingBottom: dimensions.spacingXs,
          borderBottom: `1px solid ${colors.borderLight}`
        }}>
          <Space size={dimensions.spacingXs}>
            {isZamknieta ? (
              <LockOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.warning }} />
            ) : sztuk === 0 ? (
              <InboxOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.textSecondary }} />
            ) : (
              <UnlockOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.success }} />
            )}
            <Text strong style={{ fontSize: dimensions.fontSizeBase }}>
              {paleta.numer_palety}
            </Text>
          </Space>
          
          <Space size={2}>
            {/* Akcje szybkie */}
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
                  style={{ 
                    width: dimensions.buttonHeightSmall, 
                    height: dimensions.buttonHeightSmall,
                    padding: 0,
                    color: colors.success
                  }}
                />
              </Tooltip>
            )}
            
            {isZamknieta && (
              <Tooltip title="Drukuj">
                <Button
                  type="text"
                  size="small"
                  icon={<PrinterOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrint?.(paleta.id);
                  }}
                  style={{ 
                    width: dimensions.buttonHeightSmall, 
                    height: dimensions.buttonHeightSmall,
                    padding: 0,
                    color: colors.info
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Szczegóły">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails?.(paleta.id);
                }}
                style={{ 
                  width: dimensions.buttonHeightSmall, 
                  height: dimensions.buttonHeightSmall,
                  padding: 0
                }}
              />
            </Tooltip>

            <Popconfirm
              title="Usunąć paletę?"
              description={sztuk > 0 ? `Zawiera ${sztuk} formatek` : undefined}
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
                icon={<DeleteOutlined />}
                loading={deleting}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  width: dimensions.buttonHeightSmall, 
                  height: dimensions.buttonHeightSmall,
                  padding: 0
                }}
              />
            </Popconfirm>
          </Space>
        </div>

        {/* Status zamknięcia */}
        {isZamknieta && (
          <Badge 
            status="warning" 
            text="ZAMKNIĘTA"
            style={{ 
              marginBottom: dimensions.spacingSm,
              fontSize: dimensions.fontSizeSmall,
              fontWeight: dimensions.fontWeightBold
            }}
          />
        )}

        {/* Główna zawartość */}
        <Space direction="vertical" style={{ width: '100%', flex: 1 }} size={dimensions.spacingXs}>
          {/* Formatki - główna informacja */}
          <div style={{
            background: sztuk > 0 ? colors.bgHover : colors.bgSecondary,
            padding: dimensions.spacingXs,
            borderRadius: dimensions.buttonBorderRadius,
            textAlign: 'center'
          }}>
            <Text strong style={{ fontSize: dimensions.fontSizeLarge }}>
              {sztuk} szt.
            </Text>
            {sztuk === 0 && !isZamknieta && (
              <Text style={{ 
                fontSize: dimensions.fontSizeSmall, 
                color: colors.textSecondary,
                display: 'block'
              }}>
                Pusta paleta
              </Text>
            )}
          </div>

          {/* Kolory */}
          {kolory.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {kolory.slice(0, 2).map((kolor, idx) => (
                <Tag 
                  key={idx} 
                  style={{ 
                    fontSize: 10, 
                    margin: 0,
                    padding: '0 4px',
                    height: 16,
                    lineHeight: '16px'
                  }}
                >
                  {kolor}
                </Tag>
              ))}
              {kolory.length > 2 && (
                <Tag style={{ 
                  fontSize: 10, 
                  margin: 0,
                  padding: '0 4px',
                  height: 16,
                  lineHeight: '16px'
                }}>
                  +{kolory.length - 2}
                </Tag>
              )}
            </div>
          )}

          {/* Wskaźnik wypełnienia */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 2
            }}>
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                Wypełnienie
              </Text>
              <Text style={{ 
                fontSize: 10, 
                color: styleHelpers.getCompletionColor(procentWypelnienia),
                fontWeight: dimensions.fontWeightBold
              }}>
                {procentWypelnienia}%
              </Text>
            </div>
            <div style={{
              ...componentStyles.progress.base,
              position: 'relative'
            }}>
              <div style={{
                ...componentStyles.progress.bar,
                width: `${procentWypelnienia}%`,
                background: styleHelpers.getCompletionColor(procentWypelnienia)
              }} />
            </div>
            
            {/* Szczegóły wagi i wysokości */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 10,
              color: colors.textSecondary
            }}>
              <span>{waga.toFixed(1)}kg</span>
              <span>{wysokosc}mm</span>
            </div>
          </div>

          {/* Obszar drop dla drag & drop */}
          {!isZamknieta && canDrop && (
            <div style={{ 
              textAlign: 'center', 
              fontSize: 10, 
              color: isActive ? colors.success : colors.textSecondary,
              padding: dimensions.spacingXs,
              border: `1px dashed ${isActive ? colors.success : colors.borderLight}`,
              borderRadius: dimensions.buttonBorderRadius,
              background: isActive ? `${colors.success}10` : 'transparent',
              marginTop: dimensions.spacingXs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: dimensions.spacingXs
            }}>
              <DragOutlined style={{ fontSize: dimensions.iconSizeSmall }} />
              {isActive ? 'Upuść tutaj' : 'Przeciągnij formatki'}
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};