/**
 * @fileoverview Przykład integracji modułu PaletyZko
 * @module PaletyZko/examples
 */

import React from 'react';
import { PaletyZko } from '../';

/**
 * Przykład użycia modułu PaletyZko w komponencie ZKO
 */
export const PaletyZkoExample: React.FC = () => {
  const zkoId = 123; // ID zlecenia ZKO
  
  const handleRefresh = () => {
    console.log('Odświeżanie danych ZKO...');
    // Tu można dodać logikę odświeżania danych rodzica
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Zarządzanie Paletami - ZKO #{zkoId}</h1>
      
      <PaletyZko 
        zkoId={zkoId}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

/**
 * Przykład z dodatkowymi opcjami konfiguracji
 */
export const PaletyZkoAdvancedExample: React.FC = () => {
  const [zkoId, setZkoId] = React.useState(123);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleZkoChange = (newZkoId: number) => {
    setZkoId(newZkoId);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <label>
          ZKO ID: 
          <input 
            type="number" 
            value={zkoId} 
            onChange={(e) => handleZkoChange(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
      
      <PaletyZko 
        key={refreshKey}
        zkoId={zkoId}
        onRefresh={() => {
          console.log(`Refreshing ZKO ${zkoId} data...`);
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
};

/**
 * Przykład integracji w istniejącym module ZKO
 */
export const IntegrationExample: React.FC = () => {
  return (
    <div>
      {/* Zastąp stary PaletyManager nowym PaletyZko */}
      {/* Stary kod:
      <PaletyManager zkoId={zkoId} onRefresh={onRefresh} />
      */}
      
      {/* Nowy kod: */}
      <PaletyZko zkoId={123} onRefresh={() => console.log('Refresh')} />
    </div>
  );
};

export default PaletyZkoExample;
