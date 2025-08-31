/**
 * @fileoverview Komponent tabeli palet - uproszczony
 * @module PaletyTable
 * 
 * MAKSYMALNIE 300 LINII KODU!
 * Helpery wydzielone do TableColumns.tsx
 */

import React from 'react';
import { Table, Button, Space, Tag, Tooltip, Popconfirm, Typography } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// Import helperów
import {
  getStatusColor,
  getPrzeznaczenieBadge,
  renderPozycje,
  renderKolory,
  renderWysokosc,
  renderWaga,
  renderWykorzystanie,
  renderFormatki
} from './TableColumns';

const { Text } = Typography;

// Interfejsy
interface FormatkaDetail {
  formatka_id: number;
  pozycja_id?: number;
  ilosc: number;
  nazwa: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
  nazwa_plyty?: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  pozycje_lista?: string;
  numer_pozycji?: number;
  nazwa_plyty?: string;
  kolor_plyty?: string;
  przeznaczenie?: string;
  kierunek?: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  waga_kg?: number;
  kolory_na_palecie: string;
  formatki_szczegoly?: FormatkaDetail[];
  formatki?: FormatkaDetail[];
  procent_wykorzystania?: number;
}

interface PaletyTableProps {
  palety: Paleta[];
  loading: boolean;
  onViewDetails: (paleta: Paleta) => void;
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (paletaId: number) => void;
  deletingId?: number | null;
  renderFormatkiColumn?: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTable: React.FC<PaletyTableProps> = ({
  palety,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
  deletingId,
  renderFormatkiColumn
}) => {

  // Definicja kolumn tabeli
  const columns: ColumnsType<Paleta> = [
    {
      title: 'Paleta',
      dataIndex: 'numer_palety',
      key: 'numer_palety',
      width: 150,
      fixed: 'left',
      render: (text: string, record: Paleta) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13, color: '#1890ff' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>
            ID: {record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Pozycje',
      key: 'pozycje',
      width: 120,
      render: (_, record) => renderPozycje(record),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: 11 }}>
          {status?.replace(/_/g, ' ').toUpperCase() || 'NIEZNANY'}
        </Tag>
      ),
    },
    {
      title: 'Przeznaczenie',
      key: 'przeznaczenie',
      width: 140,
      render: (_, record) => getPrzeznaczenieBadge(record.przeznaczenie || record.kierunek),
    },
    {
      title: 'Kolory',
      dataIndex: 'kolory_na_palecie',
      key: 'kolory',
      width: 160,
      render: renderKolory,
    },
    {
      title: 'Formatki',
      key: 'formatki',
      width: 280,
      render: (_, record) => renderFormatkiColumn ? renderFormatkiColumn(record) : renderFormatki(record),
    },
    {
      title: 'Wysokość',
      dataIndex: 'wysokosc_stosu',
      key: 'wysokosc',
      width: 110,
      render: renderWysokosc,
    },
    {
      title: 'Waga',
      dataIndex: 'waga_kg',
      key: 'waga',
      width: 110,
      render: renderWaga,
    },
    {
      title: 'Wykorzystanie',
      key: 'wykorzystanie',
      width: 110,
      render: (_, record) => renderWykorzystanie(record),
    },
    {
      title: 'Akcje',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record: Paleta) => (
        <Space size="small">
          <Tooltip title="Zobacz szczegóły">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>
          {onEdit && (
            <Tooltip title="Edytuj paletę">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Popconfirm
              title="Czy na pewno usunąć tę paletę?"
              description="Ta operacja jest nieodwracalna"
              onConfirm={() => onDelete(record.id)}
              okText="Usuń"
              cancelText="Anuluj"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Obliczenia dla podsumowania
  const calculateTotals = () => {
    const totalSztuk = palety.reduce((sum, p) => {
      const val = Number(p.sztuk_total || p.ilosc_formatek || 0);
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);
    
    const totalWysokosc = palety.reduce((sum, p) => {
      const val = Number(p.wysokosc_stosu || 0);
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);
    
    const totalWaga = palety.reduce((sum, p) => {
      const val = Number(p.waga_kg || 0);
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);

    const averageUtilization = palety.length > 0 
      ? Math.round(palety.reduce((sum, p) => {
          const percent = Number(p.procent_wykorzystania) || 
                         Math.round(((p.sztuk_total || p.ilosc_formatek || 0) / 80) * 100);
          return sum + percent;
        }, 0) / palety.length)
      : 0;

    return { totalSztuk, totalWysokosc, totalWaga, averageUtilization };
  };

  const { totalSztuk, totalWysokosc, totalWaga, averageUtilization } = calculateTotals();

  return (
    <Table
      columns={columns}
      dataSource={palety}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20', '50'],
        showTotal: (total) => `Łącznie ${total} palet`,
      }}
      scroll={{ x: 1400, y: 600 }}
      size="small"
      style={{ width: '100%' }}
      className="palety-table"
      summary={() => (
        palety.length > 0 ? (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <Text strong style={{ fontSize: 12 }}>
                  Podsumowanie ({palety.length} palet)
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                  Σ {totalSztuk} szt.
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <Text strong style={{ fontSize: 12 }}>
                  {totalWysokosc} mm
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <Text strong style={{ fontSize: 12 }}>
                  {totalWaga.toFixed(1)} kg
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9}>
                <Text strong style={{ fontSize: 12 }}>
                  Śr. {averageUtilization}%
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} />
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      )}
    />
  );
};