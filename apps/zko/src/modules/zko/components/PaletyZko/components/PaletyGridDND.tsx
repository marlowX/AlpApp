/**
 * @fileoverview Grid z paletami z obsługą DRAG & DROP - poprawiona wizualizacja
 * @module PaletyZko/components/PaletyGridDND
 */

import React from 'react';
import { Row, Col, Empty, Typography, Space, Tag, Progress } from 'antd';
import { InboxOutlined, DragOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PaletaCardDND } from './PaletaCardDND';
import { Paleta, Formatka } from '../types';
import { colors, dimensions, styleHelpers } from '../styles/theme';

const { Title, Text } = Typography;

interface PaletyGridDNDProps {
  palety: Paleta[];
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (id: number) => void;
  onClose?: (id: number) => void;
  onPrint?: (id: number) => void;
  onShowDetails?: (id: number) => void;
  onDropFormatka?: (formatka: Formatka, ilosc: number, targetPaletaId: number) => void;
  deleting?: number | null;
  closing?: number | null;
}

export const PaletyGridDND: React.FC<PaletyGridDNDProps> = ({
  palety,
  onEdit,
  onDelete,
  onClose,
  onPrint,
  onShowDetails,
  onDropFormatka,
  deleting,
  closing
}) => {
  // Grupuj palety po przeznaczeniu
  const paletyByPrzeznaczenie = palety.reduce((acc, paleta) => {
    const przezn = paleta.przeznaczenie || 'MAGAZYN';
    if (!acc[przezn]) {
      acc[przezn] = [];
    }
    acc[przezn].push(paleta);
    return acc;
  }, {} as Record<string, Paleta[]>);

  const przeznaczeniaConfig = {
    'MAGAZYN': { color: '#52c41a', icon: '📦', order: 1 },
    'CIECIE': { color: '#fa8c16', icon: '✂️', order: 2 },
    'OKLEINIARKA': { color: '#1890ff', icon: '🔧', order: 3 },
    'WIERCENIE': { color: '#722ed1', icon: '🔨', order: 4 },
    'WYSYLKA': { color: '#eb2f96', icon: '🚚', order: 5 }
  };

  const sortedPrzeznaczenia = Object.keys(paletyByPrzeznaczenie).sort(
    (a, b) => (przeznaczeniaConfig[a]?.order || 99) - (przeznaczeniaConfig[b]?.order || 99)
  );

  if (palety.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        description={
          <Space direction="vertical" size={4}>
            <Text style={{ color: '#8c8c8c' }}>Brak palet</Text>
            <Text style={{ fontSize: 11, color: '#bfbfbf' }}>
              Utwórz nową paletę aby rozpocząć paletyzację
            </Text>
          </Space>
        }
        style={{ padding: '60px 0' }}
      />
    );
  }

  // Oblicz statystyki dla każdej grupy - z obsługą błędów
  const calculateGroupStats = (grupaPalet: Paleta[]) => {
    let totalFormatki = 0;
    let totalWaga = 0;
    let sumFill = 0;
    
    grupaPalet.forEach(p => {
      totalFormatki += Number(p.ilosc_formatek || 0);
      totalWaga += Number(p.waga_kg || 0);
      const maxWaga = Number(p.max_waga_kg || 700);
      const waga = Number(p.waga_kg || 0);
      sumFill += (waga / maxWaga) * 100;
    });
    
    const avgFill = grupaPalet.length > 0 ? sumFill / grupaPalet.length : 0;

    return { 
      totalFormatki, 
      totalWaga,
      avgFill 
    };
  };

  return (
    <div className="palety-grid">
      {/* Minimalistyczna instrukcja */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 4,
        marginBottom: 12,
        fontSize: 12,
        color: '#8c8c8c'
      }}>
        <DragOutlined style={{ fontSize: 14, color: '#1890ff' }} />
        <Text style={{ fontSize: 12, color: '#595959' }}>
          Przeciągnij formatki na palety
        </Text>
        <InfoCircleOutlined style={{ 
          fontSize: 12, 
          marginLeft: 'auto',
          cursor: 'help',
          color: '#1890ff'
        }} />
      </div>

      {/* Grupy palet */}
      {sortedPrzeznaczenia.map(przeznaczenie => {
        const paletyGrupy = paletyByPrzeznaczenie[przeznaczenie];
        if (!paletyGrupy || paletyGrupy.length === 0) return null;

        const config = przeznaczeniaConfig[przeznaczenie] || { color: '#d9d9d9', icon: '📋' };
        const stats = calculateGroupStats(paletyGrupy);

        return (
          <div key={przeznaczenie} style={{ 
            marginBottom: 16,
            padding: 12,
            background: '#ffffff',
            borderRadius: 6,
            border: '1px solid #f0f0f0'
          }}>
            {/* Nagłówek grupy - kompaktowy */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <Space size={6}>
                <span style={{ fontSize: 14 }}>{config.icon}</span>
                <Text strong style={{ 
                  fontSize: 13,
                  color: '#262626'
                }}>
                  {przeznaczenie}
                </Text>
                <Tag 
                  style={{ 
                    margin: 0,
                    fontSize: 11,
                    padding: '0 6px',
                    height: 18,
                    lineHeight: '18px',
                    background: '#f0f0f0',
                    border: 'none',
                    color: '#595959'
                  }}
                >
                  {paletyGrupy.length}
                </Tag>
              </Space>

              {/* Statystyki grupy - minimalistyczne */}
              <Space size={12} style={{ fontSize: 11 }}>
                <Text style={{ color: '#8c8c8c' }}>
                  <strong style={{ color: '#595959' }}>{stats.totalFormatki}</strong> szt
                </Text>
                <Text style={{ color: '#8c8c8c' }}>
                  <strong style={{ color: '#595959' }}>{stats.totalWaga.toFixed(1)}</strong> kg
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Progress 
                    percent={Math.round(stats.avgFill)}
                    size="small"
                    style={{ width: 50 }}
                    strokeColor={
                      stats.avgFill >= 75 ? '#52c41a' : 
                      stats.avgFill >= 50 ? '#1890ff' : 
                      '#d9d9d9'
                    }
                    showInfo={false}
                  />
                  <Text style={{ 
                    fontSize: 10, 
                    color: stats.avgFill >= 75 ? '#52c41a' : '#8c8c8c'
                  }}>
                    {Math.round(stats.avgFill)}%
                  </Text>
                </div>
              </Space>
            </div>

            {/* Palety */}
            <Row gutter={[8, 8]}>
              {paletyGrupy.map(paleta => (
                <Col key={paleta.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <PaletaCardDND
                    paleta={paleta}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClose={onClose}
                    onPrint={onPrint}
                    onShowDetails={onShowDetails}
                    onDropFormatka={onDropFormatka}
                    deleting={deleting === paleta.id}
                    closing={closing === paleta.id}
                  />
                </Col>
              ))}
            </Row>
          </div>
        );
      })}
    </div>
  );
};