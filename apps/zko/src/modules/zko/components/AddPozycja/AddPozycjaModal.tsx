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

// Funkcja pomocnicza do parsowania kolorów
const parseKoloryPlyty = (kolorString: string, nazwaString: string, defaultIlosc: number = 1): KolorPlyty[] => {
  const result: KolorPlyty[] = [];
  
  if (!kolorString) return [{ kolor: '', nazwa: '', ilosc: 1 }];
  
  // Sprawdź czy mamy format "KOLOR xN, KOLOR2 xM"
  if (kolorString.includes(' x')) {
    const parts = kolorString.split(',').map(s => s.trim());
    const nazwy = nazwaString ? nazwaString.split(',').map(s => s.trim()) : [];
    
    parts.forEach((part, index) => {
      const match = part.match(/^(.+?)\s*x(\d+)$/);
      if (match) {
        result.push({
          kolor: match[1].trim(),
          nazwa: nazwy[index] || match[1].trim(),
          ilosc: parseInt(match[2])
        });
      }
    });
  } else {
    // Prosty format bez xN
    result.push({
      kolor: kolorString,
      nazwa: nazwaString || kolorString,
      ilosc: defaultIlosc
    });
  }
  
  return result.length > 0 ? result : [{ kolor: '', nazwa: '', ilosc: 1 }];
};

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
      console.log('Loading pozycja for edit:', pozycjaToEdit);
      
      // Ustaw rozkrój
      if (pozycjaToEdit.rozkroj_id) {
        setSelectedRozkrojId(pozycjaToEdit.rozkroj_id);
      }
      
      // Parsuj kolory płyt
      const parsedKolory = parseKoloryPlyty(
        pozycjaToEdit.kolor_plyty || '',
        pozycjaToEdit.nazwa_plyty || '',
        pozycjaToEdit.ilosc_plyt || 1
      );
      
      console.log('Parsed kolory:', parsedKolory);
      setKolorePlyty(parsedKolory);
      
      // Ustaw opcje dodatkowe
      form.setFieldsValue({
        kolejnosc: pozycjaToEdit.kolejnosc,
        uwagi: pozycjaToEdit.uwagi
      });
    } else if (!editMode && visible) {
      // Reset dla trybu dodawania
      resetForm();
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
      setLoading(true);
      
      const values = form.getFieldsValue();
      
      if (editMode && pozycjaToEdit) {
        // Tryb edycji
        const pierwszyKolor = kolorePlyty.find(p => p.kolor) || kolorePlyty[0];
        
        if (!pierwszyKolor.kolor) {
          notification.error({
            message: 'Błąd',
            description: 'Musisz wybrać przynajmniej jedną płytę',
            duration: 4,
          });
          return;
        }
        
        // Przygotuj dane do edycji - WSZYSTKIE POLA
        const editData = {
          rozkroj_id: selectedRozkrojId || pozycjaToEdit.rozkroj_id,
          ilosc_plyt: pierwszyKolor.ilosc || 1,
          kolor_plyty: pierwszyKolor.kolor,
          nazwa_plyty: pierwszyKolor.nazwa || pierwszyKolor.kolor,
          kolejnosc: values.kolejnosc || pozycjaToEdit.kolejnosc || null,
          uwagi: values.uwagi || pozycjaToEdit.uwagi || null
        };
        
        console.log('Sending edit data:', editData);
        
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
          notification.error({
            message: 'Błąd',
            description: result.komunikat || 'Nie udało się zaktualizować pozycji',
            duration: 5,
          });
        }
      } else {
        // Tryb dodawania
        const validKolory = kolorePlyty.filter(p => p.kolor);
        
        if (validKolory.length === 0) {
          notification.error({
            message: 'Błąd',
            description: 'Musisz wybrać przynajmniej jedną płytę',
            duration: 4,
          });
          return;
        }
        
        const result = await PozycjaService.addPozycja({
          zko_id: zkoId,
          rozkroj_id: selectedRozkrojId!,
          kolory_plyty: validKolory,
          kolejnosc: values.kolejnosc || null,
          uwagi: values.uwagi || null,
        });
        
        if (result.sukces) {
          PozycjaService.showSuccessNotification(result);
          resetForm();
          onSuccess();
        } else {
          notification.error({
            message: 'Błąd',
            description: result.komunikat || 'Nie udało się dodać pozycji',
            duration: 5,
          });
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
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