/**
 * @fileoverview Selektor formatek - wersja bez drag & drop
 * @module PaletyZko/components/FormatkaSelector
 */

import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Badge,
  Empty,
  Row,
  Col,
  Button,
  Alert
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Formatka } from '../types';
import { formatujWymiary, formatujKolor, formatujWage, obliczWageSztuki } from '../utils';

const { Text, Title } = Typography;
const { Option } = Select;

interface FormatkaSelectorProps {
  formatki: Formatka[];
  loading?: boolean;
}

export const FormatkaSelector: React.FC<FormatkaSelectorProps> = ({
  formatki,
  loading = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterKolor, setFilterKolor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rozmiar' | 'ilosc' | 'kolor'>('rozmiar');

  // Filtrowanie i sortowanie
  const filteredFormatki = formatki
    .filter(f => {
      const matchSearch = !searchText || 
        formatujWymiary(f.wymiar_x, f.wymiar_y).includes(searchText) ||
        (f.numer_formatki && f.numer_formatki.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchKolor = filterKolor === 'all' || f.kolor === filterKolor;
      
      return matchSearch && matchKolor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rozmiar':
          return (b.wymiar_x * b.wymiar_y) - (a.wymiar_x * a.wymiar_y);
        case 'ilosc':
          return b.ilosc_dostepna - a.ilosc_dostepna;
        case 'kolor':
          return (a.kolor || '').localeCompare(b.kolor || '');
        default:
          return 0;
      }
    });

  // Unikalne kolory
  const uniqueKolory = Array.from(new Set(formatki.map(f => f.kolor).filter(Boolean)));

  // Statystyki
  const totalSztuk = formatki.reduce((sum, f) => sum + f.ilosc_dostepna, 0);
  const totalWaga = formatki.reduce((sum, f) => sum + (obliczWageSztuki(f) * f.ilosc_dostepna), 0);

  return (
    <div className="formatka-selector">
      {/* Nagłówek ze statystykami */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0 }}>
            <AppstoreOutlined /> Dostępne formatki ({formatki.length})
          </Title>
          <Space>
            <Tag color="green">{totalSztuk} szt.</Tag>
            <Tag color="blue">{formatujWage(totalWaga)}</Tag>
          </Space>
        </Space>
      </div>

      {/* Filtry */}
      <Space style={{ width: '100%', marginBottom: 16 }} wrap>
        <Input
          placeholder="Szukaj formatki..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        
        <Select
          value={filterKolor}
          onChange={setFilterKolor}
          style={{ width: 150 }}
          placeholder="Wszystkie kolory"
        >
          <Option value="all">Wszystkie kolory</Option>
          {uniqueKolory.map(kolor => (
            <Option key={kolor} value={kolor}>
              <Badge color={kolor} text={formatujKolor(kolor)} />
            </Option>
          ))}
        </Select>
        
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 150 }}
        >
          <Option value="rozmiar">Sortuj po rozmiarze</Option>
          <Option value="ilosc">Sortuj po ilości</Option>
          <Option value="kolor">Sortuj po kolorze</Option>
        </Select>
      </Space>

      {/* Informacja */}
      {totalSztuk > 0 && (
        <Alert
          message="Formatki dostępne do paletyzacji"
          description="Aby dodać formatki do palety, przejdź do zakładki 'Palety' i utwórz nową paletę lub edytuj istniejącą."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Lista formatek */}
      {loading ? (
        <Card loading style={{ marginTop: 16 }} />
      ) : filteredFormatki.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredFormatki.map(formatka => (
            <Col key={formatka.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                size="small"
                className="formatka-item"
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{formatujWymiary(formatka.wymiar_x, formatka.wymiar_y)}</Text>
                    <Badge color={formatka.kolor} text={formatujKolor(formatka.kolor)} />
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Nazwa:</Text>
                    <Text>{formatka.numer_formatki || 'FORMATKA'}</Text>
                  </Space>
                  
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Typ:</Text>
                    <Tag>{formatka.typ || 'formatka'}</Tag>
                  </Space>
                  
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Dostępne:</Text>
                    <Tag color="green">{formatka.ilosc_dostepna} szt.</Tag>
                  </Space>
                  
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">Waga sztuki:</Text>
                    <Text>{formatujWage(obliczWageSztuki(formatka))}</Text>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty 
          description={
            searchText || filterKolor !== 'all' 
              ? "Brak formatek spełniających kryteria" 
              : "Brak dostępnych formatek"
          }
        />
      )}
    </div>
  );
};
