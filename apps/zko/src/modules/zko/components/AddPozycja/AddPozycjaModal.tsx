import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  Alert,
  message,
  Divider,
  Card,
  Row,
  Col,
  Tag,
  Statistic,
  notification
} from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';
import { RozkrojSelector } from './RozkrojSelector';
import { KolorePlytyTable } from './KolorePlytyTable';
import { FormatkiPreview } from './FormatkiPreview';
import { usePlyty } from '../../hooks/usePlyty';
import { useRozkroje } from '../../hooks/useRozkroje';
import type { 
  AddPozycjaModalProps, 
  KolorPlyty,
  AddPozycjaFormData 
} from './types';

const { Option } = Select;

export const AddPozycjaModal: React.FC<AddPozycjaModalProps> = ({
  visible,
  zkoId,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm<AddPozycjaFormData>();
  const [loading, setLoading] = useState(false);
  const [kolorePlyty, setKolorePlyty] = useState<KolorPlyty[]>([{ 
    kolor: '', 
    nazwa: '', 
    ilosc: 1 
  }]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Używamy nowych hooków
  const { plyty, loading: plytyLoading } = usePlyty();
  const { rozkroje, loading: rozkrojeLoading } = useRozkroje();

  // Stan wybranego rozkroju
  const [selectedRozkrojId, setSelectedRozkrojId] = useState<number | null>(null);
  const selectedRozkroj = rozkroje.find(r => r.id === selectedRozkrojId) || null;

  // Walidacja w czasie rzeczywistym
  useEffect(() => {
    const errors = [];
    
    if (!selectedRozkroj) {
      errors.push('Nie wybrano rozkroju');
    }
    
    kolorePlyty.forEach((plyta, index) => {
      if (!plyta.kolor) {
        errors.push(`Pozycja ${index + 1}: Nie wybrano płyty`);
      } else {
        // Sprawdź stan magazynowy
        if (plyta.ilosc > (plyta.stan_magazynowy || 0)) {
          errors.push(`Pozycja ${index + 1} (${plyta.kolor}): Ilość ${plyta.ilosc} przekracza stan magazynowy (${plyta.stan_magazynowy})`);
        }
        
        // Sprawdź limit dla grubych płyt
        const plytaInfo = plyty.find(p => p.kolor_nazwa === plyta.kolor);
        if (plytaInfo && plytaInfo.grubosc >= 18 && plyta.ilosc > 5) {
          errors.push(`Pozycja ${index + 1} (${plyta.kolor}): Maksymalna ilość płyt ≥18mm to 5 sztuk`);
        }
      }
    });
    
    // Sprawdź duplikaty
    const kolory = kolorePlyty.filter(p => p.kolor).map(p => p.kolor);
    const duplikaty = kolory.filter((item, index) => kolory.indexOf(item) !== index);
    if (duplikaty.length > 0) {
      errors.push(`Duplikaty kolorów: ${duplikaty.join(', ')}`);
    }
    
    setValidationErrors(errors);
  }, [selectedRozkroj, kolorePlyty, plyty]);

  const handleSubmit = async (values: AddPozycjaFormData) => {
    try {
      // Ostateczna walidacja przed wysłaniem
      if (validationErrors.length > 0) {
        notification.error({
          message: 'Formularz zawiera błędy',
          description: (
            <div>
              <div>Popraw następujące błędy:</div>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {validationErrors.map((error, i) => (
                  <li key={i} style={{ color: '#ff4d4f' }}>{error}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 6,
        });
        return;
      }
      
      setLoading(true);
      
      const requestData = {
        zko_id: zkoId,
        rozkroj_id: selectedRozkrojId,
        kolory_plyty: kolorePlyty.filter(p => p.kolor), // Tylko wypełnione pozycje
        kolejnosc: values.kolejnosc || null,
        uwagi: values.uwagi || null,
      };
      
      console.log('📤 Wysyłanie danych:', requestData);
      
      const response = await fetch('/api/zko/pozycje/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Szczegółowa obsługa błędów z backendu
        if (response.status === 400 && result.details) {
          // Błędy walidacji z Zod
          const zodErrors = result.details.map((err: any) => 
            `${err.path.join('.')}: ${err.message}`
          );
          
          notification.error({
            message: 'Błąd walidacji danych',
            description: (
              <div>
                <div>Backend odrzucił dane z następujących powodów:</div>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                  {zodErrors.map((error: string, i: number) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 8,
          });
        } else if (response.status === 500) {
          // Błąd serwera - prawdopodobnie problem z funkcją PostgreSQL
          notification.error({
            message: 'Błąd serwera',
            description: (
              <div>
                <div>{result.error || 'Wystąpił błąd podczas dodawania pozycji'}</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  💡 Możliwe przyczyny:
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                    <li>Funkcja PostgreSQL nie istnieje w schemacie 'zko'</li>
                    <li>Nieprawidłowe parametry funkcji</li>
                    <li>Problem z połączeniem do bazy danych</li>
                  </ul>
                </div>
              </div>
            ),
            duration: 10,
          });
        } else {
          throw new Error(result.error || `Błąd HTTP ${response.status}`);
        }
        return;
      }
      
      if (result.sukces) {
        notification.success({
          message: 'Sukces!',
          description: (
            <div>
              <div>{result.komunikat || 'Pozycja została dodana pomyślnie'}</div>
              {result.pozycje_ids && (
                <div style={{ marginTop: 4 }}>
                  ID pozycji: {result.pozycje_ids.join(', ')}
                </div>
              )}
              {result.formatki_dodane && (
                <div style={{ marginTop: 2 }}>
                  Formatek do produkcji: {result.formatki_dodane}
                </div>
              )}
            </div>
          ),
          duration: 5,
        });
        resetForm();
        onSuccess();
      } else {
        throw new Error(result.komunikat || 'Nieznany błąd');
      }
      
    } catch (error: any) {
      console.error('❌ Error adding pozycja:', error);
      
      // Obsługa błędów sieciowych
      if (error.message === 'Failed to fetch') {
        notification.error({
          message: 'Błąd połączenia',
          description: 'Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 5000.',
          duration: 6,
        });
      } else {
        notification.error({
          message: 'Błąd',
          description: error.message || 'Wystąpił nieoczekiwany błąd',
          duration: 5,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setKolorePlyty([{ kolor: '', nazwa: '', ilosc: 1 }]);
    setSelectedRozkrojId(null);
    setValidationErrors([]);
  };

  const handleRozkrojChange = (rozkrojId: number) => {
    setSelectedRozkrojId(rozkrojId);
    form.setFieldsValue({ rozkroj_id: rozkrojId });
  };

  const addKolorPlyty = () => {
    setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }]);
  };

  const removeKolorPlyty = (index: number) => {
    if (kolorePlyty.length > 1) {
      setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
    }
  };

  const updateKolorPlyty = (index: number, field: string, value: any) => {
    console.log('🔄 updateKolorPlyty:', { index, field, value });
    
    const newKolory = [...kolorePlyty];
    
    if (field === '__FULL_UPDATE__') {
      newKolory[index] = value;
    } else {
      newKolory[index] = { ...newKolory[index], [field]: value };
    }
    
    setKolorePlyty(newKolory);
  };

  const getTotalFormatki = () => {
    if (!selectedRozkroj) return 0;
    return kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      const formatkiCount = selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
      return total + formatkiCount;
    }, 0);
  };

  const getTotalPlyty = () => {
    return kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  };

  const isFormValid = validationErrors.length === 0 && selectedRozkroj && 
                      kolorePlyty.some(p => p.kolor);

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          Dodaj pozycję do ZKO #{zkoId}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1400}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Anuluj
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={() => form.submit()}
          disabled={!isFormValid}
          icon={isFormValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
        >
          {loading ? 'Dodawanie...' : 
           isFormValid ? 'Dodaj pozycję' : 
           `Popraw błędy (${validationErrors.length})`}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        {/* Status walidacji - pokazuj tylko gdy są błędy */}
        {validationErrors.length > 0 && (
          <Alert
            message={`Formularz zawiera ${validationErrors.length} ${validationErrors.length === 1 ? 'błąd' : 'błędów'}`}
            description={
              <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 150, overflowY: 'auto' }}>
                {validationErrors.map((error, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    {error}
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statystyki na górze */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Kolory płyt"
                value={kolorePlyty.filter(k => k.kolor).length}
                suffix={`/ ${kolorePlyty.length}`}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Łączna ilość płyt"
                value={getTotalPlyty()}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Formatki do produkcji"
                value={getTotalFormatki()}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Status"
                value={isFormValid ? 'Gotowe' : 'Uzupełnij'}
                valueStyle={{ 
                  color: isFormValid ? '#3f8600' : '#cf1322',
                  fontSize: '16px'
                }}
                prefix={isFormValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Wybór rozkroju */}
        <Form.Item
          name="rozkroj_id"
          label={
            <Space>
              <InfoCircleOutlined />
              Rozkrój
            </Space>
          }
          rules={[{ required: true, message: 'Wybierz rozkrój' }]}
        >
          <RozkrojSelector
            rozkroje={rozkroje}
            loading={rozkrojeLoading}
            onChange={handleRozkrojChange}
          />
        </Form.Item>

        {/* Podgląd rozkroju */}
        {selectedRozkroj && (
          <>
            <Alert
              message={`Wybrany rozkrój: ${selectedRozkroj.kod_rozkroju}`}
              description={
                <div>
                  <div>{selectedRozkroj.opis}</div>
                  <div>Rozmiar płyty: {selectedRozkroj.rozmiar_plyty}</div>
                  <div>Formatek w rozkroju: {selectedRozkroj.formatki.length}</div>
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
              icon={<CheckCircleOutlined />}
            />

            <Card 
              title={
                <Space>
                  <InfoCircleOutlined />
                  Formatki w rozkroju ({selectedRozkroj.formatki.length})
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <FormatkiPreview formatki={selectedRozkroj.formatki} />
            </Card>
          </>
        )}

        {/* Kolory płyt */}
        <Divider orientation="left">
          <Space>
            Kolory płyt ({kolorePlyty.filter(k => k.kolor).length} wybranych)
          </Space>
        </Divider>
        
        <KolorePlytyTable
          kolorePlyty={kolorePlyty}
          plyty={plyty}
          plytyLoading={plytyLoading}
          searchText=""
          onSearchChange={() => {}}
          onUpdateKolor={updateKolorPlyty}
          onRemoveKolor={removeKolorPlyty}
        />

        <Button
          type="dashed"
          onClick={addKolorPlyty}
          icon={<PlusOutlined />}
          style={{ width: '100%', marginBottom: 16, marginTop: 16 }}
          size="large"
        >
          Dodaj kolejny kolor płyty (max. różnych kolorów: bez limitu)
        </Button>

        {/* Opcje dodatkowe */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="kolejnosc" label="Kolejność (opcjonalne)">
              <InputNumber 
                min={1} 
                placeholder="Kolejność wykonania (1 = najwyższy priorytet)" 
                style={{ width: '100%' }} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="uwagi" label="Uwagi (opcjonalne)">
              <Select mode="tags" placeholder="Dodaj uwagi lub wpisz własne" style={{ width: '100%' }}>
                <Option value="PILNE">PILNE</Option>
                <Option value="Priorytet wysoki">Priorytet wysoki</Option>
                <Option value="Uwaga na wymiary">Uwaga na wymiary</Option>
                <Option value="Specjalne oklejenie">Specjalne oklejenie</Option>
                <Option value="Kontrola jakości">Kontrola jakości</Option>
                <Option value="Delikatna płyta">Delikatna płyta</Option>
                <Option value="Najpierw wykonać">Najpierw wykonać</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Alert
          message="Informacje o limitach i systemie"
          description={
            <Space direction="vertical" size="small">
              <div>• <strong>Płyty ≥18mm:</strong> Maksymalnie 5 sztuk w pozycji (ograniczenie wagowe)</div>
              <div>• <strong>Płyty <18mm:</strong> Limit do 50 sztuk w pozycji</div>
              <div>• <strong>Stan magazynowy:</strong> System automatycznie sprawdza dostępność</div>
              <div>• <strong>Duplikaty:</strong> Ten sam kolor może wystąpić tylko raz w pozycji</div>
              <div>• <strong>Backend:</strong> ZKO-SERVICE na porcie 5000 (PostgreSQL schema: zko)</div>
              <div>• <strong>Wyszukiwanie:</strong> Wpisz część nazwy - system znajdzie pasujące płyty</div>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Form>
    </Modal>
  );
};
