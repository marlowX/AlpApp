/**
 * @fileoverview Karta palety z obsługą DRAG & DROP
 * @module PaletyZko/components/PaletaCardDND
 */

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import {
  Card,
  Tag,
  Space,
  Typography,
  Progress,
  Button,
  Dropdown,
  Modal,
  List,
  Badge,
  Empty,
  Divider,
  message
} from 'antd';
import type { MenuProps } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Paleta, Formatka } from '../types';
import {
  formatujNumerPalety,
  formatujPrzeznaczenie,
  getIkonaPrzeznaczenia,
  formatujWage,
  formatujWysokosc,
  formatujStatus,
  getKolorStatusu,
  formatujKolor
} from '../utils';

const { Text } = Typography;

interface PaletaCardDNDProps {
  paleta: Paleta;
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (id: number) => void;
  onClose?: (id: number) => void;
  onShowDetails?: (id: number) => void;
  onAddFormatka?: (paletaId: number) => void;
  onDropFormatka?: (formatka: Formatka, ilosc: number, targetPaletaId: number) => void;
  deleting?: boolean;
}

interface DragItem {
  type: string;
  formatka: Formatka;
  ilosc: number;
}

export const PaletaCardDND: React.FC<PaletaCardDNDProps> = ({
  paleta,
  onEdit,
  onDelete,
  onClose,
  onShowDetails,
  onAddFormatka,
  onDropFormatka,
  deleting = false
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Setup drop zone
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: 'FORMATKA',
    canDrop: () => paleta.status !== 'zamknieta',
    drop: (item) => {
      if (onDropFormatka && paleta.status !== 'zamknieta') {
        onDropFormatka(item.formatka, item.ilosc, paleta.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  const procentWagi = (paleta.waga_kg / maxWaga) * 100;
  const procentWysokosci = (paleta.wysokosc_stosu / maxWysokosc) * 100;
  const iloscFormatek = paleta.sztuk_total || paleta.ilosc_formatek || 0;

  // Style dla drop zone
  const dropZoneStyle: React.CSSProperties = {
    cursor: 'pointer',
    border: isOver && canDrop ? '2px dashed #1890ff' : undefined,
    backgroundColor: isOver && canDrop ? 'rgba(24, 144, 255, 0.05)' : undefined,
    transition: 'all 0.3s ease'
  };

  // Menu akcji
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edytuj',
      icon: <EditOutlined />,
      onClick: () => setEditModalVisible(true),
      disabled: paleta.status === 'zamknieta'
    },
    {
      key: 'details',
      label: 'Szczegóły',
      icon: <EyeOutlined />,
      onClick: () => onShowDetails?.(paleta.id)
    },
    {
      type: 'divider'
    },
    {
      key: 'close',
      label: paleta.status === 'zamknieta' ? 'Otwórz' : 'Zamknij',
      icon: paleta.status === 'zamknieta' ? <UnlockOutlined /> : <LockOutlined />,
      onClick: () => onClose?.(paleta.id)
    },
    {
      key: 'delete',
      label: 'Usuń',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Potwierdź usunięcie',
          content: `Czy na pewno chcesz usunąć paletę ${formatujNumerPalety(paleta.numer_palety)}?`,
          okText: 'Usuń',
          cancelText: 'Anuluj',
          okButtonProps: { danger: true },
          onOk: () => onDelete?.(paleta.id)
        });
      }
    }
  ];

  return (
    <>
      <div ref={drop}>
        <Card
          className="paleta-card"
          loading={deleting}
          onClick={() => setEditModalVisible(true)}
          style={dropZoneStyle}
          title={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                {isOver && canDrop ? (
                  <DownloadOutlined style={{ color: '#1890ff' }} />
                ) : (
                  <InboxOutlined />
                )}
                <Text strong>{formatujNumerPalety(paleta.numer_palety)}</Text>
                <Tag color={getKolorStatusu(paleta.status)}>
                  {formatujStatus(paleta.status)}
                </Tag>
              </Space>
              <Dropdown 
                menu={{ items: menuItems }} 
                trigger={['click']}
                placement="bottomRight"
              >
                <Button 
                  icon={<MoreOutlined />} 
                  size="small" 
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </Space>
          }
        >
          {/* Drop indicator */}
          {isOver && canDrop && (
            <div style={{ 
              padding: 8, 
              marginBottom: 12, 
              backgroundColor: '#e6f7ff',
              border: '1px dashed #1890ff',
              borderRadius: 4,
              textAlign: 'center'
            }}>
              <DownloadOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text style={{ color: '#1890ff' }}>Upuść tutaj aby dodać formatki</Text>
            </div>
          )}

          {/* Przeznaczenie */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Przeznaczenie:</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" style={{ fontSize: 14 }}>
                {getIkonaPrzeznaczenia(paleta.przeznaczenie)} {formatujPrzeznaczenie(paleta.przeznaczenie)}
              </Tag>
            </div>
          </div>

          {/* Formatki */}
          <div style={{ marginBottom: 12 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">Formatki:</Text>
              <Tag>{iloscFormatek} formatek</Tag>
            </Space>
            
            {paleta.kolory_na_palecie && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Kolory: </Text>
                {paleta.kolory_na_palecie.split(',').map((kolor, idx) => (
                  <Badge 
                    key={idx} 
                    color={kolor.trim()} 
                    text={formatujKolor(kolor.trim())}
                    style={{ marginRight: 8 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Waga */}
          <div style={{ marginBottom: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">Waga:</Text>
              <Text>{formatujWage(paleta.waga_kg)}</Text>
            </Space>
            <Progress
              percent={Math.round(procentWagi)}
              strokeColor={procentWagi > 90 ? '#ff4d4f' : procentWagi > 70 ? '#faad14' : '#52c41a'}
              showInfo={false}
              size="small"
            />
          </div>

          {/* Wysokość */}
          <div style={{ marginBottom: 12 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">Wysokość:</Text>
              <Text>{formatujWysokosc(paleta.wysokosc_stosu)}</Text>
            </Space>
            <Progress
              percent={Math.round(procentWysokosci)}
              strokeColor={procentWysokosci > 90 ? '#ff4d4f' : procentWysokosci > 70 ? '#faad14' : '#52c41a'}
              showInfo={false}
              size="small"
            />
          </div>

          {/* Status palety */}
          {paleta.status === 'zamknieta' && (
            <div style={{ 
              marginTop: 12, 
              padding: 8, 
              backgroundColor: '#f0f0f0',
              borderRadius: 4,
              textAlign: 'center'
            }}>
              <LockOutlined style={{ marginRight: 8 }} />
              <Text type="secondary">Paleta zamknięta</Text>
            </div>
          )}

          {/* Przycisk dodawania gdy paleta jest pusta */}
          {iloscFormatek === 0 && paleta.status !== 'zamknieta' && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={(e) => {
                e.stopPropagation();
                onAddFormatka?.(paleta.id);
              }}
            >
              Dodaj formatki
            </Button>
          )}
        </Card>
      </div>

      {/* Modal edycji */}
      <Modal
        title={`Edycja palety ${formatujNumerPalety(paleta.numer_palety)}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
      >
        {paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0 ? (
          <>
            <Divider>Formatki na palecie</Divider>
            <List
              dataSource={paleta.formatki_szczegoly}
              renderItem={(item: any) => (
                <List.Item>
                  <Space>
                    <Text>{item.dlugosc} × {item.szerokosc} mm</Text>
                    <Badge color={item.kolor} text={formatujKolor(item.kolor)} />
                    <Tag color="green">{item.ilosc} szt.</Tag>
                    <Text type="secondary">{item.nazwa_plyty}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        ) : (
          <Empty description="Paleta jest pusta" />
        )}
        
        <Divider />
        
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setEditModalVisible(false)}>
            Zamknij
          </Button>
          <Button 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditModalVisible(false);
              onEdit?.(paleta);
            }}
          >
            Edytuj zawartość
          </Button>
        </Space>
      </Modal>
    </>
  );
};
