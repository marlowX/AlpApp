/**
 * @fileoverview Kompaktowa karta pojedynczej palety - obniżona wysokość
 * @module PaletyZko/components/PaletaCardCompact
 */

import React from 'react';
import {
  Card,
  Tag,
  Space,
  Typography,
  Progress,
  Button,
  Badge,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Paleta } from '../types';

const { Text } = Typography;

interface PaletaCardCompactProps {
  paleta: Paleta;
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (id: number) => void;
  onClose?: (id: number) => void;
  onShowDetails?: (id: number) => void;
  onPrint?: (id: number) => void;
  deleting?: boolean;
  closing?: boolean;
}

export const PaletaCardCompact: React.FC<PaletaCardCompactProps> = ({
  paleta,
  onEdit,
  onDelete,
  onClose,
  onShowDetails,
  onPrint,
  deleting = false,
  closing = false
}) => {
  const iloscFormatek = paleta.sztuk_total || paleta.ilosc_formatek || 0;
  const isZamknieta = paleta.status === 'zamknieta' || paleta.status === 'gotowa_do_transportu';
  
  // Formatowanie numeru palety
  const formatujNumerPalety = (numer: string) => {
    if (!numer) return 'BRAK';
    const parts = numer.split('-');
    if (parts.length >= 3) {
      return parts.slice(-2).join('-'); // Ostatnie 2 części
    }
    return numer;
  };

  // Kolor statusu
  const getStatusColor = () => {
    if (isZamknieta) return '#52c41a';
    if (iloscFormatek === 0) return '#d9d9d9';
    return '#1890ff';
  };

  return (
    <Card
      className="paleta-card-compact"
      size="small"
      loading={deleting || closing}
      style={{ 
        cursor: 'pointer',
        borderColor: getStatusColor(),
        borderWidth: 2,
        height: '160px', // Stała wysokość - obniżona
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{ 
        padding: '8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => onShowDetails?.(paleta.id)}
    >
      {/* Nagłówek */}
      <div style={{ marginBottom: 6 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size={4}>
              {isZamknieta && (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
              )}
              <Text strong style={{ fontSize: 14 }}>
                PAL-{formatujNumerPalety(paleta.numer_palety)}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size={2}>
              {onPrint && isZamknieta && (
                <Tooltip title="Drukuj etykietę">
                  <Button
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrint(paleta.id);
                    }}
                    style={{ padding: '0 4px', height: 22 }}
                  />
                </Tooltip>
              )}
              {onClose && (
                <Tooltip title={isZamknieta ? "Paleta zamknięta" : "Zamknij paletę"}>
                  <Button
                    size="small"
                    icon={<LockOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(paleta.id);
                    }}
                    disabled={isZamknieta}
                    type={isZamknieta ? "default" : "primary"}
                    style={{ padding: '0 4px', height: 22 }}
                  />
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Usuń paletę">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(paleta.id);
                    }}
                    style={{ padding: '0 4px', height: 22 }}
                  />
                </Tooltip>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Główna zawartość */}
      <div style={{ flex: 1 }}>
        {/* Formatki i przeznaczenie */}
        <Row gutter={8} style={{ marginBottom: 4 }}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Formatki:</Text>
            <div>
              <Tag color={iloscFormatek > 0 ? "green" : "default"} style={{ margin: 0 }}>
                <strong style={{ fontSize: 16 }}>{iloscFormatek}</strong> szt
              </Tag>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Przeznaczenie:</Text>
            <div>
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {paleta.przeznaczenie || 'MAGAZYN'}
              </Tag>
            </div>
          </Col>
        </Row>

        {/* Waga i wysokość - kompaktowe paski */}
        <div style={{ marginTop: 'auto' }}>
          <Row gutter={4}>
            <Col span={12}>
              <Tooltip title={`Waga: ${paleta.waga_kg || 0} kg / ${paleta.max_waga_kg || 700} kg`}>
                <div>
                  <Text style={{ fontSize: 10 }}>Waga</Text>
                  <Progress
                    percent={Math.round(((paleta.waga_kg || 0) / (paleta.max_waga_kg || 700)) * 100)}
                    size="small"
                    showInfo={false}
                    strokeColor={{
                      '0%': '#52c41a',
                      '70%': '#faad14',
                      '100%': '#ff4d4f'
                    }}
                  />
                </div>
              </Tooltip>
            </Col>
            <Col span={12}>
              <Tooltip title={`Wysokość: ${paleta.wysokosc_stosu || 0} mm / ${paleta.max_wysokosc_mm || 1440} mm`}>
                <div>
                  <Text style={{ fontSize: 10 }}>Wysokość</Text>
                  <Progress
                    percent={Math.round(((paleta.wysokosc_stosu || 0) / (paleta.max_wysokosc_mm || 1440)) * 100)}
                    size="small"
                    showInfo={false}
                    strokeColor={{
                      '0%': '#52c41a',
                      '70%': '#faad14',
                      '100%': '#ff4d4f'
                    }}
                  />
                </div>
              </Tooltip>
            </Col>
          </Row>
        </div>

        {/* Kolory - jeśli są */}
        {paleta.kolory_na_palecie && (
          <div style={{ marginTop: 4 }}>
            <Space size={2}>
              {paleta.kolory_na_palecie.split(',').slice(0, 3).map((kolor, idx) => (
                <Badge 
                  key={idx} 
                  color={kolor.trim().toLowerCase()} 
                  style={{ width: 8, height: 8 }}
                />
              ))}
              {paleta.kolory_na_palecie.split(',').length > 3 && (
                <Text style={{ fontSize: 10 }}>+{paleta.kolory_na_palecie.split(',').length - 3}</Text>
              )}
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};