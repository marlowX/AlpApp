import React, { useMemo } from 'react';
import { Table, Button, Tag, Tooltip, Space, Typography, Switch } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
// ZMIANA: Importujemy nowy komponent z prawdziwym Select
import { PlytaSelectV3 } from './PlytaSelectV3';
import { PlytySelectorV2 } from './PlytySelectorV2';
import { WymiaryColumn } from './components/WymiaryColumn';
import { ParametryColumn } from './components/ParametryColumn';
import { IloscColumn } from './components/IloscColumn';
import type { KolorPlyty, Plyta } from './types';

const { Text } = Typography;

interface KolorePlytyTableProps {
  kolorePlyty: KolorPlyty[];
  plyty: Plyta[];
  plytyLoading?: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  onUpdateKolor: (index: number, field: string, value: any) => void;
  onRemoveKolor: (index: number) => void;
  maxPlytNaPozycje?: number;
}

export const KolorePlytyTable: React.FC<KolorePlytyTableProps> = ({
  kolorePlyty,
  plyty,
  plytyLoading = false,
  searchText,
  onSearchChange,
  onUpdateKolor,
  onRemoveKolor,
  maxPlytNaPozycje = 5
}) => {
  // Stan do przełączania między starym a nowym selektorem
  const [useNewSelector, setUseNewSelector] = React.useState(true);

  const totalPlyty = kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  const przekroczonyLimit = totalPlyty > maxPlytNaPozycje;

  const wymiaryAnaliza = useMemo(() => {
    const wybranePlyty = kolorePlyty
      .filter(k => k.kolor)
      .map(k => {
        const plyta = plyty.find(p => p.kolor_nazwa === k.kolor);
        return plyta ? { ...plyta, ilosc: k.ilosc } : null;
      })
      .filter(Boolean) as (Plyta & { ilosc: number })[];
    
    if (wybranePlyty.length === 0) return { wszystkieTeSame: true, grupy: new Map() };
    
    const grupy = new Map<string, number>();
    wybranePlyty.forEach(plyta => {
      const key = `${plyta.dlugosc || 0}x${plyta.szerokosc || 0}`;
      grupy.set(key, (grupy.get(key) || 0) + 1);
    });
    
    return {
      wszystkieTeSame: grupy.size === 1,
      grupy,
      najczestszyRozmiar: grupy.size > 0 ? 
        Array.from(grupy.entries()).sort((a, b) => b[1] - a[1])[0][0] : null
    };
  }, [kolorePlyty, plyty]);

  const getMaxPlytForColor = (kolor: string, currentIndex: number): number => {
    const plyta = plyty.find(p => p.kolor_nazwa === kolor);
    const gruboscLimit = plyta && plyta.grubosc >= 18 ? 5 : 50;
    
    const plytyInneKolory = kolorePlyty.reduce((sum, k, idx) => {
      if (idx === currentIndex) return sum;
      return sum + (k.ilosc || 0);
    }, 0);
    
    const pozostalo = maxPlytNaPozycje - plytyInneKolory;
    return Math.min(gruboscLimit, Math.max(0, pozostalo));
  };

  const handlePlytaChange = (index: number, plyta: Plyta | null) => {
    if (plyta) {
      const updatedKolor = {
        kolor: plyta.kolor_nazwa,
        nazwa: plyta.nazwa,
        ilosc: kolorePlyty[index]?.ilosc || 1,
        plyta_id: plyta.id,
        stan_magazynowy: plyta.stan_magazynowy,
        grubosc: plyta.grubosc,
        dlugosc: plyta.dlugosc,
        szerokosc: plyta.szerokosc
      };
      onUpdateKolor(index, '__FULL_UPDATE__', updatedKolor);
    } else {
      const clearedKolor = {
        kolor: '',
        nazwa: '',
        ilosc: 1,
        plyta_id: undefined,
        stan_magazynowy: undefined,
        grubosc: undefined,
        dlugosc: undefined,
        szerokosc: undefined
      };
      onUpdateKolor(index, '__FULL_UPDATE__', clearedKolor);
    }
  };

  const columns = [
    {
      title: (
        <Space>
          <InfoCircleOutlined />
          Wybór płyty
        </Space>
      ),
      dataIndex: 'kolor',
      key: 'kolor',
      width: '40%',
      render: (_: any, __: any, index: number) => (
        useNewSelector ? (
          <PlytaSelectV3
            plyty={plyty}
            loading={plytyLoading}
            value={kolorePlyty[index]?.kolor}
            onChange={(plyta) => handlePlytaChange(index, plyta)}
            placeholder={`Wybierz płytę dla pozycji ${index + 1}`}
          />
        ) : (
          <PlytySelectorV2
            plyty={plyty}
            loading={plytyLoading}
            value={kolorePlyty[index]?.kolor}
            onChange={(plyta) => handlePlytaChange(index, plyta)}
            placeholder={`Wybierz płytę dla pozycji ${index + 1}`}
          />
        )
      ),
    },
    {
      title: 'Wymiary',
      dataIndex: 'wymiary',
      key: 'wymiary',
      width: '20%',
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        const plyta = plyty.find(p => p.kolor_nazwa === kolor?.kolor);
        return (
          <WymiaryColumn 
            kolor={kolor}
            plyta={plyta}
            wymiaryAnaliza={wymiaryAnaliza}
          />
        );
      },
    },
    {
      title: 'Parametry',
      dataIndex: 'parametry',
      key: 'parametry',
      width: '20%',
      render: (_: any, __: any, index: number) => (
        <ParametryColumn kolor={kolorePlyty[index]} />
      ),
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc',
      key: 'ilosc',
      width: '15%',
      render: (_: any, __: any, index: number) => {
        const kolor = kolorePlyty[index];
        const maxPlyt = kolor?.kolor ? getMaxPlytForColor(kolor.kolor, index) : maxPlytNaPozycje;
        return (
          <>
            <IloscColumn
              kolor={kolor}
              index={index}
              maxPlyt={maxPlyt}
              onUpdateKolor={onUpdateKolor}
            />
            {kolor?.kolor && maxPlyt === 0 && (
              <Text type="danger" style={{ fontSize: '10px' }}>
                Brak miejsca!
              </Text>
            )}
          </>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: '5%',
      render: (_: any, __: any, index: number) => (
        <div style={{ textAlign: 'center' }}>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemoveKolor(index)}
            disabled={kolorePlyty.length === 1}
            title={kolorePlyty.length === 1 ? 
              "Musi zostać przynajmniej jedna pozycja" : "Usuń pozycję"}
          />
          <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
            #{index + 1}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text strong style={{ fontSize: '14px' }}>Kolory płyt do rozkroju</Text>
          {przekroczonyLimit && (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              PRZEKROCZONY LIMIT!
            </Tag>
          )}
        </Space>
        
        {/* Przełącznik między starym a nowym selektorem - tylko do testów */}
        <Space style={{ fontSize: '11px' }}>
          <Text type="secondary">Typ selektora:</Text>
          <Switch
            checkedChildren="Select"
            unCheckedChildren="Custom"
            checked={useNewSelector}
            onChange={setUseNewSelector}
            size="small"
          />
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={kolorePlyty.map((item, index) => ({ ...item, key: index }))}
        pagination={false}
        size="small"
        locale={{ emptyText: 'Brak wybranych płyt' }}
        style={{ overflow: 'hidden' }}
        bordered
      />
      
      <TableFooter 
        kolorePlyty={kolorePlyty}
        wymiaryAnaliza={wymiaryAnaliza}
        totalPlyty={totalPlyty}
        maxPlytNaPozycje={maxPlytNaPozycje}
        przekroczonyLimit={przekroczonyLimit}
      />
    </div>
  );
};

// Podkomponent stopki tabeli
const TableFooter: React.FC<{
  kolorePlyty: KolorPlyty[];
  wymiaryAnaliza: any;
  totalPlyty: number;
  maxPlytNaPozycje: number;
  przekroczonyLimit: boolean;
}> = ({ kolorePlyty, wymiaryAnaliza, totalPlyty, maxPlytNaPozycje, przekroczonyLimit }) => {
  if (kolorePlyty.length === 0) return null;
  
  return (
    <div style={{ 
      marginTop: 8, 
      padding: '6px 8px', 
      backgroundColor: przekroczonyLimit ? '#fff2f0' : '#fafafa',
      borderRadius: 4,
      border: przekroczonyLimit ? '1px solid #ffccc7' : '1px solid #f0f0f0',
      fontSize: '11px'
    }}>
      <Space split="|">
        <Text style={{ fontSize: '11px' }}>
          Pozycji: {kolorePlyty.length}
        </Text>
        <Text 
          style={{ 
            fontSize: '11px',
            color: przekroczonyLimit ? '#ff4d4f' : undefined,
            fontWeight: przekroczonyLimit ? 'bold' : 'normal'
          }}
        >
          Łącznie płyt: {totalPlyty}/{maxPlytNaPozycje}
        </Text>
        <Text style={{ fontSize: '11px' }}>
          Wymiarów: {wymiaryAnaliza.grupy.size}
        </Text>
      </Space>
    </div>
  );
};
