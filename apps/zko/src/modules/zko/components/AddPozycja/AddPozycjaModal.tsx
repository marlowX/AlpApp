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
  Tag
} from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PlytySelector } from './PlytySelector';
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
  const [searchText, setSearchText] = useState('');
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
      
      const response = await fetch('http://localhost:5000/api/zko/pozycje/add', {
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
    setSearchText('');
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

  const updateKolorPlyty = (index: number, field: string, value: any) => {
    const newKolory = [...kolorePlyty];
    newKolory[index] = { ...newKolory[index], [field]: value };
    
    // Auto-fill gdy wybieramy płytę
    if (field === 'kolor') {
      const plyta = plyty.find(p => p.kolor_nazwa === value);
      if (plyta) {
        newKolory[index] = {
          ...newKolory[index],
          nazwa: plyta.nazwa,
          plyta_id: plyta.id,
          stan_magazynowy: plyta.stan_magazynowy,
          grubosc: plyta.grubosc
        };
      }
    }
    
    setKolorePlyty(newKolory);
  };

  const getTotalFormatki = () => {
    if (!selectedRozkroj) return 0;
    return kolorePlyty.reduce((total, kolor) => {
      const formatkiCount = selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
      return total + formatkiCount;
    }, 0);
  };

  return (
    <Modal
      title="Dodaj pozycję do ZKO"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Anuluj
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={() => form.submit()}
          disabled={!selectedRozkroj || kolorePlyty.length === 0}
        >
          Dodaj pozycję
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        {/* Wybór rozkroju */}
        <Form.Item
          name="rozkroj_id"
          label="Rozkrój"
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
                  Formatki w rozkroju
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
            Kolory płyt ({kolorePlyty.length})
            {selectedRozkroj && (
              <Tag color="success">
                Łącznie formatek: {getTotalFormatki()}
              </Tag>
            )}
          </Space>
        </Divider>
        
        <KolorePlytyTable
          kolorePlyty={kolorePlyty}
          plyty={plyty}
          plytyLoading={plytyLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          onUpdateKolor={updateKolorPlyty}
          onRemoveKolor={removeKolorPlyty}
        />

        <Button
          type="dashed"
          onClick={addKolorPlyty}
          icon={<PlusOutlined />}
          style={{ width: '100%', marginBottom: 16, marginTop: 16 }}
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
          message="Informacje o limitach"
          description={
            <div>
              <div>• Maksymalna liczba płyt 18mm+ w pozycji: 5 sztuk</div>
              <div>• Dla płyt cieńszych można dodać więcej</div>
              <div>• System sprawdza dostępność magazynową</div>
              <div>• Płyty sortowane wg popularności (stan magazynowy)</div>
              <div>• Filtrowanie płyt działa w czasie rzeczywistym</div>
            </div>
          }
          type="info"
          showIcon
        />
      </Form>
    </Modal>
  );
};
