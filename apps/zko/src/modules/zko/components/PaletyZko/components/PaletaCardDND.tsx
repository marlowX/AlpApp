/**
 * @fileoverview Karta palety z drag & drop - poprawiony widok kompaktowy
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
import { Paleta, ItemTypes } from '../types';
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
  // Setup drop target - używamy ItemTypes.FORMATKA
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FORMATKA,
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
  const formatki = paleta.formatki_szczegoly || [];
  
  // Wyciągnij unikalne kolory z formatek
  const kolory: string[] = [];
  const uniqueColors = new Set<string>();
  
  formatki.forEach((f: any) => {
    // Próbuj wyciągnąć kolor z nazwy formatki
    if (f.nazwa_formatki && f.nazwa_formatki.includes(' - ')) {
      const kolor = f.nazwa_formatki.split(' - ')[1];
      if (kolor && !uniqueColors.has(kolor)) {
        uniqueColors.add(kolor);
        kolory.push(kolor);
      }
    } else if (f.kolor && !uniqueColors.has(f.kolor)) {
      uniqueColors.add(f.kolor);
      kolory.push(f.kolor);
    }
  });
  
  // Pobierz pierwszą formatkę dla wyświetlenia
  const firstFormatka = formatki[0];
  const formatkaInfo = firstFormatka ? (
    firstFormatka.nazwa_formatki || 
    (firstFormatka.wymiary && firstFormatka.kolor ? `${firstFormatka.wymiary} - ${firstFormatka.kolor}` : '') ||
    (firstFormatka.dlugosc && firstFormatka.szerokosc ? `${firstFormatka.dlugosc}×${firstFormatka.szerokosc}` : '')
  ) : '';

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
          ...getStatusStyle(),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: dimensions.cardBorderRadius
        }}
        styles={{
          body: {
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }
        }}
      >
        {/* Nagłówek z numerem palety i akcjami - bardziej kompaktowy */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '4px',
          borderBottom: `1px solid ${colors.borderLight}`
        }}>
          <Space size={2} align="center">
            {isZamknieta ? (
              <LockOutlined style={{ fontSize: 12, color: colors.warning }} />
            ) : sztuk === 0 ? (
              <InboxOutlined style={{ fontSize: 12, color: colors.textSecondary }} />
            ) : (
              <UnlockOutlined style={{ fontSize: 12, color: colors.success }} />
            )}
            <Text strong style={{ fontSize: 13 }}>
              {paleta.numer_palety}
            </Text>
          </Space>
          
          <Space size={1}>
            {sztuk > 0 && !isZamknieta && (
              <Tooltip title="Zamknij" placement="top">
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
                    width: 20, 
                    height: 20,
                    padding: 0,
                    color: colors.success,
                    fontSize: 11
                  }}
                />
              </Tooltip>
            )}
            
            {isZamknieta && (
              <Tooltip title="Drukuj" placement="top">
                <Button
                  type="text"
                  size="small"
                  icon={<PrinterOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrint?.(paleta.id);
                  }}
                  style={{ 
                    width: 20, 
                    height: 20,
                    padding: 0,
                    color: colors.info,
                    fontSize: 11
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Szczegóły" placement="top">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails?.(paleta.id);
                }}
                style={{ 
                  width: 20, 
                  height: 20,
                  padding: 0,
                  color: colors.textSecondary,
                  fontSize: 11
                }}
              />
            </Tooltip>

            <Tooltip title="Usuń" placement="top">
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
                    width: 20, 
                    height: 20,
                    padding: 0,
                    fontSize: 11
                  }}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        </div>

        {/* Główna liczba sztuk - centrum uwagi */}
        <div style={{
          background: sztuk > 0 ? '#f0f9ff' : colors.bgSecondary,
          padding: '6px',
          borderRadius: 4,
          textAlign: 'center',
          border: `1px solid ${sztuk > 0 ? '#91d5ff' : colors.borderLight}`
        }}>
          <Text strong style={{ 
            fontSize: 20,
            color: sztuk > 0 ? colors.primary : colors.textSecondary,
            display: 'block'
          }}>
            {sztuk} szt.
          </Text>
          <Text style={{ 
            fontSize: 10,
            color: colors.textSecondary
          }}>
            formatek na palecie
          </Text>
        </div>

        {/* Informacja o formatkach - bardzo kompaktowa */}
        {formatkaInfo && sztuk > 0 && (
          <div style={{ 
            fontSize: 11,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatkaInfo}
            {formatki.length > 1 && ` +${formatki.length - 1}`}
          </div>
        )}

        {/* Wskaźnik wypełnienia - prosty pasek */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 2,
            fontSize: 10,
            color: colors.textSecondary
          }}>
            <span>Wypełnienie</span>
            <span style={{ 
              color: styleHelpers.getCompletionColor(procentWypelnienia),
              fontWeight: 'bold'
            }}>
              {procentWypelnienia}%
            </span>
          </div>
          <div style={{
            height: 4,
            background: colors.borderLight,
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${procentWypelnienia}%`,
              height: '100%',
              background: styleHelpers.getCompletionColor(procentWypelnienia),
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          {/* Mini info o wadze i wysokości */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: 2,
            fontSize: 9,
            color: colors.textTertiary
          }}>
            <span>{waga.toFixed(1)}kg</span>
            <span>{wysokosc}mm</span>
          </div>
        </div>

        {/* Obszar drop - tylko dla otwartych palet */}
        {!isZamknieta && (
          <div style={{ 
            textAlign: 'center', 
            fontSize: 10, 
            color: isActive ? colors.success : colors.textTertiary,
            padding: '4px',
            border: `1px dashed ${isActive ? colors.success : colors.borderLight}`,
            borderRadius: 4,
            background: isActive ? `${colors.success}10` : 'transparent',
            marginTop: 'auto'
          }}>
            <DragOutlined style={{ fontSize: 10, marginRight: 4 }} />
            {isActive ? 'Upuść tutaj' : 'Przeciągnij formatki'}
          </div>
        )}
      </Card>
    </div>
  );
};