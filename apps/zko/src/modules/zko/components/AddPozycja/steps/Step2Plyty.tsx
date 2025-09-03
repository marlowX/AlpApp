import React, { useMemo, useState } from 'react';
import { Card, Space, Button, Typography, Badge, Tag, Collapse, Tooltip, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined,
  BgColorsOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  UpOutlined,
  ExclamationCircleOutlined  // DODANY BRAKUJĄCY IMPORT
} from '@ant-design/icons';
import { KolorePlytyTable } from '../KolorePlytyTable';
import type { KolorPlyty, Plyta, Rozkroj } from '../types';

const { Text } = Typography;

interface Step2PlytyProps {
  kolorePlyty: KolorPlyty[];
  setKolorePlyty: (value: KolorPlyty[]) => void;
  plyty: Plyta[];
  plytyLoading: boolean;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  selectedRozkroj: Rozkroj | null;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Step2Plyty: React.FC<Step2PlytyProps> = ({
  kolorePlyty,
  setKolorePlyty,
  plyty,
  plytyLoading,
  onUpdateKolor,
  selectedRozkroj,
  onNext,
  onPrev
}) => {
  const MAX_PLYT_NA_POZYCJE = 5;
  const [analizaExpanded, setAnalizaExpanded] = useState(false);
  
  const addKolorPlyty = () => {
    setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }]);
  };

  const removeKolorPlyty = (index: number) => {
    if (kolorePlyty.length > 1) {
      setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
    }
  };

  const hasAnySelected = kolorePlyty.some(k => k.kolor);
  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  
  const totalFormatki = selectedRozkroj ? 
    kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      return total + selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
    }, 0) : 0;

  const maRozneWymiary = useMemo(() => {
    const wybranePlyty = kolorePlyty
      .filter(k => k.kolor)
      .map(k => plyty.find(p => p.kolor_nazwa === k.kolor))
      .filter(Boolean) as Plyta[];
    
    if (wybranePlyty.length <= 1) return false;
    
    const pierwszyRozmiar = `${wybranePlyty[0].dlugosc}x${wybranePlyty[0].szerokosc}`;
    return wybranePlyty.some(p => `${p.dlugosc}x${p.szerokosc}` !== pierwszyRozmiar);
  }, [kolorePlyty, plyty]);

  const przekroczonyLimit = totalPlyty > MAX_PLYT_NA_POZYCJE;

  return (
    <div>
      {/* Nagłówek z informacją o rozkroju */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        background: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #d9d9d9'
      }}>
        {selectedRozkroj && (
          <>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: '14px' }}>
                Wybrany rozkrój: {selectedRozkroj.kod_rozkroju}
              </Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {selectedRozkroj.rozmiar_plyty}
              </Tag>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                {selectedRozkroj.formatki.length} formatek w rozkroju
              </Text>
            </div>
            
            {/* Lista formatek w rozkroju */}
            <div style={{ fontSize: '11px', color: '#666' }}>
              <Text type="secondary">
                Formatki: {selectedRozkroj.formatki.map(f => 
                  `${f.dlugosc}×${f.szerokosc} (${f.ilosc_sztuk} szt.)`
                ).join(' • ')}
              </Text>
            </div>
            
            {/* Podsumowanie */}
            {hasAnySelected && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e8e8e8' }}>
                <Space split={"|"} style={{ fontSize: '12px' }}>
                  <Text>
                    Łącznie płyt: <Badge 
                      count={`${totalPlyty}/${MAX_PLYT_NA_POZYCJE}`} 
                      style={{ 
                        backgroundColor: przekroczonyLimit ? '#ff4d4f' : '#52c41a',
                        marginLeft: 4
                      }}
                    />
                  </Text>
                  <Text>
                    Formatek do produkcji: <strong>{totalFormatki}</strong>
                  </Text>
                </Space>
              </div>
            )}
          </>
        )}
      </div>

      {/* Analiza wymiarów - zwinięta domyślnie */}
      {hasAnySelected && (
        <div 
          style={{ 
            marginBottom: 16,
            padding: '8px 12px',
            background: maRozneWymiary ? '#fff2f0' : '#f6ffed',
            borderRadius: '4px',
            border: `1px solid ${maRozneWymiary ? '#ffccc7' : '#b7eb8f'}`,
            cursor: 'pointer'
          }}
          onClick={() => setAnalizaExpanded(!analizaExpanded)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              {maRozneWymiary ? (
                <>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <Text style={{ fontSize: '12px', color: '#ff4d4f' }}>
                    Różne wymiary płyt
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                    Jednolite wymiary
                  </Text>
                </>
              )}
            </Space>
            {analizaExpanded ? <UpOutlined /> : <DownOutlined />}
          </div>
          
          {analizaExpanded && (
            <div style={{ marginTop: 8, fontSize: '11px', paddingLeft: 20 }}>
              {maRozneWymiary ? (
                <>
                  <div>• Rozkrój musi być uniwersalny dla wszystkich wymiarów</div>
                  <div>• Maszyna wymaga przygotowania na zmianę formatu</div>
                  <div>• Operator musi być poinformowany</div>
                </>
              ) : (
                <div>Wszystkie wybrane płyty mają te same wymiary - OK</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabela kolorów płyt */}
      <KolorePlytyTable
        kolorePlyty={kolorePlyty}
        plyty={plyty}
        plytyLoading={plytyLoading}
        searchText=""
        onSearchChange={() => {}}
        onUpdateKolor={onUpdateKolor}
        onRemoveKolor={removeKolorPlyty}
        maxPlytNaPozycje={MAX_PLYT_NA_POZYCJE}
      />

      <Button
        type="dashed"
        onClick={addKolorPlyty}
        icon={<PlusOutlined />}
        style={{ width: '100%', marginTop: 12 }}
        disabled={przekroczonyLimit}
      >
        Dodaj kolejny kolor płyty
      </Button>

      {/* Ostrzeżenie o przekroczonym limicie */}
      {przekroczonyLimit && (
        <div style={{ 
          marginTop: 12,
          padding: '8px 12px', 
          background: '#ffebe8',
          borderRadius: '4px',
          border: '1px solid #ffccc7',
          fontSize: '12px',
          color: '#ff4d4f'
        }}>
          <ExclamationCircleOutlined style={{ marginRight: 6 }} />
          <strong>Przekroczono limit!</strong> Zmniejsz ilość płyt o {totalPlyty - MAX_PLYT_NA_POZYCJE} szt.
        </div>
      )}
    </div>
  );
};