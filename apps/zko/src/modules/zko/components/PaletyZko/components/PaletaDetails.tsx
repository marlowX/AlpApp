/**
 * @fileoverview Komponent szczegółów palety
 * @module PaletyZko/components/PaletaDetails
 */

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  Button,
  Divider,
  Progress,
  Badge,
  Timeline,
  Empty
} from 'antd';
import {
  InboxOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Paleta, FormatkaZIloscia } from '../types';
import {
  formatujNumerPalety,
  formatujPrzeznaczenie,
  getIkonaPrzeznaczenia,
  formatujStatus,
  getKolorStatusu,
  formatujWage,
  formatujWysokosc,
  formatujDate,
  formatujWymiary,
  formatujKolor,
  getKolorHex,
  formatujPowierzchnie,
  obliczWageSztuki
} from '../utils';

const { Title, Text } = Typography;
const { Column } = Table;

interface PaletaDetailsProps {
  paletaId: number;
  onClose: () => void;
}

// Używamy proxy z Vite - /api jest przekierowane na localhost:5001
const API_URL = '/api';

export const PaletaDetails: React.FC<PaletaDetailsProps> = ({
  paletaId,
  onClose
}) => {
  const [paleta, setPaleta] = useState<Paleta | null>(null);
  const [historia, setHistoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Pobierz szczegóły palety - używamy endpointu /pallets/:id
        const paletaResponse = await axios.get(`${API_URL}/pallets/${paletaId}`);
        if (paletaResponse.data.sukces || paletaResponse.data) {
          setPaleta(paletaResponse.data.data || paletaResponse.data);
        }

        // Pobierz historię palety - może nie istnieć
        try {
          const historiaResponse = await axios.get(`${API_URL}/pallets/${paletaId}/historia`);
          if (historiaResponse.data.sukces) {
            setHistoria(historiaResponse.data.data || []);
          }
        } catch (err) {
          // Historia może nie być dostępna
          console.log('Historia palety niedostępna');
        }
      } catch (error) {
        console.error('Błąd pobierania szczegółów palety:', error);
      } finally {
        setLoading(false);
      }
    };

    if (paletaId) {
      fetchDetails();
    }
  }, [paletaId]);

  if (loading) {
    return (
      <Drawer
        title="Ładowanie..."
        placement="right"
        onClose={onClose}
        open={true}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      </Drawer>
    );
  }

  if (!paleta) {
    return (
      <Drawer
        title="Błąd"
        placement="right"
        onClose={onClose}
        open={true}
        width={800}
      >
        <Empty description="Nie znaleziono palety" />
      </Drawer>
    );
  }

  const maxWaga = paleta.max_waga_kg || 700;
  const maxWysokosc = paleta.max_wysokosc_mm || 1440;
  const procentWagi = (paleta.waga_kg / maxWaga) * 100;
  const procentWysokosci = (paleta.wysokosc_stosu / maxWysokosc) * 100;

  return (
    <Drawer
      title={
        <Space>
          <InboxOutlined />
          <Text strong>Szczegóły palety</Text>
          <Tag color={getKolorStatusu(paleta.status)}>
            {formatujStatus(paleta.status)}
          </Tag>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={true}
      width={800}
      extra={
        <Space>
          <Button type="primary">Edytuj</Button>
          <Button>Drukuj etykietę</Button>
        </Space>
      }
    >
      {/* Podstawowe informacje */}
      <Descriptions
        title="Informacje podstawowe"
        bordered
        column={{ xs: 1, sm: 2 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Numer palety">
          <Text strong>{formatujNumerPalety(paleta.numer_palety)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Typ palety">
          {paleta.typ_palety || 'EURO'}
        </Descriptions.Item>
        <Descriptions.Item label="Przeznaczenie">
          <Tag color="blue">
            {getIkonaPrzeznaczenia(paleta.przeznaczenie)} {formatujPrzeznaczenie(paleta.przeznaczenie)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="ZKO">
          ZKO-{paleta.zko_id}
        </Descriptions.Item>
        <Descriptions.Item label="Pozycja">
          {paleta.pozycja_id ? `Poz. ${paleta.pozycja_id}` : paleta.pozycje_lista || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Lokalizacja">
          <Space>
            <EnvironmentOutlined />
            {paleta.lokalizacja_aktualna || 'Nieznana'}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* Parametry palety */}
      <Title level={5} style={{ marginBottom: 16 }}>Parametry palety</Title>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Waga: {formatujWage(paleta.waga_kg)} / {formatujWage(maxWaga)}</Text>
            <Text type={procentWagi > 90 ? 'danger' : undefined}>
              {Math.round(procentWagi)}%
            </Text>
          </div>
          <Progress
            percent={Math.round(procentWagi)}
            strokeColor={procentWagi > 90 ? '#ff4d4f' : procentWagi > 70 ? '#faad14' : '#52c41a'}
            showInfo={false}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Wysokość: {formatujWysokosc(paleta.wysokosc_stosu)} / {formatujWysokosc(maxWysokosc)}</Text>
            <Text type={procentWysokosci > 90 ? 'danger' : undefined}>
              {Math.round(procentWysokosci)}%
            </Text>
          </div>
          <Progress
            percent={Math.round(procentWysokosci)}
            strokeColor={procentWysokosci > 90 ? '#ff4d4f' : procentWysokosci > 70 ? '#faad14' : '#52c41a'}
            showInfo={false}
          />
        </div>

        <Space>
          <Tag icon={<InboxOutlined />}>
            {paleta.sztuk_total || paleta.ilosc_formatek || 0} formatek
          </Tag>
          {paleta.powierzchnia_m2 && (
            <Tag>
              {formatujPowierzchnie(paleta.powierzchnia_m2)}
            </Tag>
          )}
          {paleta.kolory_na_palecie && (
            <Tag>
              Kolory: {paleta.kolory_na_palecie.split(',').length}
            </Tag>
          )}
        </Space>
      </Space>

      {/* Formatki na palecie */}
      <Divider>Formatki na palecie</Divider>
      {paleta.formatki_szczegoly && paleta.formatki_szczegoly.length > 0 ? (
        <Table
          dataSource={paleta.formatki_szczegoly}
          rowKey={(record, index) => `${record.formatka_id || record.id}-${index}`}
          size="small"
          pagination={false}
          style={{ marginBottom: 24 }}
        >
          <Column
            title="Wymiary"
            key="wymiary"
            render={(_, record: any) => (
              <Text>{formatujWymiary(
                record.dlugosc || record.wymiar_x || 0,
                record.szerokosc || record.wymiar_y || 0
              )}</Text>
            )}
          />
          <Column
            title="Kolor"
            dataIndex="kolor"
            key="kolor"
            render={(kolor: string) => kolor ? (
              <Badge color={getKolorHex(kolor)} text={formatujKolor(kolor)} />
            ) : '-'}
          />
          <Column
            title="Ilość"
            key="ilosc"
            render={(_, record: any) => (
              <Tag color="green">{record.ilosc || record.ilosc_na_palecie || 0} szt.</Tag>
            )}
          />
          <Column
            title="Płyta"
            dataIndex="nazwa_plyty"
            key="nazwa_plyty"
            render={(nazwa: string) => nazwa || '-'}
          />
          <Column
            title="Pozycja"
            dataIndex="pozycja_id"
            key="pozycja_id"
            render={(id: number) => id ? `Poz. ${id}` : '-'}
          />
        </Table>
      ) : (
        <Empty description="Brak formatek na palecie" style={{ marginBottom: 24 }} />
      )}

      {/* Daty i osoby */}
      <Divider>Informacje czasowe</Divider>
      <Descriptions column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label={<><CalendarOutlined /> Data utworzenia</>}>
          {formatujDate(paleta.created_at)}
        </Descriptions.Item>
        <Descriptions.Item label={<><UserOutlined /> Utworzył</>}>
          {paleta.utworzyl || 'System'}
        </Descriptions.Item>
        {paleta.data_pakowania && (
          <Descriptions.Item label={<><ClockCircleOutlined /> Data pakowania</>}>
            {formatujDate(paleta.data_pakowania)}
          </Descriptions.Item>
        )}
        {paleta.operator_pakujacy && (
          <Descriptions.Item label={<><UserOutlined /> Operator pakujący</>}>
            {paleta.operator_pakujacy}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Historia zmian */}
      {historia.length > 0 && (
        <>
          <Divider>Historia zmian</Divider>
          <Timeline style={{ marginTop: 16 }}>
            {historia.map((wpis, index) => (
              <Timeline.Item
                key={index}
                color={wpis.akcja === 'utworzenie' ? 'green' : wpis.akcja === 'usuniecie' ? 'red' : 'blue'}
              >
                <Space direction="vertical" size={0}>
                  <Text strong>{wpis.akcja}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatujDate(wpis.data_zmiany)} - {wpis.operator}
                  </Text>
                  {wpis.opis && <Text>{wpis.opis}</Text>}
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}

      {/* Uwagi */}
      {paleta.uwagi && (
        <>
          <Divider>Uwagi</Divider>
          <Text>{paleta.uwagi}</Text>
        </>
      )}
    </Drawer>
  );
};