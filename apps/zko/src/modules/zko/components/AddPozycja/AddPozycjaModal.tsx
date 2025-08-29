import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Space, Steps, notification } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

// Komponenty dla kroków
import { Step1Rozkroj } from './steps/Step1Rozkroj';
import { Step2Plyty } from './steps/Step2Plyty';
import { Step3Opcje } from './steps/Step3Opcje';

// Hooks
import { usePlyty } from '../../hooks/usePlyty';
import { useRozkroje } from '../../hooks/useRozkroje';
import { usePozycjaValidation } from '../../hooks/usePozycjaValidation';

// Services
import { PozycjaService } from '../../services/PozycjaService';
import zkoApi from '../../services/zkoApi';

// Types
import type { 
  AddPozycjaModalProps, 
  KolorPlyty,
  AddPozycjaFormData 
} from './types';

const { Step } = Steps;

interface ExtendedAddPozycjaModalProps extends AddPozycjaModalProps {
  editMode?: boolean;
  pozycjaToEdit?: any;
}

export const AddPozycjaModal: React.FC<ExtendedAddPozycjaModalProps> = ({
  visible,
  zkoId,
  onCancel,
  onSuccess,
  editMode = false,
  pozycjaToEdit = null
}) => {
  const [form] = Form.useForm<AddPozycjaFormData>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Dane formularza
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
  const { 
    validationErrors, 
    isFormValid, 
    touchForm, 
    resetValidation,
    hasBeenTouched 
  } = usePozycjaValidation(
    selectedRozkroj,
    kolorePlyty,
    plyty,
    { validateOnMount: false }
  );

  // Załaduj dane do edycji
  useEffect(() => {
    if (editMode && pozycjaToEdit && visible) {
      // Ustaw rozkrój
      setSelectedRozkrojId(pozycjaToEdit.rozkroj_id);
      
      // Ustaw kolory płyt
      const koloryData: KolorPlyty[] = [];
      if (pozycjaToEdit.kolor_plyty && pozycjaToEdit.nazwa_plyty && pozycjaToEdit.ilosc_plyt) {
        koloryData.push({
          kolor: pozycjaToEdit.kolor_plyty,
          nazwa: pozycjaToEdit.nazwa_plyty,
          ilosc: pozycjaToEdit.ilosc_plyt
        });
      }
      
      // Jeśli są dodatkowe kolory (jeśli pozycja ma formatki z różnymi kolorami)
      if (pozycjaToEdit.kolory_plyty && Array.isArray(pozycjaToEdit.kolory_plyty)) {
        pozycjaToEdit.kolory_plyty.forEach((kp: any) => {
          if (!koloryData.some(k => k.kolor === kp.kolor)) {
            koloryData.push({
              kolor: kp.kolor,
              nazwa: kp.nazwa,
              ilosc: kp.ilosc
            });
          }
        });
      }
      
      if (koloryData.length > 0) {
        setKolorePlyty(koloryData);
      }
      
      // Ustaw opcje dodatkowe
      form.setFieldsValue({
        kolejnosc: pozycjaToEdit.kolejnosc,
        uwagi: pozycjaToEdit.uwagi
      });
    }
  }, [editMode, pozycjaToEdit, visible, form]);

  // Obsługa kroków
  const next = () => {
    // Walidacja przed przejściem dalej
    if (currentStep === 0 && !selectedRozkroj) {
      notification.warning({
        message: 'Wybierz rozkrój',
        description: 'Musisz wybrać rozkrój zanim przejdziesz dalej',
        duration: 3,
      });
      return;
    }
    
    if (currentStep === 1 && !kolorePlyty.some(p => p.kolor)) {
      notification.warning({
        message: 'Dodaj przynajmniej jedną płytę',
        description: 'Musisz wybrać co najmniej jedną płytę do rozkroju',
        duration: 3,
      });
      return;
    }
    
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handlers
  const handleSubmit = async () => {
    try {
      if (!hasBeenTouched) {
        touchForm();
      }
      
      if (!isFormValid) {
        notification.error({
          message: 'Formularz zawiera błędy',
          description: 'Sprawdź wszystkie kroki i popraw błędy',
          duration: 4,
        });
        return;
      }
      
      setLoading(true);
      
      const values = form.getFieldsValue();
      
      if (editMode && pozycjaToEdit) {
        // Tryb edycji - użyj funkcji edycji
        
        // W trybie edycji obsługujemy tylko jedną płytę (ograniczenie funkcji PostgreSQL)
        const pierwszyKolor = kolorePlyty.find(p => p.kolor) || kolorePlyty[0];
        
        const editData = {
          rozkroj_id: selectedRozkrojId !== pozycjaToEdit.rozkroj_id ? selectedRozkrojId : undefined,
          ilosc_plyt: pierwszyKolor.ilosc !== pozycjaToEdit.ilosc_plyt ? pierwszyKolor.ilosc : undefined,
          kolor_plyty: pierwszyKolor.kolor !== pozycjaToEdit.kolor_plyty ? pierwszyKolor.kolor : undefined,
          nazwa_plyty: pierwszyKolor.nazwa !== pozycjaToEdit.nazwa_plyty ? pierwszyKolor.nazwa : undefined,
          kolejnosc: values.kolejnosc !== pozycjaToEdit.kolejnosc ? values.kolejnosc : undefined,
          uwagi: values.uwagi !== pozycjaToEdit.uwagi ? values.uwagi : undefined
        };
        
        // Usuń undefined wartości
        Object.keys(editData).forEach(key => {
          if (editData[key as keyof typeof editData] === undefined) {
            delete editData[key as keyof typeof editData];
          }
        });
        
        const result = await zkoApi.editPozycja(pozycjaToEdit.id, editData);
        
        if (result.sukces) {
          notification.success({
            message: 'Sukces',
            description: result.komunikat || 'Pozycja została zaktualizowana',
            duration: 3,
          });
          resetForm();
          onSuccess();
        } else {
          throw new Error(result.komunikat || 'Nieznany błąd');
        }
      } else {
        // Tryb dodawania - użyj istniejącej logiki
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
    setCurrentStep(0);
    resetValidation();
  };

  const handleRozkrojChange = (rozkrojId: number) => {
    setSelectedRozkrojId(rozkrojId);
    form.setFieldsValue({ rozkroj_id: rozkrojId });
    if (!hasBeenTouched) {
      touchForm();
    }
  };

  const updateKolorPlyty = (index: number, field: string, value: any) => {
    const newKolory = [...kolorePlyty];
    if (field === '__FULL_UPDATE__') {
      newKolory[index] = value;
      if (!hasBeenTouched && value.kolor) {
        touchForm();
      }
    } else {
      newKolory[index] = { ...newKolory[index], [field]: value };
    }
    setKolorePlyty(newKolory);
  };

  // Kroki wizarda
  const steps = [
    {
      title: 'Wybierz rozkrój',
      content: (
        <Step1Rozkroj
          rozkroje={rozkroje}
          loading={rozkrojeLoading}
          selectedRozkrojId={selectedRozkrojId}
          onChange={handleRozkrojChange}
        />
      ),
    },
    {
      title: editMode ? 'Edytuj płyty' : 'Dodaj płyty',
      content: (
        <Step2Plyty
          kolorePlyty={kolorePlyty}
          setKolorePlyty={setKolorePlyty}
          plyty={plyty}
          plytyLoading={plytyLoading}
          onUpdateKolor={updateKolorPlyty}
          selectedRozkroj={selectedRozkroj}
        />
      ),
    },
    {
      title: 'Opcje dodatkowe',
      content: (
        <Step3Opcje
          form={form}
          kolorePlyty={kolorePlyty}
          selectedRozkroj={selectedRozkroj}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          {editMode ? <EditOutlined /> : <PlusOutlined />}
          {editMode ? `Edytuj pozycję #${pozycjaToEdit?.id}` : `Dodaj pozycję do ZKO #${zkoId}`}
        </Space>
      }
      open={visible}
      onCancel={() => {
        resetForm();
        onCancel();
      }}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: '20px 0' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <div style={{ minHeight: 400 }}>
          {steps[currentStep].content}
        </div>
        
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && (
              <Button onClick={prev}>
                Wstecz
              </Button>
            )}
          </div>
          <div>
            <Space>
              <Button onClick={() => {
                resetForm();
                onCancel();
              }}>
                Anuluj
              </Button>
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={next}>
                  Dalej
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button 
                  type="primary" 
                  onClick={handleSubmit}
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  {editMode ? 'Zapisz zmiany' : 'Dodaj pozycję'}
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>
    </Modal>
  );
};