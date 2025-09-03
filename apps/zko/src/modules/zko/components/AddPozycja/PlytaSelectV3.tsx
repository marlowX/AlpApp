import React, { useMemo, useState } from 'react';
import { Select, Tag, Badge, Space, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { Plyta } from './types';

const { Text } = Typography;
const { Option } = Select;

interface PlytaSelectV3Props {
  plyty: Plyta[];
  loading?: boolean;
  value?: string;
  onChange?: (plyta: Plyta | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PlytaSelectV3: React.FC<PlytaSelectV3Props> = ({
  plyty,
  loading = false,
  value,
  onChange,
  placeholder = "Wybierz płytę",
  disabled = false
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);

  // Sortuj płyty - najpierw z magazynem, potem alfabetycznie
  const sortedPlyty = useMemo(() => {
    return [...plyty].sort((a, b) => {
      // Najpierw płyty ze stanem magazynowym
      if (a.stan_magazynowy > 0 && b.stan_magazynowy <= 0) return -1;
      if (a.stan_magazynowy <= 0 && b.stan_magazynowy > 0) return 1;
      
      // Potem według stanu magazynowego
      if (a.stan_magazynowy !== b.stan_magazynowy) {
        return b.stan_magazynowy - a.stan_magazynowy;
      }
      
      // Na końcu alfabetycznie
      return a.kolor_nazwa.localeCompare(b.kolor_nazwa);
    });
  }, [plyty]);

  const handleChange = (selectedValue: string | undefined) => {
    if (!selectedValue) {
      onChange?.(null);
      return;
    }
    
    const plyta = plyty.find(p => p.kolor_nazwa === selectedValue);
    onChange?.(plyta || null);
    setOpen(false);
  };

  const filterOption = (input: string, option: any) => {
    const searchWords = input.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const optionText = option.searchtext?.toLowerCase() || '';
    
    return searchWords.every(word => optionText.includes(word));
  };

  const getStockColor = (stock: number) => {
    if (stock > 20) return '#52c41a';
    if (stock > 5) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Select
      style={{ width: '100%' }}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      allowClear
      showSearch
      searchValue={searchValue}
      onSearch={setSearchValue}
      filterOption={filterOption}
      optionFilterProp="searchtext"
      notFoundContent={loading ? 'Ładowanie...' : 'Nie znaleziono płyt'}
      dropdownStyle={{ maxHeight: 400, zIndex: 2050 }}
      dropdownMatchSelectWidth={false}
      popupClassName="plyta-select-dropdown"
      // WAŻNE: Kontrola otwierania/zamykania
      open={open}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      // WAŻNE: Upewnij się że dropdown renderuje się w body
      getPopupContainer={() => document.body}
      // Wyłącz virtual scroll który może powodować problemy
      virtual={false}
    >
      {sortedPlyty.map(plyta => (
        <Option 
          key={plyta.id} 
          value={plyta.kolor_nazwa}
          disabled={plyta.stan_magazynowy === 0}
          searchtext={`${plyta.kolor_nazwa} ${plyta.nazwa} ${plyta.opis} ${plyta.grubosc}mm ${plyta.struktura === 1 ? 'struktura' : ''}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                <Text strong style={{ fontSize: '12px' }}>
                  {plyta.kolor_nazwa}
                </Text>
                {plyta.struktura === 1 && (
                  <Tag color="gold" size="small" style={{ marginLeft: 4, fontSize: '10px', padding: '0 3px' }}>
                    STR
                  </Tag>
                )}
                {plyta.stan_magazynowy === 0 && (
                  <Tag color="error" size="small" style={{ marginLeft: 4, fontSize: '10px', padding: '0 3px' }}>
                    BRAK
                  </Tag>
                )}
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {plyta.grubosc}mm • {plyta.dlugosc}×{plyta.szerokosc}mm
                </Text>
              </div>
            </div>
            <div style={{ marginLeft: 8 }}>
              <Tooltip title={`Stan: ${plyta.stan_magazynowy} szt.`}>
                <Badge
                  count={plyta.stan_magazynowy}
                  overflowCount={999}
                  style={{
                    backgroundColor: getStockColor(plyta.stan_magazynowy),
                    fontSize: '10px'
                  }}
                />
              </Tooltip>
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};
