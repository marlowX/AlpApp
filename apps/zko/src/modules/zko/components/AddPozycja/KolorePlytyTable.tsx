import React, { useMemo } from 'react';
import { Table, Button, Card, Tag, Tooltip, Space, Typography, Badge } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
  maxPlytNaPozycje?: number; // Nowy prop dla globalnego limitu
}

export const KolorePlytyTable: React.FC<KolorePlytyTableProps> = ({
  kolorePlyty,
  plyty,
  plytyLoading = false,
  searchText,
  onSearchChange,
  onUpdateKolor,
  onRemoveKolor,
  maxPlytNaPozycje = 5 // Domyślnie 5
}) => {

  // Oblicz sumę wszystkich płyt
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
    
    // Oblicz ile płyt jest już w innych kolorach
    const plytyInneKolory = kolorePlyty.reduce((sum, k, idx) => {
      if (idx === currentIndex) return sum; // Pomiń aktualny kolor
      return sum + (k.ilosc || 0);
    }, 0);
    
    // Maksymalna ilość dla tego koloru to minimum z:
    // 1. Limitu grubości (5 lub 50)
    // 2. Pozostałej ilości do globalnego limitu
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
      width: '35%',
      render: (_: any, __: any, index: number) => (
        <PlytySelectorV2
          plyty={plyty}
          loading={plytyLoading}
          value={kolorePlyty[index]?.kolor}
          onChange={(plyta) => handlePlytaChange(index, plyta)}
          placeholder={`Wybierz płytę dla pozycji ${index + 1}`}
        />
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
      width: '15%',
      render: (_: any, __: any, index: number) => (
        <ParametryColumn kolor={kolorePlyty[index]} />
      ),
    },
    {
      title: 'Ilość płyt',
      dataIndex: 'ilosc',
      key: 'ilosc',
      width: '20%',
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
                Brak miejsca! Zmniejsz inne kolory.
              </Text>
            )}
          </>
        );
      },
    },
    {
      title: 'Akcje',
      key: 'actions',
      width: '10%',
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
    <Card 
      size="small" 
      title={
        <Space>
          <Text strong>Kolory płyt do rozkroju</Text>
          {przekroczonyLimit && (
            <Tooltip title={`Suma płyt (${totalPlyty}) przekracza limit ${maxPlytNaPozycje}!`}>
              <Tag color="error" icon={<ExclamationCircleOutlined />}>
                PRZEKROCZONY LIMIT!
              </Tag>
            </Tooltip>
          )}
          {!wymiaryAnaliza.wszystkieTeSame && wymiaryAnaliza.grupy.size > 1 && (
            <Tooltip title="Wybrane płyty mają różne wymiary">
              <Tag color="warning" icon={<WarningOutlined />}>
                {wymiaryAnaliza.grupy.size} różne wymiary
              </Tag>
            </Tooltip>
          )}
        </Space>
      }
      style={{ borderColor: przekroczonyLimit ? '#ff4d4f' : undefined }}
    >
      <Table
        columns={columns}
        dataSource={kolorePlyty.map((item, index) => ({ ...item, key: index }))}
        pagination={false}
        size="small"
        locale={{ emptyText: 'Brak wybranych płyt' }}
        style={{ overflow: 'hidden' }}
      />
      
      <TableFooter 
        kolorePlyty={kolorePlyty}
        wymiaryAnaliza={wymiaryAnaliza}
        totalPlyty={totalPlyty}
        maxPlytNaPozycje={maxPlytNaPozycje}
        przekroczonyLimit={przekroczonyLimit}
      />
    </Card>
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
      marginTop: 12, 
      padding: 8, 
      backgroundColor: przekroczonyLimit ? '#fff2f0' : '#fafafa',
      borderRadius: 4,
      border: przekroczonyLimit ? '1px solid #ffccc7' : undefined
    }}>
      <Space split="|">
        <Text style={{ fontSize: '12px' }}>
          <strong>Pozycji:</strong> {kolorePlyty.length}
        </Text>
        <Text 
          style={{ 
            fontSize: '12px',
            color: przekroczonyLimit ? '#ff4d4f' : undefined,
            fontWeight: przekroczonyLimit ? 'bold' : 'normal'
          }}
        >
          <strong>Łącznie płyt:</strong> {totalPlyty}/{maxPlytNaPozycje}
          {przekroczonyLimit && (
            <ExclamationCircleOutlined style={{ marginLeft: 4 }} />
          )}
        </Text>
        {wymiaryAnaliza.grupy.size > 0 && (
          <Text style={{ fontSize: '12px' }}>
            <strong>Wymiarów:</strong> {wymiaryAnaliza.grupy.size}
            {!wymiaryAnaliza.wszystkieTeSame && (
              <Tag color="warning" style={{ marginLeft: 4, fontSize: '10px' }}>
                RÓŻNE
              </Tag>
            )}
          </Text>
        )}
      </Space>
      {przekroczonyLimit && (
        <div style={{ marginTop: 8 }}>
          <Text type="danger" strong style={{ fontSize: '12px' }}>
            ⚠️ Zmniejsz ilość płyt o {totalPlyty - maxPlytNaPozycje} sztuk aby kontynuować!
          </Text>
        </div>
      )}
    </div>
  );
};