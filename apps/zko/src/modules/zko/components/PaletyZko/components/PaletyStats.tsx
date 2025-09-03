/**
 * @fileoverview Komponent wyświetlający statystyki palet - wersja kompaktowa
 * @module PaletyZko/components/PaletyStats
 */

import React from 'react';
import { Space, Tag, Typography, Progress } from 'antd';
import {
  AppstoreOutlined,
  InboxOutlined,
  ColumnHeightOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { PodsumowaniePalet } from '../types';

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
  // Bezpieczne pobieranie wartości
  const liczba_palet = podsumowanie?.liczba_palet || 0;
  const sztuk_total = podsumowanie?.sztuk_total || 0;
  const wagaTotal = Number(podsumowanie?.waga_total || 0);
  const procentWagi = Number(podsumowanie?.procent_wykorzystania_wagi || 0);
  const dostepne = statystykiFormatek?.sztukiDostepne || 0;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* Lewa strona - główne statystyki */}
      <Space size="middle" wrap>
        {/* Liczba palet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AppstoreOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#595959' }}>Liczba palet</Text>
          <Text strong style={{ fontSize: '14px' }}>{liczba_palet}</Text>
          <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>
            {liczba_palet === 1 ? 'paleta' : 'palet'}
          </Text>
        </div>

        {/* Formatki na paletach */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <InboxOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#595959' }}>Formatki na paletach</Text>
          <Text strong style={{ fontSize: '14px' }}>{sztuk_total}</Text>
          <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>szt.</Text>
          {dostepne > 0 && (
            <Text style={{ fontSize: '11px', color: '#faad14' }}>
              Dostępne: {dostepne} szt.
            </Text>
          )}
        </div>

        {/* Łączna waga */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ColumnHeightOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#595959' }}>Łączna waga</Text>
          <Text strong style={{ fontSize: '14px' }}>{wagaTotal.toFixed(1)}</Text>
          <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>kg</Text>
        </div>

        {/* Wykorzystanie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ThunderboltOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#595959' }}>Wykorzystanie</Text>
          <Progress 
            percent={Math.round(procentWagi)} 
            size="small"
            style={{ width: '60px', margin: 0 }}
            strokeColor={procentWagi > 90 ? '#ff4d4f' : procentWagi > 70 ? '#faad14' : '#52c41a'}
            showInfo={false}
          />
          <Text strong style={{ fontSize: '12px' }}>{Math.round(procentWagi)}%</Text>
        </div>
      </Space>

      {/* Prawa strona - tagi */}
      {statystykiFormatek && (
        <Space size={4}>
          {statystykiFormatek.liczbaFormatek > 0 && (
            <Tag style={{ fontSize: '10px', margin: 0, padding: '0 4px', height: '18px', lineHeight: '18px' }}>
              {statystykiFormatek.liczbaFormatek} typów
            </Tag>
          )}
          {statystykiFormatek.liczbaKolorow > 0 && (
            <Tag style={{ fontSize: '10px', margin: 0, padding: '0 4px', height: '18px', lineHeight: '18px' }}>
              {statystykiFormatek.liczbaKolorow} kolorów
            </Tag>
          )}
          {dostepne > 0 && (
            <Tag color="orange" style={{ fontSize: '10px', margin: 0, padding: '0 4px', height: '18px', lineHeight: '18px' }}>
              Do rozplanowania: {dostepne}
            </Tag>
          )}
        </Space>
      )}
    </div>
  );
};