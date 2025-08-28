import React, { useState } from 'react';
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
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
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

  // Używamy nowych hooków
  const { plyty, loading: plytyLoading } = usePlyty();
  const { rozkroje, loading: rozkrojeLoading } = useRozkroje();

  // Stan wybranego rozkroju
  const [selectedRozkrojId, setSelectedRozkrojId] = useState<number | null>(null);
  const selectedRozkroj = rozkroje.find(r => r.id === selectedRozkrojId) || null;

  const handleSubmit = async (values: AddPozycjaFormData) => {
    try {
      setLoading(true);
      
      // Walidacja
      if (!selectedRozkroj) {
        message.error('Wybierz rozkrój');
        return;
      }
      
      if (kolorePlyty.length === 0 || 
          kolorePlyty.some(p => !p.kolor || !p.nazwa || p.ilosc <= 0)) {
        message.error('Dodaj przynajmniej jeden kolor płyty z poprawną ilością');
        return;
      }
      
      // Sprawdź limity płyt
      const violations = kolorePlyty.filter(p => {
        const plyta = plyty.find(pl => pl.kolor_nazwa === p.kolor);
        return plyta && plyta.grubosc >= 18 && p.ilosc > 5;
      });
      
      if (violations.length > 0) {
        message.error('Maksymalna liczba płyt 18mm+ w pozycji to 5. Dla cieńszych można więcej.');
        return;
      }
      
      // Sprawdź stan magazynowy
      const stockViolations = kolorePlyty.filter(p => 
        p.ilosc > (p.stan_magazynowy || 0)
      );
      
      if (stockViolations.length > 0) {
        message.error('Niektóre płyty przekraczają stan magazynowy!');
        return;
      }
      
      const requestData = {
        zko_id: zkoId,
        rozkroj_id: values.rozkroj_id,
        kolory_plyty: kolorePlyty,
        kolejnosc: values.kolejnosc || null,
        uwagi: values.uwagi || null,
      };
      
      // POPRAWKA: Używamy portu 5000 (ZKO-SERVICE) przez proxy
      const response = await fetch('/api/zko/pozycje/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas dodawania pozycji');
      }
      
      const result = await response.json();
      
      if (result.sukces) {
        message.success(result.komunikat || 'Pozycja została dodana pomyślnie');
        resetForm();
        onSuccess();
      } else {
        throw new Error(result.komunikat || 'Błąd podczas dodawania pozycji');
      }
      
    } catch (error: any) {
      console.error('Error adding pozycja:', error);
      message.error(error.message || 'Błąd podczas dodawania pozycji');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setKolorePlyty([{ kolor: '', nazwa: '', ilosc: 1 }]);
    setSelectedRozkrojId(null);
  };

  const handleRozkrojChange = (rozkrojId: number) => {
    setSelectedRozkrojId(rozkrojId);
  };

  const addKolorPlyty = () => {
    setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }]);
  };

  const removeKolorPlyty = (index: number) => {
    if (kolorePlyty.length > 1) {
      setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
    }
  };

  // POPRAWKA: Obsługa pełnej aktualizacji obiektu
  const updateKolorPlyty = (index: number, field: string, value: any) => {
    console.log('🔄 updateKolorPlyty called:', { index, field, value, currentState: kolorePlyty });
    
    const newKolory = [...kolorePlyty];
    
    if (field === '__FULL_UPDATE__') {
      // Pełna aktualizacja obiektu
      console.log('🚀 Pełna aktualizacja obiektu na pozycji', index, ':', value);
      newKolory[index] = value;
    } else {
      // Aktualizacja pojedynczego pola
      newKolory[index] = { ...newKolory[index], [field]: value };
    }
    
    console.log('✨ New state will be:', newKolory);
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

  const getValidationErrors = () => {
    const errors = [];
    
    if (!selectedRozkroj) {
      errors.push('Nie wybrano rozkroju');
    }
    
    const emptyColors = kolorePlyty.filter(p => !p.kolor);
    if (emptyColors.length > 0) {
      errors.push(`${emptyColors.length} pozycji bez wybranej płyty`);
    }
    
    const stockErrors = kolorePlyty.filter(p => p.ilosc > (p.stan_magazynowy || 0));
    if (stockErrors.length > 0) {
      errors.push(`${stockErrors.length} pozycji przekracza stan magazynowy`);
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();
  const isFormValid = validationErrors.length === 0;

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
          {isFormValid ? 'Dodaj pozycję' : `Błędy: ${validationErrors.length}`}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        {/* Status walidacji */}
        {validationErrors.length > 0 && (
          <Alert
            message="Formularz zawiera błędy"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="warning"
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
                value={kolorePlyty.length}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Łączna ilość płyt"
                value={getTotalPlyty()}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Formatki do wyprodukowania"
                value={getTotalFormatki()}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Status"
                value={isFormValid ? 'OK' : 'Błędy'}
                valueStyle={{ 
                  color: isFormValid ? '#3f8600' : '#cf1322' 
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
              description={`${selectedRozkroj.opis} | Rozmiar płyty: ${selectedRozkroj.rozmiar_plyty}`}
              type="info"
              style={{ marginBottom: 16 }}
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
            Kolory płyt
          </Space>
        </Divider>
        
        <KolorePlytyTable
          kolorePlyty={kolorePlyty}
          plyty={plyty}
          plytyLoading={plytyLoading}
          searchText=""
          onSearchChange={() => {}} // Nie używane już
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
          Dodaj kolejny kolor płyty
        </Button>

        {/* Opcje dodatkowe */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="kolejnosc" label="Kolejność (opcjonalne)">
              <InputNumber 
                min={1} 
                placeholder="Kolejność wykonania" 
                style={{ width: '100%' }} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="uwagi" label="Uwagi (opcjonalne)">
              <Select mode="tags" placeholder="Dodaj uwagi" style={{ width: '100%' }}>
                <Option value="Priorytet wysoki">Priorytet wysoki</Option>
                <Option value="Uwaga na wymiary">Uwaga na wymiary</Option>
                <Option value="Specjalne oklejenie">Specjalne oklejenie</Option>
                <Option value="Kontrola jakości">Kontrola jakości</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Alert
          message="Informacje o systemie"
          description={
            <div>
              <div>• Maksymalna liczba płyt 18mm+ w pozycji: 5 sztuk</div>
              <div>• Dla płyt cieńszych można dodać więcej</div>
              <div>• System automatycznie sprawdza dostępność magazynową</div>
              <div>• Każda płyta ma własny selektor z filtrowaniem</div>
              <div>• <strong>Backend ZKO-SERVICE działa na porcie 5000 przez proxy</strong></div>
              <div>• <strong>Nowy interfejs:</strong> Karty zamiast długich list rozwijanych</div>
            </div>
          }
          type="info"
          showIcon
        />
      </Form>
    </Modal>
  );
};
