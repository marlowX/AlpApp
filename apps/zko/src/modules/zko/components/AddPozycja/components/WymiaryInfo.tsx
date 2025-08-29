import React, { useMemo } from 'react';
import { Card, Space, Tag, Tooltip, Badge, Alert, Divider } from 'antd';
import { 
  ExpandOutlined,
  CompressOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { KolorPlyty, Plyta, Rozkroj } from '../types';

const { Text } = Typography;
import { Typography } from 'antd';

interface WymiaryInfoProps {
  plyty: Plyta[];
  kolorePlyty: KolorPlyty[];
  rozkroj: Rozkroj | null;
}

interface WymiaryGrupa {
  dlugosc: number;
  szerokosc: number;
  plyty: Array<{plyta: Plyta, ilosc: number}>;
  grubosci: Set<number>;
}

// Komponent pojedynczej grupy wymiarowej
const WymiarGrupaCard: React.FC<{
  wymiarKey: string;
  grupa: WymiaryGrupa;
  totalSztuk: number;
}> = ({ wymiarKey, grupa, totalSztuk }) => {
  
  return (
    <Card 
      key={wymiarKey} 
      size="small"
      style={{ 
        backgroundColor: '#f6ffed',
        border: `1px solid #b7eb8f`
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center" size="large">
          <Badge 
            count={totalSztuk} 
            style={{ backgroundColor: '#52c41a' }}
            showZero
          >
            <Tag 
              color="processing" 
              style={{ fontSize: '14px', padding: '4px 12px' }}
            >
              {grupa.dlugosc} x {grupa.szerokosc} mm
            </Tag>
          </Badge>
          
          {grupa.grubosci.size > 1 && (
            <Tooltip title="Różne grubości płyt">
              <Tag color="orange" icon={<InfoCircleOutlined />}>
                Grubości: {Array.from(grupa.grubosci).join(', ')} mm
              </Tag>
            </Tooltip>
          )}
        </Space>
        
        <Divider style={{ margin: '8px 0' }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {grupa.plyty.map((item, idx) => (
            <Tooltip 
              key={idx}
              title={
                <Space direction="vertical" size="small">
                  <Text style={{ color: 'white' }}>
                    {item.plyta.nazwa}
                  </Text>
                  <Text style={{ color: 'white' }}>
                    Grubość: {item.plyta.grubosc}mm
                  </Text>
                  <Text style={{ color: 'white' }}>
                    Stan: {item.plyta.stan_magazynowy} szt.
                  </Text>
                </Space>
              }
            >
              <Tag 
                color="blue"
                style={{ margin: 0 }}
              >
                <Space size={4}>
                  <Text>{item.plyta.kolor_nazwa}</Text>
                  <Badge count={item.ilosc} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              </Tag>
            </Tooltip>
          ))}
        </div>
      </Space>
    </Card>
  );
};

export const WymiaryInfo: React.FC<WymiaryInfoProps> = ({ plyty, kolorePlyty, rozkroj }) => {
  
  const wymiaryAnaliza = useMemo(() => {
    const wybranePlyty = kolorePlyty
      .filter(k => k.kolor)
      .map(k => plyty.find(p => p.kolor_nazwa === k.kolor))
      .filter(Boolean) as Plyta[];
    
    if (wybranePlyty.length === 0) return null;
    
    const grupy = new Map<string, WymiaryGrupa>();
    
    wybranePlyty.forEach((plyta, index) => {
      const key = `${plyta.dlugosc || 0}x${plyta.szerokosc || 0}`;
      const ilosc = kolorePlyty[index].ilosc || 1;
      
      if (!grupy.has(key)) {
        grupy.set(key, {
          dlugosc: plyta.dlugosc || 0,
          szerokosc: plyta.szerokosc || 0,
          plyty: [],
          grubosci: new Set()
        });
      }
      
      const grupa = grupy.get(key)!;
      grupa.plyty.push({ plyta, ilosc });
      grupa.grubosci.add(plyta.grubosc);
    });
    
    let rozmiarRozkroju = null;
    
    if (rozkroj?.rozmiar_plyty) {
      const match = rozkroj.rozmiar_plyty.match(/(\d+)x(\d+)/);
      if (match) {
        rozmiarRozkroju = {
          dlugosc: parseInt(match[1]),
          szerokosc: parseInt(match[2])
        };
      }
    }
    
    return {
      grupy: Array.from(grupy.entries()),
      wszystkieTeSame: grupy.size === 1,
      rozmiarRozkroju
    };
  }, [plyty, kolorePlyty, rozkroj]);
  
  if (!wymiaryAnaliza) return null;
  
  const { grupy, wszystkieTeSame, rozmiarRozkroju } = wymiaryAnaliza;
  
  return (
    <Card 
      size="small" 
      title={
        <Space>
          <ExpandOutlined />
          <Text strong>Analiza wymiarów płyt</Text>
          {wszystkieTeSame ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Jednolite wymiary
            </Tag>
          ) : (
            <Tag color="warning" icon={<WarningOutlined />}>
              Różne wymiary
            </Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {rozmiarRozkroju && (
        <Alert
          message={
            <Space>
              <CompressOutlined />
              <Text>Rozkrój wymaga płyt o wymiarach: </Text>
              <Tag color="blue">
                {rozmiarRozkroju.dlugosc} x {rozmiarRozkroju.szerokosc} mm
              </Tag>
            </Space>
          }
          type="info"
          style={{ marginBottom: 12 }}
        />
      )}
      
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {grupy.map(([key, grupa]) => {
          const totalSztuk = grupa.plyty.reduce((sum, p) => sum + p.ilosc, 0);
          return (
            <WymiarGrupaCard
              key={key}
              wymiarKey={key}
              grupa={grupa}
              totalSztuk={totalSztuk}
            />
          );
        })}
      </Space>
      
      {!wszystkieTeSame && (
        <Alert
          message="Uwaga: Różne wymiary płyt"
          description={
            <Space direction="vertical">
              <Text>Wybrane płyty mają różne wymiary. Upewnij się, że rozkrój jest odpowiedni dla wszystkich formatów płyt.</Text>
              <Text type="secondary">• Operator powinien być poinformowany o zmianie formatu</Text>
              <Text type="secondary">• Maszyna musi być przygotowana na zmianę wymiarów</Text>
            </Space>
          }
          type="warning"
          icon={<WarningOutlined />}
          style={{ marginTop: 12 }}
          showIcon
        />
      )}
    </Card>
  );
};