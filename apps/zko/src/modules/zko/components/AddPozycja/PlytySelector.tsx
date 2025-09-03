import React from 'react';
import { Select, Input, Badge, Tag, Typography, Row, Col } from 'antd';
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
        <div style={{ 
          padding: '4px 8px',
          borderBottom: '1px solid #f0f0f0',
          minWidth: '500px'  // Szerszy widok
        }}>
          <Row gutter={12} align="middle">
            {/* Główna nazwa - większa i bardziej widoczna */}
            <Col span={8}>
              <Text strong style={{ 
                color: '#262626',
                fontSize: '13px',
                display: 'block'
              }}>
                {plyta.kolor_nazwa}
              </Text>
              {plyta.struktura === 1 && (
                <Tag 
                  size="small" 
                  color="orange" 
                  style={{ 
                    fontSize: '10px',
                    padding: '0 4px',
                    height: '16px',
                    lineHeight: '16px'
                  }}
                >
                  STRUKTURA
                </Tag>
              )}
            </Col>
            
            {/* Informacje o płycie */}
            <Col span={10}>
              <Text style={{ 
                fontSize: '11px',
                color: '#595959',
                display: 'block'
              }}>
                {plyta.nazwa} • {plyta.grubosc}mm
              </Text>
              <Text style={{ 
                fontSize: '10px',
                color: '#8c8c8c',
                display: 'block'
              }}>
                {plyta.opis}
              </Text>
            </Col>
            
            {/* Stan magazynowy */}
            <Col span={6} style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: plyta.stan_magazynowy > 20 ? '#f6ffed' :
                          plyta.stan_magazynowy > 5 ? '#fffbe6' : '#fff1f0',
                padding: '2px 8px',
                borderRadius: '3px',
                border: `1px solid ${
                  plyta.stan_magazynowy > 20 ? '#b7eb8f' :
                  plyta.stan_magazynowy > 5 ? '#ffe58f' : '#ffa39e'
                }`
              }}>
                <Text strong style={{ 
                  fontSize: '12px',
                  color: plyta.stan_magazynowy > 20 ? '#52c41a' :
                         plyta.stan_magazynowy > 5 ? '#faad14' : '#ff4d4f'
                }}>
                  {plyta.stan_magazynowy}
                </Text>
                <Text style={{ 
                  fontSize: '9px',
                  color: '#8c8c8c'
                }}>
                  szt.
                </Text>
              </div>
            </Col>
          </Row>
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
        <Text type="secondary" style={{ fontSize: '11px' }}>
          💡 Wskazówka: Możesz wpisać wiele słów - zostaną wyszukane wszystkie pasujące płyty
        </Text>
      </div>
      <Select
        style={{ width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        loading={loading}
        showSearch
        filterOption={false}
        dropdownStyle={{ 
          maxHeight: 500,  // Wyższa lista
          minWidth: 600    // Szersza lista
        }}
        dropdownMatchSelectWidth={false}
        listHeight={450}  // Wysokość wewnętrznej listy
        optionLabelProp="children"
        getPopupContainer={(trigger) => trigger.parentElement || document.body}
      >
        {plyty.length > 0 ? (
          renderPlytyOptions()
        ) : (
          <Option disabled>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Brak płyt do wyboru
            </Text>
          </Option>
        )}
      </Select>
      
      {/* Informacja o liczbie dostępnych płyt */}
      {plyty.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: '10px' }}>
            Dostępnych {plyty.length} płyt. 
            {searchText && ` Znaleziono ${
              plyty.filter(plyta => 
                plyta.opis.toLowerCase().includes(searchText.toLowerCase()) ||
                plyta.kolor_nazwa.toLowerCase().includes(searchText.toLowerCase()) ||
                plyta.nazwa.toLowerCase().includes(searchText.toLowerCase())
              ).length
            } pasujących.`}
          </Text>
        </div>
      )}
    </div>
  );
};