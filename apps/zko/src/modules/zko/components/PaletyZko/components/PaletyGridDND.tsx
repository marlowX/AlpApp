/**
 * @fileoverview Grid z paletami z obsługą DRAG & DROP - ulepszona wizualizacja
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
        image={<InboxOutlined style={{ fontSize: 48, color: colors.borderBase }} />}
        description={
          <Space direction="vertical" size={dimensions.spacingXs}>
            <Text>Brak palet</Text>
            <Text style={{ fontSize: dimensions.fontSizeSmall, color: colors.textSecondary }}>
              Utwórz nową paletę aby rozpocząć paletyzację
            </Text>
          </Space>
        }
        style={{ padding: `${dimensions.spacingXl * 2}px 0` }}
      />
    );
  }

  // Oblicz statystyki dla każdej grupy
  const calculateGroupStats = (grupaPalet: Paleta[]) => {
    const totalFormatki = grupaPalet.reduce((sum, p) => sum + (p.ilosc_formatek || 0), 0);
    const totalWaga = grupaPalet.reduce((sum, p) => sum + (p.waga_kg || 0), 0);
    const avgFill = grupaPalet.reduce((sum, p) => {
      const maxWaga = p.max_waga_kg || 700;
      return sum + ((p.waga_kg || 0) / maxWaga) * 100;
    }, 0) / grupaPalet.length;

    return { totalFormatki, totalWaga, avgFill };
  };

  return (
    <div className="palety-grid">
      {/* Minimalistyczna instrukcja */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: dimensions.spacingSm,
        padding: dimensions.spacingSm,
        background: colors.bgSecondary,
        borderRadius: dimensions.buttonBorderRadius,
        marginBottom: dimensions.spacingMd,
        fontSize: dimensions.fontSizeSmall,
        color: colors.textSecondary
      }}>
        <DragOutlined style={{ fontSize: dimensions.iconSizeSmall }} />
        <Text style={{ fontSize: dimensions.fontSizeSmall }}>
          Przeciągnij formatki na palety
        </Text>
        <InfoCircleOutlined style={{ 
          fontSize: dimensions.iconSizeSmall, 
          marginLeft: 'auto',
          cursor: 'help' 
        }} />
      </div>

      {/* Grupy palet */}
      {sortedPrzeznaczenia.map(przeznaczenie => {
        const paletyGrupy = paletyByPrzeznaczenie[przeznaczenie];
        if (!paletyGrupy || paletyGrupy.length === 0) return null;

        const config = przeznaczeniaConfig[przeznaczenie] || { color: colors.borderBase, icon: '📋' };
        const stats = calculateGroupStats(paletyGrupy);

        return (
          <div key={przeznaczenie} style={{ 
            marginBottom: dimensions.spacingLg,
            padding: dimensions.spacingMd,
            background: colors.bgPrimary,
            borderRadius: dimensions.cardBorderRadius,
            border: `1px solid ${colors.borderLight}`
          }}>
            {/* Nagłówek grupy */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: dimensions.spacingMd,
              paddingBottom: dimensions.spacingSm,
              borderBottom: `1px solid ${colors.borderLight}`
            }}>
              <Space size={dimensions.spacingSm}>
                <span style={{ fontSize: dimensions.fontSizeLarge }}>{config.icon}</span>
                <Title level={5} style={{ 
                  margin: 0, 
                  fontSize: dimensions.fontSizeBase,
                  fontWeight: dimensions.fontWeightBold 
                }}>
                  {przeznaczenie}
                </Title>
                <Tag 
                  color={config.color}
                  style={{ 
                    margin: 0,
                    fontSize: dimensions.fontSizeSmall,
                    padding: `0 ${dimensions.spacingSm}px`,
                    height: 20,
                    lineHeight: '20px'
                  }}
                >
                  {paletyGrupy.length} {paletyGrupy.length === 1 ? 'paleta' : 'palet'}
                </Tag>
              </Space>

              {/* Statystyki grupy */}
              <Space size={dimensions.spacingMd} style={{ fontSize: dimensions.fontSizeSmall }}>
                <Text type="secondary">
                  <strong>{stats.totalFormatki}</strong> formatek
                </Text>
                <Text type="secondary">
                  <strong>{stats.totalWaga.toFixed(1)}</strong> kg
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: dimensions.spacingXs }}>
                  <Progress 
                    percent={Math.round(stats.avgFill)}
                    size="small"
                    style={{ width: 60 }}
                    strokeColor={styleHelpers.getCompletionColor(stats.avgFill)}
                    showInfo={false}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {Math.round(stats.avgFill)}%
                  </Text>
                </div>
              </Space>
            </div>

            {/* Palety */}
            <Row gutter={[dimensions.spacingSm, dimensions.spacingSm]}>
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