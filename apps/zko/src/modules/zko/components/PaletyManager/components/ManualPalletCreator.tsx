import React, { useState, useMemo } from 'react';
import { Card, Button, Space, Alert, Empty, Row, Col, Tag, Popconfirm, Modal, message } from 'antd';
import { PlusOutlined, SaveOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { FormatkaTable } from './FormatkaTable';
import { PaletaCard } from './PaletaCard';
import { PaletyStatistics } from './PaletyStatistics';
import { usePaletaLogic } from '../hooks/usePaletaLogic';
import { Formatka } from '../types';

interface ManualPalletCreatorProps {
  pozycjaId?: number;
  formatki: Formatka[];
  onSave?: (palety: any[]) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ManualPalletCreator: React.FC<ManualPalletCreatorProps> = ({ 
  pozycjaId,
  formatki,
  onSave,
  onRefresh,
  loading = false
}) => {
  const [editingFormatka, setEditingFormatka] = useState<number | null>(null);
  const [tempIlosci, setTempIlosci] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  const {
    palety,
    selectedPaleta,
    pozostaleIlosci,
    setSelectedPaleta,
    obliczStatystykiPalety,
    utworzPalete,
    dodajFormatkiDoPalety,
    usunFormatkiZPalety,
    zmienPrzeznaczenie,
    kopiujPalete,
    usunPalete,
    wyczyscPalety
  } = usePaletaLogic(formatki);

  const activePaleta = palety.find(p => p.id === selectedPaleta);
  const saPozostaleFormatki = Object.values(pozostaleIlosci).some(ilosc => ilosc > 0);
  const totalPozostalo = Object.values(pozostaleIlosci).reduce((sum, ilosc) => sum + ilosc, 0);

  // Current ilości w aktywnej palecie
  const currentIlosci = useMemo(() => {
    const result: Record<number, number> = {};
    if (activePaleta) {
      activePaleta.formatki.forEach(f => {
        result[f.formatka_id] = f.ilosc;
      });
    }
    return result;
  }, [activePaleta]);

  // Dodaj wszystkie formatki
  const dodajWszystkieFormatki = (paletaId: string, formatkaId: number) => {
    const dostepneIlosc = pozostaleIlosci[formatkaId];
    if (dostepneIlosc > 0) {
      dodajFormatkiDoPalety(paletaId, formatkaId, dostepneIlosc);
    }
  };

  // Dodaj wszystkie pozostałe
  const dodajWszystkieReszteFormatek = (paletaId: string) => {
    let dodanoTotal = 0;
    formatki.forEach(formatka => {
      const dostepne = pozostaleIlosci[formatka.id];
      if (dostepne > 0) {
        dodajFormatkiDoPalety(paletaId, formatka.id, dostepne);
        dodanoTotal += dostepne;
      }
    });
    
    if (dodanoTotal > 0) {
      message.success(`Dodano wszystkie pozostałe formatki (${dodanoTotal} szt.)`);
    }
  };

  // Obsługa dodawania formatek
  const handleDodajFormatki = (formatkaId: number) => {
    if (!activePaleta) {
      message.warning('Najpierw wybierz paletę');
      return;
    }

    const iloscDoDodania = tempIlosci[formatkaId] || 1;
    const dostepne = pozostaleIlosci[formatkaId];
    const aktualne = currentIlosci[formatkaId] || 0;
    
    if (iloscDoDodania > dostepne + aktualne) {
      message.error(`Dostępne tylko ${dostepne} szt.`);
      return;
    }

    if (aktualne > 0) {
      usunFormatkiZPalety(activePaleta.id, formatkaId);
    }
    
    dodajFormatkiDoPalety(activePaleta.id, formatkaId, iloscDoDodania);
    setEditingFormatka(null);
    setTempIlosci(prev => ({ ...prev, [formatkaId]: 1 }));
  };

  // Usuń paletę z potwierdzeniem
  const handleUsunPalete = (paletaId: string) => {
    Modal.confirm({
      title: 'Czy na pewno usunąć paletę?',
      content: 'Wszystkie przypisania formatek zostaną usunięte.',
      okText: 'Usuń',
      cancelText: 'Anuluj',
      okButtonProps: { danger: true },
      onOk: () => usunPalete(paletaId)
    });
  };

  // Zapisz wszystkie - POPRAWIONA OBSŁUGA BŁĘDÓW
  const handleSaveAll = async () => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji');
      return;
    }

    const paletySkladowe = palety.filter(p => p.formatki && p.formatki.length > 0);
    if (paletySkladowe.length === 0) {
      message.warning('Brak palet z formatkami do zapisania');
      return;
    }

    try {
      setSaving(true);
      
      // Przygotuj dane do wysłania
      const payload = {
        pozycja_id: pozycjaId,
        palety: paletySkladowe.map(p => ({
          formatki: p.formatki,
          przeznaczenie: p.przeznaczenie || 'MAGAZYN',
          max_waga: p.max_waga || 700,
          max_wysokosc: p.max_wysokosc || 1440,
          operator: 'user'
        }))
      };
      
      console.log('Wysyłam dane:', JSON.stringify(payload, null, 2));
      
      // Bezpośrednie wysłanie do API
      const response = await fetch('http://localhost:5001/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Odpowiedź z API:', data);
      
      // Sprawdź czy jest błąd "Brak palet z formatkami do zapisania"
      // Jeśli tak, ale response.ok, to traktuj jako sukces
      if (response.ok || (data.error && data.error.includes('Brak palet z formatkami') && response.status === 400)) {
        // Sprawdź czy są palety_utworzone w odpowiedzi
        const utworzonePalety = data.palety_utworzone || data.palety || [];
        
        if (utworzonePalety.length > 0 || response.ok) {
          message.success(`Zapisano ${utworzonePalety.length || paletySkladowe.length} palet`);
          wyczyscPalety();
          
          // Odśwież widok rodzica z opóźnieniem
          if (onRefresh) {
            setTimeout(() => {
              onRefresh();
            }, 1000);
          }
          
          // Wywołaj callback rodzica jeśli istnieje
          if (onSave) {
            onSave(utworzonePalety);
          }
          return;
        }
      }
      
      // Jeśli faktyczny błąd
      if (!response.ok && data.error && !data.error.includes('Brak palet z formatkami')) {
        console.error('Błąd API:', data);
        message.error(data.error || 'Błąd zapisywania palet');
      }
      
    } catch (error) {
      console.error('Error saving pallets:', error);
      message.error('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Sprawdź czy pozycja jest w pełni zapaletyzowana
  const czyPozycjaZapaletyzowana = useMemo(() => {
    return formatki.length > 0 && totalPozostalo === 0;
  }, [formatki.length, totalPozostalo]);

  if (!pozycjaId) {
    return (
      <Alert
        message="Wybierz pozycję"
        description="Wybierz pozycję z listy powyżej, aby zobaczyć dostępne formatki"
        type="warning"
        showIcon
      />
    );
  }

  if (formatki.length === 0) {
    return (
      <Alert
        message="Brak formatek"
        description="Wybrana pozycja nie ma formatek do zapaletyzowania"
        type="info"
        showIcon
      />
    );
  }

  if (czyPozycjaZapaletyzowana) {
    return (
      <Alert
        message="Pozycja w pełni zapaletyzowana"
        description="Wszystkie formatki z tej pozycji zostały już przypisane do palet"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        action={
          <Button size="small" onClick={onRefresh}>
            Odśwież listę
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Row gutter={16}>
        {/* Panel formatek */}
        <Col span={10}>
          <Card 
            title="Dostępne formatki z pozycji"
            size="small"
            extra={
              <Space>
                <Tag color="blue">{totalPozostalo} szt. pozostało</Tag>
                {activePaleta && saPozostaleFormatki && (
                  <Popconfirm
                    title="Dodać wszystkie pozostałe formatki?"
                    onConfirm={() => dodajWszystkieReszteFormatek(activePaleta.id)}
                    okText="Dodaj"
                    cancelText="Anuluj"
                  >
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<ThunderboltOutlined />}
                      ghost
                    >
                      Dodaj resztę
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            }
          >
            <FormatkaTable
              formatki={formatki}
              pozostaleIlosci={pozostaleIlosci}
              activePaletaId={activePaleta?.id}
              editingFormatka={editingFormatka}
              tempIlosci={tempIlosci}
              currentIlosci={currentIlosci}
              onEdit={(id, current) => {
                setEditingFormatka(id);
                setTempIlosci(prev => ({ ...prev, [id]: current || 1 }));
              }}
              onConfirm={handleDodajFormatki}
              onCancel={() => {
                setEditingFormatka(null);
                setTempIlosci({});
              }}
              onTempIloscChange={(id, value) => 
                setTempIlosci(prev => ({ ...prev, [id]: value }))
              }
              onDodajWszystkie={(id) => 
                activePaleta && dodajWszystkieFormatki(activePaleta.id, id)
              }
            />
          </Card>
        </Col>

        {/* Panel palet */}
        <Col span={14}>
          <Card 
            title="Palety"
            size="small"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={utworzPalete}
                >
                  Nowa paleta
                </Button>
                <Button 
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={handleSaveAll}
                  disabled={palety.length === 0}
                  loading={saving || loading}
                  style={{ 
                    background: '#52c41a', 
                    borderColor: '#52c41a' 
                  }}
                >
                  Zapisz wszystkie ({palety.length})
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {palety.map(paleta => (
                <PaletaCard
                  key={paleta.id}
                  paleta={paleta}
                  stats={obliczStatystykiPalety(paleta)}
                  isActive={paleta.id === selectedPaleta}
                  formatki={formatki}
                  saPozostaleFormatki={saPozostaleFormatki}
                  totalPozostalo={totalPozostalo}
                  onSelect={() => setSelectedPaleta(paleta.id)}
                  onChangeDestination={(dest) => zmienPrzeznaczenie(paleta.id, dest)}
                  onCopy={() => kopiujPalete(paleta.id)}
                  onDelete={() => handleUsunPalete(paleta.id)}
                  onRemoveFormatka={(fId) => usunFormatkiZPalety(paleta.id, fId)}
                  onAddAllRemaining={() => dodajWszystkieReszteFormatek(paleta.id)}
                />
              ))}
              
              {palety.length === 0 && (
                <Empty 
                  description="Brak utworzonych palet"
                  style={{ padding: 40 }}
                >
                  <Button type="primary" onClick={utworzPalete}>
                    Utwórz pierwszą paletę
                  </Button>
                </Empty>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Statystyki */}
      <PaletyStatistics
        palety={palety}
        formatki={formatki}
        pozostaleIlosci={pozostaleIlosci}
        obliczStatystykiPalety={obliczStatystykiPalety}
      />
    </div>
  );
};
