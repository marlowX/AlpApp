/**
 * @fileoverview Karta pojedynczej palety
 * @module PaletyZko/components/PaletaCard
 */

import React, { useState } from 'react';
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
  Divider
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
  PlusOutlined
} from '@ant-design/icons';
import { Paleta } from '../types';
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

interface PaletaCardProps {
  paleta: Paleta;
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (id: number) => void;
  onClose?: (id: number) => void;
  onShowDetails?: (id: number) => void;
  onAddFormatka?: (paletaId: number) => void;
  deleting?: boolean;
}

export const PaletaCard: React.FC<PaletaCardProps> = ({
  paleta,
  onEdit,
  onDelete,
  onClose,
  onShowDetails,
  onAddFormatka,
  deleting = false
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);

  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  const procentWagi = (paleta.waga_kg / maxWaga) * 100;
  const procentWysokosci = (paleta.wysokosc_stosu / maxWysokosc) * 100;
  const iloscFormatek = paleta.sztuk_total || paleta.ilosc_formatek || 0;

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
      <Card
        className="paleta-card"
        loading={deleting}
        onClick={() => setEditModalVisible(true)}
        style={{ cursor: 'pointer' }}
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <InboxOutlined />
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

        {/* Przycisk dodawania gdy paleta jest pusta */}
        {iloscFormatek === 0 && (
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
