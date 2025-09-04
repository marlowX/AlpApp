/**
 * @fileoverview Karta palety z drag & drop - kompaktowa wersja
 * @module PaletyZko/components/PaletaCardDND
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, Tag, Space, Typography, Button, Popconfirm, Tooltip, Row, Col } from 'antd';
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
  
  // Pobierz dane
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

  // Formatuj numer palety
  const formatujNumerPalety = (numer: string) => {
    if (!numer) return 'BRAK';
    const parts = numer.split('-');
    if (parts.length >= 3) {
      return parts.slice(-2).join('-'); // Ostatnie 2 części
    }
    return numer;
  };

  // Kolor ramki
  const getBorderColor = () => {
    if (isActive) return '#52c41a';
    if (isZamknieta) return '#faad14';
    if (sztuk === 0) return '#d9d9d9';
    return '#1890ff';
  };

  // Styl karty
  const cardStyle: React.CSSProperties = {
    height: '140px', // OBNIŻONA WYSOKOŚĆ
    cursor: 'pointer',
    borderColor: getBorderColor(),
    borderWidth: isActive ? 2 : 1,
    borderStyle: sztuk === 0 && !isZamknieta ? 'dashed' : 'solid',
    backgroundColor: isActive ? '#f6ffed' : isZamknieta ? '#fffbe6' : '#fff',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  return (
    <div ref={drop}>
      <Card
        size="small"
        hoverable
        loading={deleting || closing}
        onClick={() => onShowDetails?.(paleta.id)}
        style={cardStyle}
        bodyStyle={{
          padding: '6px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Nagłówek - bardzo kompaktowy */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
          <Col>
            <Space size={2}>
              {isZamknieta ? (
                <LockOutlined style={{ fontSize: 12, color: '#faad14' }} />
              ) : (
                <UnlockOutlined style={{ fontSize: 12, color: '#52c41a' }} />
              )}
              <Text strong style={{ fontSize: 12 }}>
                PAL-{formatujNumerPalety(paleta.numer_palety)}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size={0}>
              {!isZamknieta && sztuk > 0 && (
                <Tooltip title="Zamknij">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose?.(paleta.id);
                    }}
                    style={{ width: 22, height: 22, padding: 0, fontSize: 12 }}
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
                    style={{ width: 22, height: 22, padding: 0, fontSize: 12 }}
                  />
                </Tooltip>
              )}
              <Tooltip title="Usuń">
                <Popconfirm
                  title="Usunąć paletę?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete?.(paleta.id);
                  }}
                  okText="Tak"
                  cancelText="Nie"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 22, height: 22, padding: 0, fontSize: 12 }}
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Główna liczba - centrum */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <Text strong style={{ 
            fontSize: 28,
            lineHeight: 1,
            color: sztuk > 0 ? '#1890ff' : '#d9d9d9'
          }}>
            {sztuk}
          </Text>
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            formatek na palecie
          </Text>
        </div>

        {/* Wskaźniki - bardzo kompaktowe */}
        <Row gutter={4}>
          <Col span={12}>
            <Tooltip title={`Waga: ${waga.toFixed(0)}/${maxWaga} kg`}>
              <div style={{ 
                height: 3,
                background: '#f0f0f0',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${procentWagi}%`,
                  height: '100%',
                  background: procentWagi > 90 ? '#ff4d4f' : procentWagi > 70 ? '#faad14' : '#52c41a'
                }} />
              </div>
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title={`Wysokość: ${wysokosc}/${maxWysokosc} mm`}>
              <div style={{ 
                height: 3,
                background: '#f0f0f0',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${procentWysokosci}%`,
                  height: '100%',
                  background: procentWysokosci > 90 ? '#ff4d4f' : procentWysokosci > 70 ? '#faad14' : '#52c41a'
                }} />
              </div>
            </Tooltip>
          </Col>
        </Row>

        {/* Drop indicator - tylko dla otwartych */}
        {!isZamknieta && (
          <div style={{ 
            marginTop: 4,
            textAlign: 'center',
            fontSize: 9,
            color: isActive ? '#52c41a' : '#d9d9d9',
            padding: '2px',
            border: `1px dashed ${isActive ? '#52c41a' : '#f0f0f0'}`,
            borderRadius: 2,
            background: isActive ? '#f6ffed' : 'transparent'
          }}>
            <DragOutlined style={{ fontSize: 10 }} />
            {isActive ? ' Upuść tutaj' : ' Przeciągnij formatki'}
          </div>
        )}
      </Card>
    </div>
  );
};