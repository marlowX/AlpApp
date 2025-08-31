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

  // NAPRAWIONA funkcja zapisywania - NIE czyści palet przed wysłaniem
  const handleSaveAll = async () => {
    if (!pozycjaId) {
      message.error('Brak ID pozycji - nie można zapisać palet');
      return;
    }

    // Skopiuj palety PRZED czyszczeniem, filtruj puste
    const paletySkladowe = palety.filter(p => p.formatki && p.formatki.length > 0);
    
    console.log('📋 Palety do zapisania:', paletySkladowe);
    
    if (paletySkladowe.length === 0) {
      message.warning('Brak palet z formatkami do zapisania');
      return;
    }

    try {
      setSaving(true);
      message.info(`Zapisywanie ${paletySkladowe.length} palet...`);
      
      // Przygotuj dane do wysłania
      const payload = {
        pozycja_id: Number(pozycjaId),
        palety: paletySkladowe.map((p, index) => ({
          formatki: p.formatki.map(f => ({
            formatka_id: Number(f.formatka_id),
            ilosc: Number(f.ilosc)
          })),
          przeznaczenie: p.przeznaczenie || 'MAGAZYN',
          max_waga: Number(p.max_waga || 700),
          max_wysokosc: Number(p.max_wysokosc || 1440),
          operator: 'user',
          uwagi: p.uwagi || `Paleta ${index + 1} z pozycji ${pozycjaId}`
        }))
      };
      
      console.log('📤 Wysyłam dane do API:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/pallets/manual/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Odpowiedź z API:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      if (response.ok && data.sukces) {
        const utworzonePalety = data.palety_utworzone || [];
        
        // Wyczyść lokalne palety TYLKO po pomyślnym zapisie
        wyczyscPalety();
        
        message.success({
          content: `✅ Pomyślnie zapisano ${utworzonePalety.length} palet do bazy danych!`,
          duration: 3
        });
        
        // Callback do rodzica
        if (onSave) {
          onSave(utworzonePalety);
        }
        
        // Odśwież dane po krótkim opóźnieniu
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
        
      } else {
        // Obsługa błędów API - NIE czyść palet przy błędzie!
        console.error('❌ Błąd API:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
        
        if (data.details) {
          message.error({
            content: `Błąd: ${data.error}\nSzczegóły: ${data.details}`,
            duration: 5
          });
        } else if (data.error) {
          message.error({
            content: `Błąd zapisywania: ${data.error}`,
            duration: 5
          });
        } else {
          message.error('Nieznany błąd zapisywania palet');
        }
      }
      
    } catch (error) {
      console.error('❌ Błąd połączenia:', error);
      message.error({
        content: 'Błąd połączenia z serwerem. Sprawdź czy backend działa.',
        duration: 5
      });
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
                  disabled={palety.length === 0 || saving}
                  loading={saving || loading}
                  style={{ 
                    background: '#52c41a', 
                    borderColor: '#52c41a' 
                  }}
                >
                  {saving ? 'Zapisywanie...' : `Zapisz wszystkie (${palety.length})`}
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