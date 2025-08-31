import React from 'react';
import { Card, Tag, Badge, Space, Typography, Progress, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  StopOutlined, 
  FileTextOutlined, 
  BoxPlotOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface Pozycja {
  id: number;
  numer_pozycji: number;
  nazwa_plyty: string;
  kolor_plyty: string;
  symbol_plyty: string;
  ilosc_plyt: number;
}

interface PozycjaStats {
  formatki_total: number;
  sztuk_planowanych: number;
  sztuk_w_paletach: number;
  sztuk_dostepnych: number;
  procent_zapaletyzowania: number;
}

interface PozycjaCardProps {
  pozycja: Pozycja;
  stats: PozycjaStats;
  isSelected: boolean;
  canBeSelected: boolean;
  onSelect: (pozycjaId: number) => void;
}

export const PozycjaCard: React.FC<PozycjaCardProps> = ({
  pozycja,
  stats,
  isSelected,
  canBeSelected,
  onSelect
}) => {
  const isFullyPalletized = stats.procent_zapaletyzowania === 100;
  const hasNoFormatki = stats.sztuk_dostepnych === 0 && stats.sztuk_planowanych === 0;

  const getKolorBadge = (kolor: string) => {
    const colors: Record<string, string> = {
      'LANCELOT': '#8B4513',
      'ARTISAN': '#D2691E', 
      'SONOMA': '#F4A460',
      'SUROWA': '#A0522D',
      'BIAŁY': '#F0F0F0',
      'CZARNY': '#000000'
    };
    
    const bgColor = colors[kolor?.toUpperCase()] || '#E0E0E0';
    const textColor = ['BIAŁY', 'SUROWA', 'SONOMA'].includes(kolor?.toUpperCase()) ? '#000' : '#FFF';
    
    return (
      <Tag 
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          border: `1px solid ${bgColor === '#F0F0F0' ? '#ccc' : bgColor}`,
          fontSize: '11px'
        }}
      >
        {kolor}
      </Tag>
    );
  };

  const formatNumber = (num: number): string => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toString();
  };

  return (
    <Card
      hoverable={canBeSelected}
      onClick={() => canBeSelected && onSelect(pozycja.id)}
      style={{
        borderColor: isSelected ? '#1890ff' : 
                    !canBeSelected ? '#ff4d4f' : undefined,
        borderWidth: isSelected || !canBeSelected ? 2 : 1,
        backgroundColor: !canBeSelected ? '#fff1f0' : 'white',
        cursor: canBeSelected ? 'pointer' : 'not-allowed',
        opacity: !canBeSelected ? 0.8 : 1,
        height: '100%'
      }}
      bodyStyle={{ padding: 12 }}
    >
      {/* Nagłówek z numerem pozycji */}
      <div style={{ marginBottom: 8 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          {/* NAPRAWIONE: Wyraźny numer pozycji */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge 
              count={pozycja.numer_pozycji} 
              style={{ 
                backgroundColor: isSelected ? '#1890ff' : '#52c41a',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />
            <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
              #{pozycja.numer_pozycji}
            </Text>
          </div>
          
          {/* Ikony stanu */}
          {isFullyPalletized && (
            <Tooltip title="Wszystkie formatki są już na paletach">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          )}
          {hasNoFormatki && (
            <Tooltip title="Brak formatek do zapaletyzowania">
              <StopOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Nazwa płyty */}
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12 }}>
          {pozycja.nazwa_plyty || pozycja.symbol_plyty}
        </Text>
      </div>

      {/* Kolor płyty */}
      <div style={{ marginBottom: 8 }}>
        {getKolorBadge(pozycja.kolor_plyty)}
      </div>

      {/* Statystyki formatek */}
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <FileTextOutlined /> Formatki:
            </Text>
            <Text style={{ fontSize: 11 }}>
              {formatNumber(stats.formatki_total)} typów
            </Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <BoxPlotOutlined /> Planowane:
            </Text>
            <Text style={{ fontSize: 11 }}>
              {formatNumber(stats.sztuk_planowanych)} szt.
            </Text>
          </div>

          {stats.sztuk_w_paletach > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                📦 Na paletach:
              </Text>
              <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
                {formatNumber(stats.sztuk_w_paletach)} szt.
              </Text>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              ⏳ Pozostało:
            </Text>
            <Text style={{ 
              fontSize: 11, 
              color: stats.sztuk_dostepnych > 0 ? '#1890ff' : '#ff4d4f',
              fontWeight: stats.sztuk_dostepnych === 0 ? 'bold' : 'normal'
            }}>
              {formatNumber(stats.sztuk_dostepnych)} szt.
            </Text>
          </div>
        </Space>
      </div>

      {/* Progress bar - tylko jeśli są planowane formatki */}
      {stats.sztuk_planowanych > 0 && (
        <Tooltip title={`Zapaletyzowano ${stats.procent_zapaletyzowania}%`}>
          <Progress 
            percent={stats.procent_zapaletyzowania || 0}
            size="small"
            showInfo={false}
            strokeColor={
              stats.procent_zapaletyzowania === 100 ? '#52c41a' :
              stats.procent_zapaletyzowania > 50 ? '#faad14' : '#1890ff'
            }
          />
        </Tooltip>
      )}

      {/* Tagi stanu */}
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        {isFullyPalletized && (
          <Tag color="success" style={{ margin: 0, fontSize: '10px' }}>
            ✅ W pełni zapaletyzowane
          </Tag>
        )}

        {hasNoFormatki && (
          <Tag color="error" style={{ margin: 0, fontSize: '10px' }}>
            ⛔ Brak formatek
          </Tag>
        )}

        {stats.sztuk_dostepnych === 0 && stats.sztuk_planowanych > 0 && !isFullyPalletized && (
          <Tag color="warning" style={{ margin: 0, fontSize: '10px' }}>
            ⚠️ 0 szt. do zapaletyzowania
          </Tag>
        )}

        {isSelected && canBeSelected && (
          <Tag color="blue" style={{ margin: 0, fontSize: '10px' }}>
            Wybrana pozycja
          </Tag>
        )}

        {!canBeSelected && !hasNoFormatki && (
          <Tooltip title="Wszystkie formatki są już przypisane do palet">
            <Tag color="default" style={{ margin: 0, cursor: 'help', fontSize: '10px' }}>
              Niedostępne do wyboru
            </Tag>
          </Tooltip>
        )}
      </div>
    </Card>
  );
};