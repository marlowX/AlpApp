import React from 'react';
import { Alert } from 'antd';
import { Paleta, Formatka } from '../types';

interface PaletaSummaryProps {
  palety: Paleta[];
  dostepneFormatki: Formatka[];
  pozycjaId: number;
}

export const PaletaSummary: React.FC<PaletaSummaryProps> = ({
  palety,
  dostepneFormatki,
  pozycjaId
}) => {
  const obliczPodsumowanie = () => {
    const totalFormatek = palety.reduce((sum, p) => 
      sum + p.formatki.reduce((s, f) => s + f.ilosc, 0), 0
    );
    
    const totalWaga = palety.reduce((sum, p) => {
      return sum + p.formatki.reduce((s, f) => {
        const formatka = dostepneFormatki.find(df => df.id === f.formatka_id);
        if (!formatka) return s;
        const waga = (formatka.dlugosc * formatka.szerokosc * 18 * 0.8) / 1000000000;
        return s + (waga * f.ilosc);
      }, 0);
    }, 0);
    
    return { totalFormatek, totalWaga };
  };

  if (palety.length === 0) return null;

  const { totalFormatek, totalWaga } = obliczPodsumowanie();

  return (
    <Alert
      className="mt-4"
      message="Podsumowanie"
      description={
        <div>
          <p>Pozycja ID: <strong>{pozycjaId}</strong></p>
          <p>Liczba palet: <strong>{palety.length}</strong></p>
          <p>Łączna liczba formatek: <strong>{totalFormatek} szt.</strong></p>
          <p>Łączna waga: <strong>{totalWaga.toFixed(2)} kg</strong></p>
        </div>
      }
      type="info"
      showIcon
    />
  );
};
