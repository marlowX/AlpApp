import React from 'react';
import { Select, Typography } from 'antd';
import type { Rozkroj } from './types';

const { Option } = Select;
const { Text } = Typography;

interface RozkrojSelectorProps {
  rozkroje: Rozkroj[];
  loading?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}

export const RozkrojSelector: React.FC<RozkrojSelectorProps> = ({
  rozkroje,
  loading = false,
  value,
  onChange,
  placeholder = "Wybierz rozkrój"
}) => {
  
  return (
    <Select
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      showSearch
      optionFilterProp="children"
      loading={loading}
      dropdownMatchSelectWidth={false}
      style={{ width: '100%' }}
    >
      {rozkroje.map(rozkroj => (
        <Option key={rozkroj.id} value={rozkroj.id}>
          <div style={{ padding: '8px 4px' }}>
            <Text strong>{rozkroj.kod_rozkroju}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {rozkroj.opis}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Płyta: {rozkroj.rozmiar_plyty}
            </Text>
          </div>
        </Option>
      ))}
    </Select>
  );
};
