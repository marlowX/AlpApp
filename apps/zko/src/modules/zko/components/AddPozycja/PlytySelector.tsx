import React from 'react';
import { Select, Input, Badge, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Plyta, PlytyQueryParams } from './types';

const { Option } = Select;
const { Text } = Typography;
const { Search } = Input;

interface PlytySelectorProps {
  plyty: Plyta[];
  loading?: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const PlytySelector: React.FC<PlytySelectorProps> = ({
  plyty,
  loading = false,
  searchText,
  onSearchChange,
  value,
  onChange,
  placeholder = "Wybierz kolor płyty"
}) => {
  
  const renderPlytyOptions = () => {
    const filteredPlyty = plyty.filter(plyta => 
      plyta.opis.toLowerCase().includes(searchText.toLowerCase()) ||
      plyta.kolor_nazwa.toLowerCase().includes(searchText.toLowerCase()) ||
      plyta.nazwa.toLowerCase().includes(searchText.toLowerCase())
    );

    return filteredPlyty.map(plyta => (
      <Option key={plyta.id} value={plyta.kolor_nazwa}>
        <div style={{ padding: '8px 4px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start' 
          }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ color: '#1890ff' }}>
                {plyta.kolor_nazwa}
              </Text>
              {plyta.struktura === 1 && (
                <Tag size="small" color="gold" style={{ marginLeft: 4 }}>
                  STRUKTURA
                </Tag>
              )}
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {plyta.nazwa} • {plyta.grubosc}mm
              </Text>
              <br />
              <Text style={{ fontSize: '10px', color: '#52c41a' }}>
                {plyta.opis}
              </Text>
            </div>
            <div style={{ textAlign: 'right', minWidth: '60px' }}>
              <Badge 
                count={plyta.stan_magazynowy} 
                overflowCount={999}
                style={{ 
                  backgroundColor: plyta.stan_magazynowy > 20 ? '#52c41a' : 
                                   plyta.stan_magazynowy > 5 ? '#faad14' : '#ff4d4f' 
                }}
              />
              <br />
              <Text style={{ fontSize: '9px' }}>szt.</Text>
            </div>
          </div>
        </div>
      </Option>
    ));
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Search
          placeholder="Szukaj w opisie płyt..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ marginBottom: 8 }}
          size="small"
          allowClear
          prefix={<SearchOutlined />}
        />
      </div>
      <Select
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        loading={loading}
        showSearch
        filterOption={false}
        dropdownStyle={{ maxHeight: 400 }}
        dropdownMatchSelectWidth={false}
      >
        {renderPlytyOptions()}
      </Select>
    </div>
  );
};
