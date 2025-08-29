import React from 'react';
import { InputNumber, Space, Typography, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { KolorPlyty } from '../types';

const { Text } = Typography;

interface IloscColumnProps {
  kolor: KolorPlyty;
  index: number;
  maxPlyt: number;
  onUpdateKolor: (index: number, field: string, value: any) => void;
}

export const IloscColumn: React.FC<IloscColumnProps> = ({
  kolor,
  index,
  maxPlyt,
  onUpdateKolor
}) => {
  const stanMagazynowy = kolor?.stan_magazynowy || 0;
  const currentValue = kolor?.ilosc || 1;
  const hasError = currentValue > stanMagazynowy;
  const exceedsLimit = currentValue > maxPlyt;
  
  // Rzeczywiste maksimum to najmniejsza wartość z:
  // 1. Globalnego limitu dla tego koloru (maxPlyt)
  // 2. Stanu magazynowego
  const realMax = Math.min(maxPlyt, stanMagazynowy);
  
  return (
    <div>
      <InputNumber
        min={1}
        max={realMax}
        value={currentValue}
        onChange={(value) => onUpdateKolor(index, 'ilosc', value || 1)}
        style={{ 
          width: '100%',
          borderColor: (hasError || exceedsLimit || maxPlyt === 0) ? '#ff4d4f' : undefined
        }}
        status={hasError || exceedsLimit ? 'error' : undefined}
        disabled={!kolor?.kolor}
        size="small"
      />
      <div style={{ marginTop: 4 }}>
        {!kolor?.kolor ? (
          <Text type="secondary" style={{ fontSize: '10px' }}>
            Wybierz płytę
          </Text>
        ) : (
          <Space direction="vertical" size={0}>
            {maxPlyt === 0 ? (
              <Tooltip title="Osiągnięto globalny limit 5 płyt w pozycji">
                <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                  <ExclamationCircleOutlined /> Brak miejsca!
                </Text>
              </Tooltip>
            ) : (
              <>
                <Text style={{ fontSize: '10px', color: '#666' }}>
                  Limit: {maxPlyt} | Dostępne: {stanMagazynowy}
                </Text>
                {realMax < currentValue && (
                  <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                    ⚠️ Max: {realMax} szt!
                  </Text>
                )}
                {hasError && (
                  <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                    ⚠️ Przekroczono stan!
                  </Text>
                )}
                {exceedsLimit && (
                  <Text style={{ fontSize: '10px', color: '#ff4d4f' }}>
                    ⚠️ Przekroczono limit!
                  </Text>
                )}
              </>
            )}
          </Space>
        )}
      </div>
    </div>
  );
};