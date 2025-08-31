import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Space, Alert, Empty, Row, Col, Tag, Popconfirm, Modal, message } from 'antd';
import { PlusOutlined, SaveOutlined, ThunderboltOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormatkaTable } from './FormatkaTable';
import { PaletaCard } from './PaletaCard';
import { PaletyStats } from './PaletyStats';
import { usePaletaLogic } from '../hooks/usePaletaLogic';
import { Formatka } from '../types';

interface ManualPalletCreatorProps {
  pozycjaId?: number;
  pozycjaFormatki?: Formatka[];  
  formatki?: Formatka[];          
  onSave?: (palety: any[]) => void;
  onCancel?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  initialPaleta?: any;  
  editMode?: boolean;
}

export const ManualPalletCreator: React.FC<ManualPalletCreatorProps> = ({ 
  pozycjaId,
  pozycjaFormatki,
  formatki: formatkiProp,
  onSave,
  onCancel,
  onRefresh,
  loading = false,
  initialPaleta,
  editMode = false
}) => {
  // Użyj pozycjaFormatki jeśli jest, w przeciwnym razie formatki
  const formatki = pozycjaFormatki || formatkiProp || [];
  
  const [editingFormatka, setEditingFormatka] = useState<number | null>(null);
  const [tempIlosci, setTempIlosci] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // NAPRAWIONE: Śledzenie niezapisanych zmian

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

  // Jeśli tryb edycji, załaduj dane początkowe
  useEffect(() => {
    if (editMode && initialPaleta && palety.length === 0) {
      const editPaleta = {
        id: `PAL-EDIT-${Date.now()}`,
        numer: initialPaleta.numer_palety || 'EDIT',
        formatki: (initialPaleta.formatki || initialPaleta.formatki_szczegoly || []).map((f: any) => ({
          formatka_id: f.formatka_id || f.id,
          ilosc: f.ilosc || 0
        })),
        przeznaczenie: initialPaleta.przeznaczenie || 'MAGAZYN',
        max_waga: initialPaleta.max_waga || 700,
        max_wysokosc: initialPaleta.max_wysokosc || 1440
      };
      
      utworzPalete();
    }
  }, [editMode, initialPaleta]);

  // NAPRAWIONE: Śledź zmiany w paletach
  useEffect(() => {
    if (palety.length > 0 && palety.some(p => p.formatki.length > 0)) {
      setHasUnsavedChanges(true);
    }
  }, [palety]);

  // Oblicz ile formatek zostało przypisanych na paletach
  const totalAssigned = useMemo(() => {
    return formatki.reduce((sum, f) => {
      const currentAvailable = pozostaleIlosci[f.id] || 0;
      const originalAvailable = f.ilosc_dostepna || f.ilosc_planowana || 0;
      return sum + (originalAvailable - currentAvailable);
    }, 0);
  }, [formatki, pozostaleIlosci]);

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

  // Zabezpieczenie przed duplikacją - sprawdza rzeczywistą dostępność
  const checkFormatkaAvailability = (formatkaId: number, requestedAmount: number): { available: boolean; maxAmount: number; reason?: string } => {
    const originalFormatka = formatki.find(f => f.id === formatkaId);
    if (!originalFormatka) {
      return { available: false, maxAmount: 0, reason: 'Formatka nie istnieje' };
    }

    const remainingInPallets = pozostaleIlosci[formatkaId] || 0;
    const currentInActivePallet = currentIlosci[formatkaId] || 0;
    
    const maxAvailable = remainingInPallets + currentInActivePallet;
    
    if (requestedAmount > maxAvailable) {
      return { 
        available: false, 
        maxAmount: maxAvailable,
        reason: `Dostępne tylko ${maxAvailable} szt. (${remainingInPallets} pozostało + ${currentInActivePallet} w tej palecie)`
      };
    }

    let totalUsedInOtherPallets = 0;
    palety.forEach(paleta => {
      if (paleta.id !== selectedPaleta) {
        const formatkaNaPalecie = paleta.formatki.find(f => f.formatka_id === formatkaId);
        if (formatkaNaPalecie) {
          totalUsedInOtherPallets += formatkaNaPalecie.ilosc;
        }
      }
    });

    const originalAvailable = originalFormatka.ilosc_dostepna || originalFormatka.ilosc_planowana || 0;
    const totalCanUse = originalAvailable - totalUsedInOtherPallets;
    
    if (requestedAmount > totalCanUse) {
      return {
        available: false,
        maxAmount: totalCanUse,
        reason: `Formatka już użyta w innych paletach. Dostępne: ${totalCanUse} szt.`
      };
    }

    return { available: true, maxAmount: maxAvailable };
  };

  // Dodaj wszystkie formatki z walidacją
  const dodajWszystkieFormatki = (paletaId: string, formatkaId: number) => {
    const dostepneIlosc = pozostaleIlosci[formatkaId];
    if (dostepneIlosc > 0) {
      const validation = checkFormatkaAvailability(formatkaId, dostepneIlosc);
      if (validation.available) {
        dodajFormatkiDoPalety(paletaId, formatkaId, dostepneIlosc);
        setHasUnsavedChanges(true); // NAPRAWIONE: Oznacz jako niezapisane
        message.success(`Dodano wszystkie ${dostepneIlosc} szt. formatek`);
      } else {
        message.error(validation.reason || 'Nie można dodać formatek');
      }
    }
  };

  // Dodaj wszystkie pozostałe z walidacją
  const dodajWszystkieReszteFormatek = (paletaId: string) => {
    let dodanoTotal = 0;
    let errors = 0;
    
    formatki.forEach(formatka => {
      const dostepne = pozostaleIlosci[formatka.id];
      if (dostepne > 0) {
        const validation = checkFormatkaAvailability(formatka.id, dostepne);
        if (validation.available) {
          dodajFormatkiDoPalety(paletaId, formatka.id, dostepne);
          dodanoTotal += dostepne;
        } else {
          errors++;
          console.warn(`Nie można dodać formatki ${formatka.nazwa}: ${validation.reason}`);
        }
      }
    });
    
    if (dodanoTotal > 0) {
      setHasUnsavedChanges(true); // NAPRAWIONE: Oznacz jako niezapisane
      message.success(`Dodano wszystkie pozostałe formatki (${dodanoTotal} szt.)`);
    }
    if (errors > 0) {
      message.warning(`${errors} formatek pominięto z powodu ograniczeń dostępności`);
    }
  };

  // NAPRAWIONA obsługa dodawania formatek z zabezpieczeniem
  const handleDodajFormatki = (formatkaId: number) => {
    if (!activePaleta) {
      message.warning('Najpierw wybierz paletę');
      return;
    }

    const iloscDoDodania = tempIlosci[formatkaId] || 1;
    const validation = checkFormatkaAvailability(formatkaId, iloscDoDodania);
    
    if (!validation.available) {
      message.error(validation.reason || 'Nie można dodać formatek');
      setTempIlosci(prev => ({ ...prev, [formatkaId]: validation.maxAmount }));
      return;
    }

    // Usuń obecne przypisanie jeśli istnieje
    const aktualne = currentIlosci[formatkaId] || 0;
    if (aktualne > 0) {
      usunFormatkiZPalety(activePaleta.id, formatkaId);
    }
    
    // Dodaj nową ilość
    dodajFormatkiDoPalety(activePaleta.id, formatkaId, iloscDoDodania);
    setEditingFormatka(null);
    setTempIlosci(prev => ({ ...prev, [formatkaId]: 1 }));
    setHasUnsavedChanges(true); // NAPRAWIONE: Oznacz jako niezapisane
    
    message.success(`Dodano ${iloscDoDodania} szt. formatek do palety`);
  };

  // Usuń paletę z potwierdzeniem
  const handleUsunPalete = (paletaId: string) => {
    Modal.confirm({
      title: 'Czy na pewno usunąć paletę?',
      content: 'Wszystkie przypisania formatek zostaną usunięte.',
      okText: 'Usuń',
      cancelText: 'Anuluj',
      okButtonProps: { danger: true },
      onOk: () => {
        usunPalete(paletaId);
        message.success('Usunięto paletę');
      }
    });
  };

  // NAPRAWIONA funkcja zapisywania - NIE odświeża przed zapisem
  const handleSaveAll = async () => {
    if (!editMode && !pozycjaId) {
      message.error('Brak ID pozycji - nie można zapisać palet');
      return;
    }

    // Filtruj tylko palety z formatkami
    const paletySkladowe = palety.filter(p => p.formatki && p.formatki.length > 0);
    
    console.log('📋 Palety do zapisania:', paletySkladowe);
    
    if (paletySkladowe.length === 0) {
      message.warning('Brak palet z formatkami do zapisania');
      return;
    }

    if (onSave) {
      setSaving(true);
      try {
        // Przekaż palety do funkcji rodzica
        await onSave(paletySkladowe);
        
        // Wyczyść lokalne palety po pomyślnym zapisie
        wyczyscPalety();
        setHasUnsavedChanges(false); // NAPRAWIONE: Resetuj flagę
        
        // Odśwież DOPIERO PO zapisie
        setTimeout(() => {
          if (onRefresh && !editMode) {
            onRefresh();
          }
        }, 500);
        
      } catch (error) {
        console.error('Błąd podczas zapisywania:', error);
        message.error('Błąd podczas zapisywania palet');
      } finally {
        setSaving(false);
      }
    } else {
      message.error('Brak funkcji zapisywania');
    }
  };

  // NAPRAWIONE: Funkcja odświeżania z ostrzeżeniem
  const handleRefreshWithWarning = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Niezapisane zmiany',
        content: 'Masz niezapisane palety. Odświeżenie spowoduje utratę zmian. Czy na pewno chcesz kontynuować?',
        okText: 'Tak, odśwież',
        cancelText: 'Anuluj',
        okButtonProps: { danger: true },
        onOk: () => {
          wyczyscPalety();
          setHasUnsavedChanges(false);
          if (onRefresh) {
            onRefresh();
          }
        }
      });
    } else {
      if (onRefresh) {
        onRefresh();
      }
    }
  };

  // Sprawdź czy pozycja jest w pełni zapaletyzowana
  const czyPozycjaZapaletyzowana = useMemo(() => {
    return formatki.length > 0 && totalPozostalo === 0;
  }, [formatki.length, totalPozostalo]);

  // W trybie edycji nie wymagamy pozycjaId
  if (!editMode && !pozycjaId) {
    return (
      <Alert
        message="Wybierz pozycję"
        description="Wybierz pozycję z listy powyżej, aby zobaczyć dostępne formatki"
        type="warning"
        showIcon
      />
    );
  }

  if (formatki.length === 0 && !editMode) {
    return (
      <Alert
        message="Brak formatek"
        description="Wybrana pozycja nie ma formatek do zapaletyzowania"
        type="info"
        showIcon
        action={
          <Button size="small" icon={<ReloadOutlined />} onClick={handleRefreshWithWarning}>
            Odśwież
          </Button>
        }
      />
    );
  }

  if (czyPozycjaZapaletyzowana && !editMode) {
    return (
      <Alert
        message="Pozycja w pełni zapaletyzowana"
        description="Wszystkie formatki z tej pozycji zostały już przypisane do palet"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        action={
          <Button size="small" icon={<ReloadOutlined />} onClick={handleRefreshWithWarning}>
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
            title={editMode ? "Formatki palety" : "Dostępne formatki z pozycji"}
            size="small"
            extra={
              <Space>
                <Tag color="blue">{totalPozostalo} szt. pozostało</Tag>
                {totalAssigned > 0 && (
                  <Tag color="green">{totalAssigned} szt. przypisano</Tag>
                )}
                {hasUnsavedChanges && (
                  <Tag color="orange">Niezapisane zmiany!</Tag>
                )}
                {!editMode && (
                  <Button 
                    size="small" 
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshWithWarning}
                    loading={loading}
                    title="Odśwież dostępne formatki"
                  />
                )}
                {activePaleta && saPozostaleFormatki && (
                  <Popconfirm
                    title="Dodać wszystkie pozostałe formatki?"
                    description="Sprawdzi dostępność i doda tylko te formatki, które nie są jeszcze przypisane"
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
            title={editMode ? "Edycja palety" : "Palety"}
            size="small"
            extra={
              <Space>
                {!editMode && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      utworzPalete();
                      setHasUnsavedChanges(true);
                    }}
                  >
                    Nowa paleta
                  </Button>
                )}
                <Button 
                  icon={<SaveOutlined />}
                  type="primary"
                  onClick={handleSaveAll}
                  disabled={palety.length === 0 || saving || loading}
                  loading={saving || loading}
                  style={{ 
                    background: hasUnsavedChanges ? '#faad14' : '#52c41a', 
                    borderColor: hasUnsavedChanges ? '#faad14' : '#52c41a'
                  }}
                >
                  {saving || loading ? 'Zapisywanie...' : 
                   hasUnsavedChanges ? `⚠️ Zapisz zmiany (${palety.length})` : 
                   editMode ? 'Zapisz zmiany' : `Zapisz wszystkie (${palety.length})`}
                </Button>
                {onCancel && (
                  <Button onClick={onCancel}>
                    Anuluj
                  </Button>
                )}
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
                  onChangeDestination={(dest) => {
                    zmienPrzeznaczenie(paleta.id, dest);
                    setHasUnsavedChanges(true);
                  }}
                  onCopy={() => {
                    if (!editMode) {
                      kopiujPalete(paleta.id);
                      setHasUnsavedChanges(true);
                    }
                  }}
                  onDelete={() => !editMode && handleUsunPalete(paleta.id)}
                  onRemoveFormatka={(fId) => {
                    usunFormatkiZPalety(paleta.id, fId);
                    setHasUnsavedChanges(true);
                  }}
                  onAddAllRemaining={() => dodajWszystkieReszteFormatek(paleta.id)}
                />
              ))}
              
              {palety.length === 0 && (
                <Empty 
                  description={editMode ? "Brak formatek na palecie" : "Brak utworzonych palet"}
                  style={{ padding: 40 }}
                >
                  {!editMode && (
                    <Button type="primary" onClick={() => {
                      utworzPalete();
                      setHasUnsavedChanges(true);
                    }}>
                      Utwórz pierwszą paletę
                    </Button>
                  )}
                </Empty>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Statystyki */}
      {palety.length > 0 && (
        <PaletyStats
          palety={palety}
          formatki={formatki}
          pozostaleIlosci={pozostaleIlosci}
          obliczStatystykiPalety={obliczStatystykiPalety}
        />
      )}

      {/* NAPRAWIONE: Ostrzeżenie o niezapisanych zmianach */}
      {hasUnsavedChanges && (
        <Alert
          message="Masz niezapisane zmiany!"
          description="Pamiętaj o zapisaniu palet przed opuszczeniem strony lub odświeżeniem."
          type="warning"
          showIcon
          style={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          action={
            <Space direction="vertical">
              <Button 
                type="primary" 
                size="small"
                onClick={handleSaveAll}
                loading={saving}
              >
                Zapisz teraz
              </Button>
            </Space>
          }
        />
      )}
    </div>
  );
};