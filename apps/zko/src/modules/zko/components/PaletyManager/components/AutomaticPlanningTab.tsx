import React from 'react';
import { 
  Button, 
  Space, 
  Alert,
  message
} from 'antd';
import { 
  ThunderboltOutlined,
  StarOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { PaletyStats } from './PaletyStats';
import { PaletyTable } from './PaletyTable';
import { LIMITY_PALETY, MESSAGES } from '../types';

interface Paleta {
  id: number;
  numer_palety: string;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  ilosc_formatek?: number;
  wysokosc_stosu: number;
  kolory_na_palecie: string;
  formatki_ids?: number[];
  formatki_szczegoly?: any[];
  typ?: string;
  created_at?: string;
  updated_at?: string;
  waga_kg?: number;
  procent_wykorzystania?: number;
  przeznaczenie?: string;
}

interface AutomaticPlanningTabProps {
  palety: Paleta[];
  loading: boolean;
  modularLoading: boolean;
  modularError: string | null;
  podsumowanie: any;
  onRefresh: () => void;
  onViewDetails: (paleta: Paleta) => void;
  onShowPlanningModal: () => void;
  onShowModularModal: () => void;
  onQuickPlanning: () => Promise<void>;
  renderFormatkiColumn: (paleta: Paleta) => React.ReactNode;
}

export const AutomaticPlanningTab: React.FC<AutomaticPlanningTabProps> = ({
  palety,
  loading,
  modularLoading,
  modularError,
  podsumowanie,
  onRefresh,
  onViewDetails,
  onShowPlanningModal,
  onShowModularModal,
  onQuickPlanning,
  renderFormatkiColumn
}) => {
  const hasModularError = modularError !== null;

  return (
    <>
      {hasModularError && (
        <Alert
          message="Błąd Planowania V2"
          description={modularError}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Space style={{ marginBottom: 16 }} wrap>
        <Button 
          onClick={onQuickPlanning}
          icon={<ThunderboltOutlined />}
          type="primary"
          loading={modularLoading}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          Szybko
        </Button>
        
        <Button 
          onClick={onShowModularModal}
          icon={<StarOutlined />}
          type="primary"
          loading={modularLoading}
          style={{ background: '#722ed1', borderColor: '#722ed1' }}
        >
          Planuj V2
        </Button>
        
        <Button 
          onClick={onShowPlanningModal}
          icon={<SettingOutlined />}
          loading={loading}
        >
          V5
        </Button>
        
        <Button 
          onClick={onRefresh}
          icon={<ReloadOutlined />}
          loading={loading}
        >
          Odśwież
        </Button>
      </Space>

      {palety.length === 0 ? (
        <Alert
          message="Brak palet"
          description="Użyj przycisków powyżej lub przejdź do zakładki 'Ręczne tworzenie' aby utworzyć palety."
          type="info"
          showIcon
        />
      ) : (
        <>
          {podsumowanie && (
            <Alert
              message="Podsumowanie ZKO"
              description={`${podsumowanie.typy_formatek} typów formatek, ${podsumowanie.sztuk_total} sztuk do produkcji`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <PaletyStats palety={palety} />
          <PaletyTable
            palety={palety}
            loading={loading}
            onViewDetails={onViewDetails}
            renderFormatkiColumn={renderFormatkiColumn}
          />
        </>
      )}
    </>
  );
};