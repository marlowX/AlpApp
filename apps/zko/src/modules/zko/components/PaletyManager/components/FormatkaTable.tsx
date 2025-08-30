import React from 'react';
import { Table, Tag, Space, Progress, Button, InputNumber, Tooltip, Typography } from 'antd';
import { PlusOutlined, CheckCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Formatka } from '../types';

const { Text } = Typography;

interface FormatkaTableProps {
  formatki: Formatka[];
  pozostaleIlosci: Record<number, number>;
  activePaletaId?: string;
  editingFormatka: number | null;
  tempIlosci: Record<number, number>;
  currentIlosci: Record<number, number>;
  onEdit: (formatkaId: number, currentIlosc: number) => void;
  onConfirm: (formatkaId: number) => void;
  onCancel: () => void;
  onTempIloscChange: (formatkaId: number, value: number) => void;
  onDodajWszystkie: (formatkaId: number) => void;
}

export const FormatkaTable: React.FC<FormatkaTableProps> = ({
  formatki,
  pozostaleIlosci,
  activePaletaId,
  editingFormatka,
  tempIlosci,
  currentIlosci,
  onEdit,
  onConfirm,
  onCancel,
  onTempIloscChange,
  onDodajWszystkie
}) => {
  return (
    <Table
      dataSource={formatki}
      size="small"
      pagination={false}
      rowKey="id"
      columns={[
        {
          title: 'Formatka',
          dataIndex: 'nazwa',
          render: (text, record) => (
            <Space direction="vertical" size={0}>
              <Text strong>{text || record.nazwa_formatki}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.dlugosc}×{record.szerokosc}×{record.grubosc || 18}mm
              </Text>
            </Space>
          )
        },
        {
          title: 'Kolor',
          dataIndex: 'kolor',
          width: 80,
          render: (text, record) => <Tag>{text || record.kolor_plyty}</Tag>
        },
        {
          title: 'Pozostało',
          width: 100,
          render: (_, record) => {
            const pozostalo = pozostaleIlosci[record.id] || 0;
            const planowane = record.ilosc_dostepna !== undefined 
              ? record.ilosc_dostepna 
              : record.ilosc_planowana;
            
            return (
              <Space direction="vertical" size={0}>
                <Text strong>{pozostalo} szt.</Text>
                <Progress 
                  percent={planowane > 0 ? 100 - (pozostalo / planowane) * 100 : 100} 
                  size="small"
                  showInfo={false}
                />
              </Space>
            );
          }
        },
        {
          title: 'Dodaj',
          width: 160,
          render: (_, record) => {
            if (!activePaletaId) {
              return <Text type="secondary">Wybierz paletę</Text>;
            }
            
            const isEditing = editingFormatka === record.id;
            const currentIlosc = currentIlosci[record.id] || 0;
            const dostepne = pozostaleIlosci[record.id] || 0;
            
            if (isEditing) {
              return (
                <Space size={4}>
                  <InputNumber
                    size="small"
                    min={1}
                    max={dostepne + currentIlosc}
                    value={tempIlosci[record.id] || currentIlosc || 1}
                    onChange={(value) => onTempIloscChange(record.id, value || 1)}
                    style={{ width: 60 }}
                    onPressEnter={() => onConfirm(record.id)}
                  />
                  <Button 
                    size="small" 
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onConfirm(record.id)}
                  />
                  <Button 
                    size="small" 
                    onClick={onCancel}
                  >
                    ✕
                  </Button>
                </Space>
              );
            }
            
            return (
              <Space size={4}>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => onEdit(record.id, currentIlosc)}
                  disabled={dostepne === 0 && currentIlosc === 0}
                >
                  {currentIlosc > 0 ? `${currentIlosc} szt.` : 'Dodaj'}
                </Button>
                
                {dostepne > 0 && (
                  <Tooltip title={`Dodaj wszystkie ${dostepne} szt.`}>
                    <Button
                      size="small"
                      icon={<PlusCircleOutlined />}
                      onClick={() => onDodajWszystkie(record.id)}
                      style={{ 
                        borderColor: '#52c41a', 
                        color: '#52c41a' 
                      }}
                    >
                      Wszystkie
                    </Button>
                  </Tooltip>
                )}
              </Space>
            );
          }
        }
      ]}
    />
  );
};
