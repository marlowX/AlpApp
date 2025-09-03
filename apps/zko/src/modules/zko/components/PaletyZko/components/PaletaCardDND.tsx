/**
 * @fileoverview Karta palety z drag & drop - poprawiony widok
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
  
  // Pobierz dane o formatkach - sprawdź różne możliwe pola
  const sztuk = Number(
    paleta.ilosc_formatek || 
    paleta.sztuk_total || 
    paleta.sztuk || 
    paleta.formatki_szczegoly?.reduce((sum: number, f: any) => sum + (f.ilosc || 0), 0) ||
    0
  );
  
  const waga = Number(paleta.waga_kg || paleta.waga_total || 0);
  const wysokosc = Number(paleta.wysokosc_stosu || paleta.wysokosc_mm || 0);
  const maxWaga = Number(paleta.max_waga_kg || 700);
  const maxWysokosc = Number(paleta.max_wysokosc_mm || 1440);
  
  const procentWagi = maxWaga > 0 ? Math.min(Math.round((waga / maxWaga) * 100), 100) : 0;
  const procentWysokosci = maxWysokosc > 0 ? Math.min(Math.round((wysokosc / maxWysokosc) * 100), 100) : 0;
  const procentWypelnienia = Math.round((procentWagi + procentWysokosci) / 2);

  // Pobierz kolory i formatki
  const kolorRaw = paleta.kolory_na_palecie || paleta.kolor || '';
  const kolory = kolorRaw.split(',').map(k => k.trim()).filter(k => k && k !== '-');
  
  // Pobierz nazwy formatek
  const formatki = paleta.formatki_szczegoly || paleta.formatki || [];
  const formatkiNames = formatki.slice(0, 2).map((f: any) => {
    if (f.wymiary) {
      // Jeśli mamy wymiary, stwórz nazwę z wymiarów i koloru
      const kolor = f.kolor || kolory[0] || '';
      return `${f.wymiary}${kolor ? `-${kolor}` : ''}`;
    } else if (f.nazwa) {
      return f.nazwa;
    } else if (f.szerokosc && f.dlugosc) {
      const kolor = f.kolor || kolory[0] || '';
      return `${f.szerokosc}x${f.dlugosc}${kolor ? `-${kolor}` : ''}`;
    }
    return 'Formatka';
  });

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
        {/* Nagłówek z numerem palety i akcjami */}
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
              <Tooltip title="Paleta zamknięta">
                <LockOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.warning }} />
              </Tooltip>
            ) : sztuk === 0 ? (
              <Tooltip title="Pusta paleta">
                <InboxOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.textSecondary }} />
              </Tooltip>
            ) : (
              <Tooltip title="Paleta otwarta">
                <UnlockOutlined style={{ fontSize: dimensions.iconSizeSmall, color: colors.success }} />
              </Tooltip>
            )}
            <Text strong style={{ fontSize: dimensions.fontSizeBase }}>
              {paleta.numer_palety}
            </Text>
          </Space>
          
          <Space size={2}>
            {/* Przycisk zamknięcia - widoczny dla otwartych palet ze sztukami */}
            {sztuk > 0 && !isZamknieta && (
              <Tooltip title="Zamknij paletę" placement="top">
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
            
            {/* Przycisk drukowania - tylko dla zamkniętych */}
            {isZamknieta && (
              <Tooltip title="Drukuj etykietę" placement="top">
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

            {/* Przycisk szczegółów */}
            <Tooltip title="Pokaż szczegóły" placement="top">
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
                  padding: 0,
                  color: colors.textSecondary
                }}
              />
            </Tooltip>

            {/* Przycisk usuwania */}
            <Tooltip title="Usuń paletę" placement="top">
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
            </Tooltip>
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
          {/* Liczba sztuk - główna informacja */}
          <div style={{
            background: sztuk > 0 ? '#f0f9ff' : colors.bgSecondary,
            padding: dimensions.spacingXs,
            borderRadius: dimensions.buttonBorderRadius,
            textAlign: 'center',
            border: `1px solid ${sztuk > 0 ? '#91d5ff' : colors.borderLight}`
          }}>
            <Text strong style={{ 
              fontSize: dimensions.fontSizeLarge,
              color: sztuk > 0 ? colors.primary : colors.textSecondary
            }}>
              {sztuk} szt.
            </Text>
            {sztuk === 0 ? (
              <Text style={{ 
                fontSize: dimensions.fontSizeSmall, 
                color: colors.textSecondary,
                display: 'block'
              }}>
                Pusta paleta
              </Text>
            ) : (
              <Text style={{ 
                fontSize: 10,
                color: colors.textSecondary,
                display: 'block'
              }}>
                formatek na palecie
              </Text>
            )}
          </div>

          {/* Nazwy formatek */}
          {formatkiNames.length > 0 && sztuk > 0 && (
            <div style={{ 
              padding: '2px 4px',
              background: colors.bgSecondary,
              borderRadius: 2,
              fontSize: 10
            }}>
              {formatkiNames.map((name, idx) => (
                <div key={idx} style={{ color: colors.textSecondary }}>
                  • {name}
                </div>
              ))}
              {formatki.length > 2 && (
                <div style={{ color: colors.textTertiary }}>
                  + {formatki.length - 2} więcej...
                </div>
              )}
            </div>
          )}

          {/* Kolory jako małe tagi */}
          {kolory.length > 0 && sztuk > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {kolory.slice(0, 3).map((kolor, idx) => (
                <Tag 
                  key={idx} 
                  style={{ 
                    fontSize: 9, 
                    margin: 0,
                    padding: '0 4px',
                    height: 14,
                    lineHeight: '14px'
                  }}
                >
                  {kolor}
                </Tag>
              ))}
              {kolory.length > 3 && (
                <Tag style={{ 
                  fontSize: 9, 
                  margin: 0,
                  padding: '0 4px',
                  height: 14,
                  lineHeight: '14px'
                }}>
                  +{kolory.length - 3}
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
              <span>{wysokosc.toFixed(0)}mm</span>
            </div>
          </div>

          {/* Obszar drop dla drag & drop */}
          {!isZamknieta && canDrop && (
            <Tooltip title="Przeciągnij formatki tutaj">
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
            </Tooltip>
          )}
        </Space>
      </Card>
    </div>
  );
};