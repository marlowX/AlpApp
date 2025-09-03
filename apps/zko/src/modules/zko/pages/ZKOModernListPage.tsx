import React, { useState, useCallback } from 'react';
import { Card, Input, Select, Space, Button, Badge, Empty, Spin } from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useZKOListWithStats } from '../hooks/useZKOStats';
import { ZKOListCard } from '../components/ZKOListCard';
import { ZKOListFilters } from '../components/ZKOListFilters';
import { ZKOListStats } from '../components/ZKOListStats';
import './ZKOModernListPage.css';

const { Search } = Input;

export const ZKOModernListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    kooperant: undefined as string | undefined,
    search: '',
    priorytet: undefined as number | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Używamy hooka ze statystykami
  const { data, isLoading, refetch, error } = useZKOListWithStats(filters);
  const zkoList = data?.data || [];

  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  if (error) {
    return (
      <div className="zko-error-container">
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <span>Błąd ładowania danych</span>
                <span style={{ fontSize: 12, color: '#999' }}>{error.message}</span>
              </Space>
            }
          >
            <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="zko-modern-list">
      {/* Header */}
      <div className="zko-list-header">
        <div className="header-title">
          <FileTextOutlined className="header-icon" />
          <h1>Zlecenia produkcji</h1>
          <Badge count={zkoList.length} showZero style={{ marginLeft: 12 }}>
            <span style={{ fontSize: 14, color: '#666' }}>aktywne</span>
          </Badge>
        </div>
        
        <Space size={8}>
          <Search
            placeholder="Szukaj po numerze ZKO..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
          >
            Filtry
            {activeFiltersCount > 0 && (
              <Badge 
                count={activeFiltersCount} 
                style={{ marginLeft: 6 }}
                size="small"
              />
            )}
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Odśwież
          </Button>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/zko/new')}
          >
            Nowe ZKO
          </Button>
        </Space>
      </div>

      {/* Stats Bar - używa prawdziwych danych */}
      <ZKOListStats zkoList={zkoList} />

      {/* Filters */}
      {showFilters && (
        <ZKOListFilters 
          filters={filters}
          onChange={handleFilterChange}
          onReset={() => setFilters({
            status: undefined,
            kooperant: undefined,
            search: '',
            priorytet: undefined,
          })}
        />
      )}

      {/* List Content */}
      <div className="zko-list-content">
        {isLoading ? (
          <div className="zko-loading">
            <Spin size="large" />
            <span>Ładowanie zleceń...</span>
          </div>
        ) : zkoList.length === 0 ? (
          <Card>
            <Empty
              description="Brak zleceń do wyświetlenia"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/zko/new')}
              >
                Utwórz pierwsze zlecenie
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="zko-cards-grid">
            {zkoList.map((zko: any) => (
              <ZKOListCard 
                key={zko.id} 
                zko={zko}
                onView={() => navigate(`/zko/${zko.id}`)}
                onWorkflow={() => navigate(`/zko/${zko.id}/workflow`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZKOModernListPage;