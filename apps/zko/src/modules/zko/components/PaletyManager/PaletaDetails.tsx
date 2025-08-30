import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Table, Tabs, Alert } from 'antd';
import { InfoCircleOutlined, EyeOutlined, TableOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { PaletaVisualizer } from './components/PaletaVisualizer';

const { Text } = Typography;
const { TabPane } = Tabs;

interface FormatkaDetail {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  kolor: string;
}

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: FormatkaDetail[];
  typ?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
}

interface PaletaDetailsProps {
  visible: boolean;
  paleta: Paleta;
  onClose: () => void;
}

export const PaletaDetails: React.FC<PaletaDetailsProps> = ({
  visible,
  paleta,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('details');

  // Oblicz parametry do wizualizacji
  const totalSztuk = paleta.sztuk_total || paleta.ilosc_formatek || 0;
  const gruboscPlyty = 18; // Domyślna grubość
  const liczbaPoziomow = Math.ceil(paleta.wysokosc_stosu / gruboscPlyty);

  // Przygotuj dane formatek dla tabeli
  const formatkiTableData = paleta.formatki_szczegoly?.map((f, idx) => ({
    key: idx,
    nazwa: f.nazwa,
    wymiary: `${f.dlugosc}×${f.szerokosc}mm`,
    ilosc: f.ilosc,
    kolor: f.kolor,
    procent: Math.round((f.ilosc / totalSztuk) * 100)
  })) || [];

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          Szczegóły palety: {paleta.numer_palety}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TableOutlined />
              Szczegóły
            </span>
          } 
          key="details"
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Numer palety" span={1}>
              <Text strong>{paleta.numer_palety}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={paleta.status === 'aktywna' ? 'green' : 'default'}>
                {paleta.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kierunek układania" span={1}>
              {paleta.kierunek || 'standardowy'}
            </Descriptions.Item>
            <Descriptions.Item label="Typ palety" span={1}>
              <Tag>{paleta.typ || 'EURO'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ilość formatek" span={1}>
              <Space>
                <Text strong>{totalSztuk} szt.</Text>
                {paleta.formatki_szczegoly && (
                  <Text type="secondary">({paleta.formatki_szczegoly.length} typów)</Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Wysokość stosu" span={1}>
              <Space>
                <Text strong>{paleta.wysokosc_stosu} mm</Text>
                <Text type="secondary">({liczbaPoziomow} poziomów × {gruboscPlyty}mm)</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Waga" span={1}>
              {paleta.waga_kg ? `${paleta.waga_kg} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Wykorzystanie" span={1}>
              {paleta.procent_wykorzystania ? (
                <Tag color={paleta.procent_wykorzystania > 80 ? 'green' : 'orange'}>
                  {paleta.procent_wykorzystania}%
                </Tag>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Kolory na palecie" span={2}>
              {paleta.kolory_na_palecie ? (
                <Space wrap>
                  {paleta.kolory_na_palecie.split(',').map(kolor => (
                    <Tag key={kolor} color="blue">{kolor.trim()}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">Brak informacji o kolorach</Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          {paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 24 }}>
                Formatki na palecie
              </Typography.Title>
              <Table
                dataSource={formatkiTableData}
                columns={[
                  {
                    title: 'Nazwa',
                    dataIndex: 'nazwa',
                    key: 'nazwa',
                  },
                  {
                    title: 'Wymiary',
                    dataIndex: 'wymiary',
                    key: 'wymiary',
                  },
                  {
                    title: 'Ilość',
                    dataIndex: 'ilosc',
                    key: 'ilosc',
                    render: (val) => <Text strong>{val} szt.</Text>
                  },
                  {
                    title: 'Kolor',
                    dataIndex: 'kolor',
                    key: 'kolor',
                    render: (val) => <Tag>{val}</Tag>
                  },
                  {
                    title: 'Udział',
                    dataIndex: 'procent',
                    key: 'procent',
                    render: (val) => `${val}%`
                  }
                ]}
                pagination={false}
                size="small"
              />
            </>
          )}

          {!paleta.formatki_szczegoly && paleta.formatki_ids && paleta.formatki_ids.length > 0 && (
            <Descriptions.Item label="ID formatek" span={2}>
              <Text code>{paleta.formatki_ids.join(', ')}</Text>
            </Descriptions.Item>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BoxPlotOutlined />
              Wizualizacja
            </span>
          } 
          key="visualization"
        >
          {paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0 ? (
            <PaletaVisualizer
              formatki={paleta.formatki_szczegoly}
              gruboscDefault={gruboscPlyty}
              maxWysokoscDefault={1440}
            />
          ) : (
            <Alert
              message="Brak danych do wizualizacji"
              description="Ta paleta nie ma szczegółowych informacji o formatkach potrzebnych do wizualizacji."
              type="info"
              showIcon
            />
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};
