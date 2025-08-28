import React, { useState } from 'react';
import { Modal, Form, Button, Space, Divider, notification } from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

// Komponenty
import { RozkrojSelector } from './RozkrojSelector';
import { KolorePlytyTable } from './KolorePlytyTable';
import { RozkrojPreview } from './RozkrojPreview';
import { PozycjaStatistics } from './PozycjaStatistics';
import { ValidationAlerts } from './ValidationAlerts';
import { SystemInfoAlert } from './SystemInfoAlert';
import { PozycjaAdditionalOptions } from './PozycjaAdditionalOptions';

// Hooks
import { usePlyty } from '../../hooks/usePlyty';
import { useRozkroje } from '../../hooks/useRozkroje';
import { usePozycjaValidation } from '../../hooks/usePozycjaValidation';

// Services
import { PozycjaService } from '../../services/PozycjaService';

// Types
import type { 
  AddPozycjaModalProps, 
  KolorPlyty,
  AddPozycjaFormData 
} from './types';

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
  const [selectedRozkrojId, setSelectedRozkrojId] = useState<number | null>(null);

  // Hooks
  const { plyty, loading: plytyLoading } = usePlyty();
  const { rozkroje, loading: rozkrojeLoading } = useRozkroje();
  const selectedRozkroj = rozkroje.find(r => r.id === selectedRozkrojId) || null;
  
  // Walidacja
  const { validationErrors, isFormValid } = usePozycjaValidation(
    selectedRozkroj,
    kolorePlyty,
    plyty
  );

  // Handlers
  const handleSubmit = async (values: AddPozycjaFormData) => {
    try {
      if (!isFormValid) {
        notification.error({
          message: 'Formularz zawiera błędy',
          description: 'Popraw wszystkie błędy przed wysłaniem',
          duration: 4,
        });
        return;
      }
      
      setLoading(true);
      
      const result = await PozycjaService.addPozycja({
        zko_id: zkoId,
        rozkroj_id: selectedRozkrojId!,
        kolory_plyty: kolorePlyty.filter(p => p.kolor),
        kolejnosc: values.kolejnosc || null,
        uwagi: values.uwagi || null,
      });
      
      if (result.sukces) {
        PozycjaService.showSuccessNotification(result);
        resetForm();
        onSuccess();
      } else {
        throw new Error(result.komunikat || 'Nieznany błąd');
      }
    } catch (error: any) {
      notification.error({
        message: 'Błąd',
        description: error.message || 'Wystąpił nieoczekiwany błąd',
        duration: 5,
      });
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
    form.setFieldsValue({ rozkroj_id: rozkrojId });
  };

  const updateKolorPlyty = (index: number, field: string, value: any) => {
    const newKolory = [...kolorePlyty];
    if (field === '__FULL_UPDATE__') {
      newKolory[index] = value;
    } else {
      newKolory[index] = { ...newKolory[index], [field]: value };
    }
    setKolorePlyty(newKolory);
  };

  // Obliczenia
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
        
        <ValidationAlerts validationErrors={validationErrors} />

        <PozycjaStatistics
          kolorePlytyCount={kolorePlyty.filter(k => k.kolor).length}
          totalKolory={kolorePlyty.length}
          totalPlyty={getTotalPlyty()}
          totalFormatki={getTotalFormatki()}
          isFormValid={isFormValid}
        />

        {/* Wybór rozkroju */}
        <Form.Item
          name="rozkroj_id"
          label={<Space><InfoCircleOutlined />Rozkrój</Space>}
          rules={[{ required: true, message: 'Wybierz rozkrój' }]}
        >
          <RozkrojSelector
            rozkroje={rozkroje}
            loading={rozkrojeLoading}
            onChange={handleRozkrojChange}
          />
        </Form.Item>

        {selectedRozkroj && <RozkrojPreview rozkroj={selectedRozkroj} />}

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
          onRemoveKolor={(index) => {
            if (kolorePlyty.length > 1) {
              setKolorePlyty(kolorePlyty.filter((_, i) => i !== index));
            }
          }}
        />

        <Button
          type="dashed"
          onClick={() => setKolorePlyty([...kolorePlyty, { kolor: '', nazwa: '', ilosc: 1 }])}
          icon={<PlusOutlined />}
          style={{ width: '100%', marginBottom: 16, marginTop: 16 }}
          size="large"
        >
          Dodaj kolejny kolor płyty
        </Button>

        <PozycjaAdditionalOptions />
        <SystemInfoAlert />
      </Form>
    </Modal>
  );
};
