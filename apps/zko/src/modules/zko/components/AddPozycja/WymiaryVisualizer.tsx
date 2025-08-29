import React from 'react';
import { Card, Tag, Space, Typography, Progress, Tooltip, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined,
  ExpandOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { Plyta, KolorPlyty } from './types';

const { Text } = Typography;

interface WymiaryVisualizerProps {
  plyty: Plyta[];
  kolorePlyty: KolorPlyty[];
  rozmiarRozkroju?: string;
}

export const WymiaryVisualizer: React.FC<WymiaryVisualizerProps> = ({
  plyty,
  kolorePlyty,
  rozmiarRozkroju
}) => {
  // Przygotuj dane do wizualizacji
  const wymiary = React.useMemo(() => {
    const result = new Map<string, {
      dlugosc: number;
      szerokosc: number;
      count: number;
      plyty: Array<{ nazwa: string; kolor: string; ilosc: number }>;
      totalSztuk: number;
    }>();
    
    kolorePlyty.forEach(kolorPlyty => {
      if (!kolorPlyty.kolor) return;
      
      const plyta = plyty.find(p => p.kolor_nazwa === kolorPlyty.kolor);
      if (!plyta) return;
      
      const key = `${plyta.dlugosc || 0}x${plyta.szerokosc || 0}`;
      
      if (!result.has(key)) {
        result.set(key, {
          dlugosc: plyta.dlugosc || 0,
          szerokosc: plyta.szerokosc || 0,
          count: 0,
          plyty: [],
          totalSztuk: 0
        });
      }
      
      const grupa = result.get(key)!;
      grupa.count++;
      grupa.totalSztuk += kolorPlyty.ilosc;
      grupa.plyty.push({
        nazwa: plyta.nazwa,
        kolor: plyta.kolor_nazwa,
        ilosc: kolorPlyty.ilosc
      });
    });
    
    return Array.from(result.entries()).sort((a, b) => b[1].totalSztuk - a[1].totalSztuk);
  }, [plyty, kolorePlyty]);
  
  if (wymiary.length === 0) return null;
  
  const wszystkieTeSame = wymiary.length === 1;
  const maxSztuk = Math.max(...wymiary.map(([_, g]) => g.totalSztuk));
  
  // Sprawdź zgodność z rozkrojem
  const rozkrojWymiary = rozmiarRozkroju?.match(/(\d+)x(\d+)/);
  const expectedSize = rozkrojWymiary ? {
    dlugosc: parseInt(rozkrojWymiary[1]),
    szerokosc: parseInt(rozkrojWymiary[2])
  } : null;
  
  return (
    <Card 
      size="small"
      title={
        <Space>
          <ExpandOutlined />
          <Text>Wizualizacja wymiarów</Text>
          {wszystkieTeSame ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Jednolite
            </Tag>
          ) : (
            <Tag color="warning" icon={<WarningOutlined />}>
              {wymiary.length} różne
            </Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {wymiary.map(([key, grupa]) => {
          const procent = (grupa.totalSztuk / maxSztuk) * 100;
          const zgodnyZRozkrojem = expectedSize && (
            (grupa.dlugosc === expectedSize.dlugosc && grupa.szerokosc === expectedSize.szerokosc) ||
            (grupa.dlugosc === expectedSize.szerokosc && grupa.szerokosc === expectedSize.dlugosc)
          );
          
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <Space align="center" style={{ marginBottom: 4 }}>
                <Badge count={grupa.totalSztuk} style={{ backgroundColor: '#52c41a' }}>
                  <Tag 
                    color={zgodnyZRozkrojem === false ? 'error' : 'blue'}
                    style={{ fontSize: '13px' }}
                  >
                    {grupa.dlugosc} × {grupa.szerokosc} mm
                  </Tag>
                </Badge>
                
                {zgodnyZRozkrojem === false && (
                  <Tooltip title="Niezgodny z rozkrojem!">
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                )}
                
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {grupa.count} {grupa.count === 1 ? 'kolor' : 'kolory'}
                </Text>
              </Space>
              
              <Progress 
                percent={procent} 
                size="small"
                strokeColor={zgodnyZRozkrojem === false ? '#ff4d4f' : '#1890ff'}
                format={() => `${grupa.totalSztuk} szt`}
              />
              
              <div style={{ marginTop: 4, paddingLeft: 8 }}>
                {grupa.plyty.map((p, idx) => (
                  <Tag 
                    key={idx} 
                    style={{ 
                      fontSize: '10px', 
                      marginBottom: 2,
                      marginRight: 4 
                    }}
                  >
                    {p.kolor} ({p.ilosc})
                  </Tag>
                ))}
              </div>
            </div>
          );
        })}
        
        {expectedSize && (
          <div style={{ 
            marginTop: 8, 
            padding: 8, 
            backgroundColor: '#f0f0f0',
            borderRadius: 4 
          }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <Text style={{ fontSize: '11px' }}>
                Rozkrój wymaga: <strong>{expectedSize.dlugosc} × {expectedSize.szerokosc} mm</strong>
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};