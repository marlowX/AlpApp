/**
 * @fileoverview Komponent zarządzający zakładkami palet
 * @module PaletyTabs
 * 
 * UWAGA: Maksymalnie 300 linii kodu na plik!
 * Jeśli plik przekracza limit, należy go rozbić na podkomponenty.
 */

import React from 'react';
import { Tabs, Badge } from 'antd';
import { 
  EditOutlined,
  ThunderboltOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { ManualCreationTab } from './ManualCreationTab';
import { AutomaticPlanningTab } from './AutomaticPlanningTab';
import { DestinationTab } from './DestinationTab';

const { TabPane } = Tabs;

interface PozycjaFormatka {
  id: number;
  nazwa: string;
  dlugosc: number;
  szerokosc: number;
  grubosc: number;
  kolor: string;
  ilosc_planowana: number;
  waga_sztuka: number;
  ilosc_w_paletach: number;
  ilosc_dostepna: number;
  czy_w_pelni_przypisana: boolean;
}

interface Paleta {
  id: number;
  numer_palety: string;
  pozycja_id?: number;
  kierunek: string;
  status: string;
  sztuk_total?: number;
  wysokosc_stosu: number;
  waga_kg?: number;
  przeznaczenie?: string;
  formatki_szczegoly?: any[];
}

interface PaletyTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  selectedPozycjaId?: number;
  pozycjaFormatki: PozycjaFormatka[];
  palety: Paleta[];
  loading: boolean;
  modularLoading: boolean;
  modularError: any;
  podsumowanie: any;
  totalAvailableFormatki: number;
  onSaveManualPallets: (palety: any[]) => void;
  onCreateAllRemaining: (przeznaczenie?: string) => void;
  onRefresh: () => void;
  onViewDetails: (paleta: Paleta) => void;
  onShowPlanningModal: () => void;
  onShowModularModal: () => void;
  onQuickPlanning: () => void;
  renderFormatkiColumn: (paleta: Paleta) => React.ReactNode;
}

export const PaletyTabs: React.FC<PaletyTabsProps> = ({
  activeTab,
  onTabChange,
  selectedPozycjaId,
  pozycjaFormatki,
  palety,
  loading,
  modularLoading,
  modularError,
  podsumowanie,
  totalAvailableFormatki,
  onSaveManualPallets,
  onCreateAllRemaining,
  onRefresh,
  onViewDetails,
  onShowPlanningModal,
  onShowModularModal,
  onQuickPlanning,
  renderFormatkiColumn
}) => {
  return (
    <Tabs activeKey={activeTab} onChange={onTabChange}>
      <TabPane 
        tab={
          <span>
            <EditOutlined />
            Ręczne tworzenie
            {totalAvailableFormatki > 0 && (
              <Badge 
                count={totalAvailableFormatki} 
                style={{ 
                  backgroundColor: '#1890ff',
                  marginLeft: 8
                }} 
              />
            )}
          </span>
        } 
        key="manual"
        disabled={!selectedPozycjaId}
      >
        <ManualCreationTab
          pozycjaId={selectedPozycjaId}
          pozycjaFormatki={pozycjaFormatki}
          loading={loading}
          onSaveManualPallets={onSaveManualPallets}
          onCreateAllRemaining={onCreateAllRemaining}
          onRefresh={onRefresh}
        />
      </TabPane>

      <TabPane 
        tab={<span><ThunderboltOutlined /> Planowanie automatyczne (testy)</span>} 
        key="auto"
      >
        <AutomaticPlanningTab
          palety={palety}
          loading={loading}
          modularLoading={modularLoading}
          modularError={modularError}
          podsumowanie={podsumowanie}
          onRefresh={onRefresh}
          onViewDetails={onViewDetails}
          onShowPlanningModal={onShowPlanningModal}
          onShowModularModal={onShowModularModal}
          onQuickPlanning={onQuickPlanning}
          renderFormatkiColumn={renderFormatkiColumn}
        />
      </TabPane>

      <TabPane 
        tab={<span><ToolOutlined /> Przeznaczenie palet</span>} 
        key="destination"
      >
        <DestinationTab palety={palety} />
      </TabPane>
    </Tabs>
  );
};