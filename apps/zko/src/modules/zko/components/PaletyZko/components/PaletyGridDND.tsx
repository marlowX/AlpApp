/**
 * @fileoverview Grid palet z drag & drop
 * @module PaletyZko/components/PaletyGridDND
 */

import React from 'react';
import { useDrop } from 'react-dnd';
import { Row, Col, Empty } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { PaletaCardDND } from './PaletaCardDND';
import { Paleta, ItemTypes } from '../types';

interface PaletyGridDNDProps {
  palety: Paleta[];
  onEdit?: (paleta: Paleta) => void;
  onDelete?: (paletaId: number) => void;
  onClose?: (paletaId: number) => void;
  onPrint?: (paletaId: number) => void;
  onShowDetails?: (paletaId: number) => void;
  onDropFormatka?: (formatka: any, ilosc: number, paletaId: number) => void;
  onDropToEmptyArea?: (formatka: any, ilosc: number) => void;
  deleting?: Set<number>;
  closing?: Set<number>;
}

export const PaletyGridDND: React.FC<PaletyGridDNDProps> = ({
  palety,
  onEdit,
  onDelete,
  onClose,
  onPrint,
  onShowDetails,
  onDropFormatka,
  onDropToEmptyArea,
  deleting = new Set(),
  closing = new Set()
}) => {
  // Setup drop dla pustego obszaru
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.FORMATKA,
    drop: (item: any, monitor) => {
      // Sprawdź czy nie upuszczono na paletę
      if (!monitor.didDrop() && onDropToEmptyArea) {
        onDropToEmptyArea(item.formatka, item.ilosc);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  if (!palety || palety.length === 0) {
    return (
      <div 
        ref={drop}
        className={`empty-pallets-drop-area ${isOver ? 'drag-over' : ''}`}
        style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `3px dashed ${isOver ? '#1890ff' : '#e8e8e8'}`,
          borderRadius: '8px',
          background: isOver ? '#e6f7ff' : '#fafafa',
          transition: 'all 0.3s',
          position: 'relative'
        }}
      >
        {isOver && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1890ff',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
          }}>
            📦 Upuść tutaj aby utworzyć nową paletę
          </div>
        )}
        <Empty
          image={<InboxOutlined style={{ fontSize: 48, color: isOver ? '#1890ff' : '#d9d9d9' }} />}
          description={
            <span style={{ color: isOver ? '#1890ff' : '#8c8c8c' }}>
              {isOver ? 'Upuść formatkę tutaj' : 'Brak palet - przeciągnij formatkę'}
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div ref={drop} style={{ position: 'relative', minHeight: '200px' }}>
      <Row gutter={[12, 12]}>
        {palety.map(paleta => (
          <Col key={paleta.id} xs={24} sm={12} lg={8} xl={6}>
            <PaletaCardDND
              paleta={paleta}
              onEdit={onEdit}
              onDelete={onDelete}
              onClose={onClose}
              onPrint={onPrint}
              onShowDetails={onShowDetails}
              onDropFormatka={onDropFormatka}
              deleting={deleting.has(paleta.id)}
              closing={closing.has(paleta.id)}
            />
          </Col>
        ))}
      </Row>
      
      {/* Obszar dla nowych palet gdy przeciągamy */}
      {isOver && palety.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '20px',
          border: '2px dashed #1890ff',
          borderRadius: '8px',
          background: '#e6f7ff',
          textAlign: 'center',
          transition: 'all 0.3s'
        }}>
          <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <div style={{ marginTop: '8px', color: '#1890ff', fontWeight: 'bold' }}>
            Upuść tutaj aby utworzyć nową paletę
          </div>
        </div>
      )}
    </div>
  );
};