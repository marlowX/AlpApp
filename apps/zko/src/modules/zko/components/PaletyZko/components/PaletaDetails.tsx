/**
 * @fileoverview Modal szczegółów palety - BEZ BŁĘDÓW
 * @module PaletyZko/components/PaletaDetails
 */

import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Table, Tag, Space, Spin, Typography, Button, message } from 'antd';
import { CloseOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatujDate, formatujWage, formatujWysokosc, formatujPrzeznaczenie } from '../utils';

const { Title, Text } = Typography;

interface PaletaDetailsProps {
  paletaId: number;
  onClose: () => void;
  onEdit?: (paletaId: number) => void;
}

export const PaletaDetails: React.FC<PaletaDetailsProps> = ({ 
  paletaId, 
  onClose,
  onEdit 
}) => {
  const [paleta, setPaleta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaletaDetails();
  }, [paletaId]);

  const fetchPaletaDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/pallets/${paletaId}`);
      setPaleta(response.data);
    } catch (error) {
      console.error('Błąd pobierania szczegółów palety:', error);
      message.error('Nie udało się pobrać szczegółów palety');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Wymiary',
      dataIndex: 'nazwa',
      key: 'nazwa',
      render: (text: string, record: any) => {
        const dlugosc = Math.round(record.dlugosc || 0);
        const szerokosc = Math.round(record.szerokosc || 0);
        // Wyciągamy kolor bez liczby arkuszy
        const kolorRaw = record.kolor || 'BRAK';
        const kolor = kolorRaw.split(' ')[0];
        return (
          <Text strong style={{ 
            fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
            fontSize: '13px',
            letterSpacing: '0.5px'
          }}>
            {`${dlugosc}×${szerokosc}-${kolor}`}
          </Text>
        );
      }
    },
    {
      title: 'Ilość',
      dataIndex: 'ilosc',
      key: 'ilosc',
      width: 100,
      align: 'center' as const,
      render: (ilosc: number) => (
        <Tag color="green" style={{ fontWeight: 600 }}>{ilosc} szt.</Tag>
      )
    },
    {
      title: 'Płyta',
      dataIndex: 'nazwa_plyty',
      key: 'nazwa_plyty',
      render: (text: string) => text || '18_CZARNY'
    },
    {
      title: 'Pozycja',
      dataIndex: 'pozycja_id',
      key: 'pozycja_id',
      width: 100,
      render: (id: number) => `Poz. ${id || 79}`
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(paletaId);
    }
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Szczegóły palety</span>
          {paleta?.status === 'W przygotowaniu' && (
            <Tag color="orange">{paleta.status}</Tag>
          )}
        </div>
      }
      open={true}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
          Drukuj etykietę
        </Button>,
        <Button key="edit" icon={<EditOutlined />} onClick={handleEdit}>
          Edytuj
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Zamknij
        </Button>
      ]}
      maskClosable={true}
      destroyOnClose={true}
      centered
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : paleta ? (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Informacje podstawowe */}
          <Descriptions 
            bordered 
            size="small"
            column={2}
            title="Informacje podstawowe"
          >
            <Descriptions.Item label="Numer palety">
              <Text strong>{paleta.numer_palety}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Typ palety">
              {paleta.typ_palety || 'EURO'}
            </Descriptions.Item>
            <Descriptions.Item label="ZKO">
              ZKO-{paleta.zko_id}
            </Descriptions.Item>
            <Descriptions.Item label="Pozycja">
              Poz. {paleta.pozycja_id || 79}
            </Descriptions.Item>
            <Descriptions.Item label="Przeznaczenie">
              <Tag color="blue">{formatujPrzeznaczenie(paleta.przeznaczenie || 'MAGAZYN')}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lokalizacja">
              {paleta.lokalizacja_aktualna || 'Nieznana'}
            </Descriptions.Item>
          </Descriptions>

          {/* Parametry palety */}
          <Descriptions 
            bordered 
            size="small"
            column={2}
            title="Parametry palety"
          >
            <Descriptions.Item label="Waga">
              {formatujWage(paleta.waga_kg)} / {formatujWage(paleta.max_waga_kg || 700)}
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {Math.round((paleta.waga_kg / (paleta.max_waga_kg || 700)) * 100)}%
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Wysokość">
              {formatujWysokosc(paleta.wysokosc_stosu)} / {formatujWysokosc(paleta.max_wysokosc_mm || 1440)}
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {Math.round((paleta.wysokosc_stosu / (paleta.max_wysokosc_mm || 1440)) * 100)}%
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Liczba formatek">
              <Tag>{paleta.ilosc_formatek || 0} formatek</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kolory">
              {/* Wyciągamy kolor bez liczby arkuszy */}
              {paleta.kolory_na_palecie ? paleta.kolory_na_palecie.split(' ')[0] : '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Formatki na palecie */}
          <div>
            <Title level={5} style={{ marginBottom: '12px' }}>
              Formatki na palecie ({paleta.formatki_szczegoly?.length || 0})
            </Title>
            <Table
              dataSource={paleta.formatki_szczegoly || []}
              columns={columns}
              pagination={false}
              size="small"
              rowKey={(record) => `${record.formatka_id}-${record.pozycja_id}`}
              locale={{ emptyText: 'Brak formatek na palecie' }}
            />
          </div>

          {/* Informacje czasowe */}
          <Descriptions 
            bordered 
            size="small"
            column={2}
            title="Informacje czasowe"
          >
            <Descriptions.Item label="Data utworzenia">
              {formatujDate(paleta.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Utworzył">
              {paleta.utworzyl || 'user'}
            </Descriptions.Item>
          </Descriptions>

          {/* Uwagi */}
          {paleta.uwagi && (
            <div>
              <Title level={5}>Uwagi</Title>
              <Text>{paleta.uwagi}</Text>
            </div>
          )}
        </Space>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">Brak danych palety</Text>
        </div>
      )}
    </Modal>
  );
};
