import React from 'react';
import { Card, Tag, Progress, Space, Tooltip, Button, Badge } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  InboxOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import type { ZKO } from '../../types';
import { statusColors, statusLabels, priorityColors } from '../../utils/constants';
import dayjs from 'dayjs';
import './ZKOListCard.css';

interface ZKOListCardProps {
  zko: any; // Używamy any bo dane mogą mieć dodatkowe pola ze statystykami
  onView: () => void;
  onWorkflow: () => void;
}

export const ZKOListCard: React.FC<ZKOListCardProps> = ({ zko, onView, onWorkflow }) => {
  // Oblicz postęp na podstawie statusu
  const calculateProgress = () => {
    const statusProgress: Record<string, number> = {
      'nowe': 0,
      'CIECIE_START': 15,
      'OTWARCIE_PALETY': 20,
      'PAKOWANIE_PALETY': 25,
      'ZAMKNIECIE_PALETY': 30,
      'CIECIE_STOP': 35,
      'BUFOR_OKLEINIARKA': 40,
      'OKLEJANIE_START': 50,
      'OKLEJANIE_STOP': 60,
      'BUFOR_WIERTARKA': 65,
      'WIERCENIE_START': 70,
      'WIERCENIE_STOP': 80,
      'PAKOWANIE_START': 85,
      'PAKOWANIE_STOP': 90,
      'WYSYLKA': 95,
      'ZAKONCZONE': 100,
    };
    return statusProgress[zko.status] || 0;
  };

  const progress = zko.procent_realizacji || calculateProgress();
  
  // Używamy prawdziwych danych jeśli są dostępne
  const stats = {
    pozycje: zko.pozycje_count || zko.pozycje?.length || 0,
    palety: zko.palety_count || zko.palety?.length || 0,
    formatki: zko.formatki_total || 0,
    plyty: zko.plyty_total || 0,
    waga: zko.waga_total ? Number(zko.waga_total).toFixed(1) : '0.0',
  };

  const getPriorityIcon = (priority: number) => {
    if (priority <= 2) return '🔴';
    if (priority <= 4) return '🟡';
    return '🟢';
  };

  const getStatusIcon = () => {
    if (zko.status.includes('CIECIE')) return <ScissorOutlined />;
    if (zko.status.includes('OKLEJANIE')) return <BgColorsOutlined />;
    if (zko.status.includes('PAKOWANIE')) return <InboxOutlined />;
    if (zko.status.includes('WIERCENIE')) return '🔧';
    if (zko.status === 'ZAKONCZONE') return '✅';
    return <FileTextOutlined />;
  };

  // Formatowanie daty
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return dayjs(date).format('DD.MM.YY');
  };

  return (
    <Card 
      className="zko-list-card"
      hoverable
      size="small"
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-title">
          <span className="zko-number">{zko.numer_zko}</span>
          <Tooltip title={`Priorytet: ${zko.priorytet}`}>
            <span className="priority-icon">{getPriorityIcon(zko.priorytet)}</span>
          </Tooltip>
        </div>
        <Tag color={statusColors[zko.status] || 'default'} className="status-tag">
          {getStatusIcon()} {statusLabels[zko.status] || zko.status}
        </Tag>
      </div>

      {/* Progress */}
      <div className="progress-section">
        <Progress 
          percent={Number(progress)} 
          size="small" 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      </div>

      {/* Info Grid */}
      <div className="info-grid">
        <div className="info-item">
          <TeamOutlined className="info-icon" />
          <div className="info-content">
            <span className="info-label">Kooperant</span>
            <span className="info-value">{zko.kooperant || '-'}</span>
          </div>
        </div>
        
        <div className="info-item">
          <CalendarOutlined className="info-icon" />
          <div className="info-content">
            <span className="info-label">Utworzono</span>
            <span className="info-value">{formatDate(zko.data_utworzenia)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Tooltip title="Pozycje">
          <div className="stat-item">
            <FileTextOutlined />
            <span>{stats.pozycje}</span>
          </div>
        </Tooltip>
        
        <Tooltip title="Palety">
          <div className="stat-item">
            <InboxOutlined />
            <span>{stats.palety}</span>
          </div>
        </Tooltip>
        
        <Tooltip title="Formatki">
          <div className="stat-item">
            <AppstoreOutlined />
            <span>{stats.formatki}</span>
          </div>
        </Tooltip>
        
        <Tooltip title="Płyty">
          <div className="stat-item">
            <span>📋</span>
            <span>{stats.plyty}</span>
          </div>
        </Tooltip>
        
        <Tooltip title={`Waga: ${stats.waga} kg`}>
          <div className="stat-item">
            <span>⚖️</span>
            <span>{stats.waga}</span>
          </div>
        </Tooltip>
      </div>

      {/* Actions */}
      <div className="card-actions">
        <Button 
          type="text" 
          size="small"
          icon={<EyeOutlined />}
          onClick={onView}
        >
          Szczegóły
        </Button>
        <Button 
          type="text" 
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={onWorkflow}
        >
          Workflow
        </Button>
      </div>
    </Card>
  );
};

export default ZKOListCard;