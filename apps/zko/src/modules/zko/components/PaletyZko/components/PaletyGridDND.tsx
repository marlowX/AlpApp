/**
 * @fileoverview Grid z paletami z obsługą DRAG & DROP
 * @module PaletyZko/components/PaletyGridDND
 */

import React from 'react';
import { Row, Col, Empty, Typography, Alert, Space } from 'antd';
import { InboxOutlined, DragOutlined } from '@ant-design/icons';
import { PaletaCardDND } from './PaletaCardDND';
import { Paleta, Formatka } from '../types';

const { Title } = Typography;

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

  const przeznaczeniaOrder = ['MAGAZYN', 'CIECIE', 'OKLEINIARKA', 'WIERCENIE', 'WYSYLKA'];

  if (palety.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48 }} />}
        description={
          <div>
            <p>Brak palet</p>
            <p style={{ fontSize: 12, color: '#999' }}>
              Utwórz nową paletę aby rozpocząć paletyzację
            </p>
          </div>
        }
        style={{ padding: '40px 0' }}
      />
    );
  }

  return (
    <div className="palety-grid">
      {/* Instrukcja drag & drop */}
      <Alert
        message={
          <Space>
            <DragOutlined />
            <span>Przeciągnij formatki z zakładki "Formatki" na palety poniżej</span>
          </Space>
        }
        type="info"
        closable
        style={{ marginBottom: 16 }}
      />

      {/* Grupy palet */}
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
