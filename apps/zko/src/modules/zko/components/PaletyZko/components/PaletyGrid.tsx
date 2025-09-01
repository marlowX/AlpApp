/**
 * @fileoverview Grid z paletami
 * @module PaletyZko/components/PaletyGrid
 */

import React from 'react';
import { Row, Col, Empty, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { PaletaCard } from './PaletaCard';
import { Paleta, Formatka } from '../types';

const { Title } = Typography;

interface PaletyGridProps {
  palety: Paleta[];
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (id: number) => void;
  onClose?: (id: number) => void;
  onShowDetails?: (id: number) => void;
  onDropFormatka?: (formatka: Formatka, ilosc: number, targetPaletaId: number) => void;
  deleting?: number | null;
}

export const PaletyGrid: React.FC<PaletyGridProps> = ({
  palety,
  onEdit,
  onDelete,
  onClose,
  onShowDetails,
  onDropFormatka,
  deleting
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

  const przeznaczeniaOrder = ['MAGAZYN', 'CIECIE', 'OKLEINIARKA', 'WIERCENIE', 'WYSYLKA'];

  if (palety.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48 }} />}
        description="Brak palet"
        style={{ padding: '40px 0' }}
      />
    );
  }

  return (
    <div className="palety-grid">
      {przeznaczeniaOrder.map(przeznaczenie => {
        const paletyGrupy = paletyByPrzeznaczenie[przeznaczenie];
        if (!paletyGrupy || paletyGrupy.length === 0) return null;

        return (
          <div key={przeznaczenie} style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              {przeznaczenie} ({paletyGrupy.length})
            </Title>
            <Row gutter={[16, 16]}>
              {paletyGrupy.map(paleta => (
                <Col key={paleta.id} xs={24} sm={12} md={8} lg={6}>
                  <PaletaCard
                    paleta={paleta}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClose={onClose}
                    onShowDetails={onShowDetails}
                    onDropFormatka={onDropFormatka}
                    deleting={deleting === paleta.id}
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
