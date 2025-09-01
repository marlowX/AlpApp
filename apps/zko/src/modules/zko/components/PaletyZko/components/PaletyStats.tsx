/**
 * @fileoverview Komponent wyświetlający statystyki palet
 * @module PaletyZko/components/PaletyStats
 */

import React from 'react';
import { Row, Col, Statistic, Card, Progress, Space, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  InboxOutlined,
  ColumnHeightOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { PodsumowaniePalet, PRZEZNACZENIE_PALETY } from '../types';
import { formatujWage, formatujProcent, formatujPrzeznaczenie, getIkonaPrzeznaczenia } from '../utils';

const { Text } = Typography;

interface PaletyStatsProps {
  podsumowanie: PodsumowaniePalet;
  statystykiFormatek?: {
    liczbaFormatek: number;
    sztukiTotal: number;
    sztukiDostepne: number;
    sztukiNaPaletach: number;
    liczbaKolorow: number;
    wagaTotal: number;
  };
}

export const PaletyStats: React.FC<PaletyStatsProps> = ({ 
  podsumowanie, 
  statystykiFormatek 
}) => {
  const getPrzeznaczenieTags = () => {
    if (!podsumowanie.po_przeznaczeniu) return null;
    
    return Object.entries(podsumowanie.po_przeznaczeniu).map(([przezn, dane]) => {
      const przeznaczenie = przezn as keyof typeof PRZEZNACZENIE_PALETY;
      return (
        <Tag key={przeznaczenie} color="blue">
          {getIkonaPrzeznaczenia(przeznaczenie)} {formatujPrzeznaczenie(przeznaczenie)}: {dane.liczba_palet}
        </Tag>
      );
    });
  };

  // Bezpieczne pobieranie wartości
  const wagaTotal = podsumowanie?.waga_total || 0;
  const procentWagi = podsumowanie?.procent_wykorzystania_wagi || 0;
  const procentWysokosci = podsumowanie?.procent_wykorzystania_wysokosci || 0;

  return (
    <Card size="small" style={{ marginTop: 8 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Liczba palet"
            value={podsumowanie?.liczba_palet || 0}
            prefix={<AppstoreOutlined />}
            suffix={podsumowanie?.liczba_palet === 1 ? 'paleta' : 'palet'}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Formatki na paletach"
            value={podsumowanie?.sztuk_total || 0}
            prefix={<InboxOutlined />}
            suffix="szt."
          />
          {statystykiFormatek && statystykiFormatek.sztukiDostepne > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Dostępne: {statystykiFormatek.sztukiDostepne} szt.
            </Text>
          )}
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Łączna waga"
            value={formatujWage(wagaTotal)}  // POPRAWIONE - przekazujemy liczbę, nie obiekt
            prefix={<ColumnHeightOutlined />}
          />
          <Progress 
            percent={Math.round(procentWagi)} 
            size="small"
            strokeColor={procentWagi > 90 ? '#ff4d4f' : '#1890ff'}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Wykorzystanie"
            value={formatujProcent(Math.max(procentWagi, procentWysokosci))}
            prefix={<ThunderboltOutlined />}
          />
          <Space size={4} wrap>
            {getPrzeznaczenieTags()}
          </Space>
        </Col>
      </Row>
      
      {statystykiFormatek && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space wrap>
              <Tag color="green">
                Formatki: {statystykiFormatek.liczbaFormatek} typów
              </Tag>
              <Tag color="blue">
                Kolory: {statystykiFormatek.liczbaKolorow}
              </Tag>
              <Tag color={statystykiFormatek.sztukiDostepne > 0 ? 'orange' : 'default'}>
                Do rozplanowania: {statystykiFormatek.sztukiDostepne} szt.
              </Tag>
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );
};
