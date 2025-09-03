import React, { useState, useEffect, useRef } from 'react';
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

interface ExtendedAddPozycjaFormData extends AddPozycjaFormData {
  sciezka_produkcji?: string;
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
  const [form] = Form.useForm<ExtendedAddPozycjaFormData>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  
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
      
      // Pobierz ścieżkę produkcji - POPRAWKA: sprawdź także w formatkach
      let sciezkaProdukcji = pozycjaToEdit.sciezka_produkcji;
      
      // Jeśli nie ma ścieżki w pozycji, pobierz z formatek
      if (!sciezkaProdukcji && pozycjaToEdit.formatki && pozycjaToEdit.formatki.length > 0) {
        sciezkaProdukcji = pozycjaToEdit.formatki[0].sciezka_produkcji;
      }
      
      // Ustaw domyślną ścieżkę jeśli brak
      if (!sciezkaProdukcji) {
        sciezkaProdukcji = 'CIECIE->OKLEJANIE->MAGAZYN';
      }
      
      console.log('Setting sciezka_produkcji:', sciezkaProdukcji);
      
      // Ustaw opcje dodatkowe wraz ze ścieżką produkcji
      form.setFieldsValue({
        kolejnosc: pozycjaToEdit.kolejnosc,
        uwagi: pozycjaToEdit.uwagi,
        sciezka_produkcji: sciezkaProdukcji
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
      
      const values = await form.validateFields();
      
      console.log('Form values before submit:', values);
      console.log('Current sciezka_produkcji:', values.sciezka_produkcji);
      
      if (editMode && pozycjaToEdit) {
        // Tryb edycji - OBSŁUGA WIELU PŁYT
        const validKolory = kolorePlyty.filter(p => p.kolor);
        
        if (validKolory.length === 0) {
          notification.error({
            message: 'Błąd',
            description: 'Musisz wybrać przynajmniej jedną płytę',
            duration: 4,
          });
          setLoading(false);
          return;
        }
        
        // Jeśli mamy wiele kolorów, formatujemy je odpowiednio
        let kolorPlytyStr = '';
        let nazwaPlytyStr = '';
        let iloscPlyt = 0;
        
        if (validKolory.length === 1) {
          // Pojedyncza płyta
          kolorPlytyStr = validKolory[0].kolor;
          nazwaPlytyStr = validKolory[0].nazwa || validKolory[0].kolor;
          iloscPlyt = validKolory[0].ilosc || 1;
        } else {
          // Wiele płyt - format "KOLOR1 x2, KOLOR2 x3"
          kolorPlytyStr = validKolory.map(k => `${k.kolor} x${k.ilosc || 1}`).join(', ');
          nazwaPlytyStr = validKolory.map(k => k.nazwa || k.kolor).join(', ');
          iloscPlyt = validKolory.reduce((sum, k) => sum + (k.ilosc || 1), 0);
        }
        
        // Przygotuj dane do edycji - WAŻNE: zawsze przekaż ścieżkę produkcji
        const editData = {
          rozkroj_id: selectedRozkrojId || pozycjaToEdit.rozkroj_id,
          ilosc_plyt: iloscPlyt,
          kolor_plyty: kolorPlytyStr,
          nazwa_plyty: nazwaPlytyStr,
          kolejnosc: values.kolejnosc !== undefined ? values.kolejnosc : pozycjaToEdit.kolejnosc,
          uwagi: values.uwagi !== undefined ? values.uwagi : pozycjaToEdit.uwagi,
          sciezka_produkcji: values.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN'
        };
        
        console.log('Sending edit data to API:', editData);
        console.log('Sciezka produkcji being sent:', editData.sciezka_produkcji);
        
        const result = await zkoApi.editPozycja(pozycjaToEdit.id, editData);
        
        if (result.sukces) {
          notification.success({
            message: 'Sukces',
            description: result.komunikat || 'Pozycja została zaktualizowana',
            duration: 3,
          });
          closeModal();
          setTimeout(() => {
            onSuccess();
          }, 100);
        } else {
          notification.error({
            message: 'Błąd',
            description: result.komunikat || 'Nie udało się zaktualizować pozycji',
            duration: 5,
          });
          setLoading(false);
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
          setLoading(false);
          return;
        }
        
        const result = await PozycjaService.addPozycja({
          zko_id: zkoId,
          rozkroj_id: selectedRozkrojId!,
          kolory_plyty: validKolory,
          kolejnosc: values.kolejnosc || null,
          uwagi: values.uwagi || null,
          sciezka_produkcji: values.sciezka_produkcji || 'CIECIE->OKLEJANIE->MAGAZYN'
        });
        
        if (result.sukces) {
          PozycjaService.showSuccessNotification(result);
          closeModal();
          setTimeout(() => {
            onSuccess();
          }, 100);
        } else {
          notification.error({
            message: 'Błąd',
            description: result.komunikat || 'Nie udało się dodać pozycji',
            duration: 5,
          });
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      notification.error({
        message: 'Błąd',
        description: error.message || 'Wystąpił nieoczekiwany błąd',
        duration: 5,
      });
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

  const closeModal = () => {
    setIsClosing(true);
    resetForm();
    setLoading(false);
    onCancel();
    setIsClosing(false);
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
          onNext={next}
          onPrev={currentStep > 0 ? prev : undefined}
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
          onNext={next}
          onPrev={prev}
        />
      ),
    },
    {
      title: 'Ścieżka i opcje',
      content: (
        <Step3Opcje
          form={form}
          kolorePlyty={kolorePlyty}
          selectedRozkroj={selectedRozkroj}
          onNext={handleSubmit}
          onPrev={prev}
        />
      ),
    },
  ];

  // Nie renderuj jeśli zamykamy
  if (isClosing) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          {editMode ? <EditOutlined /> : <PlusOutlined />}
          {editMode ? `Edytuj pozycję #${pozycjaToEdit?.id}` : `Dodaj pozycję do ZKO #${zkoId}`}
        </Space>
      }
      open={visible}
      onCancel={closeModal}
      width="90%"
      style={{ maxWidth: '1400px' }}
      footer={null}
      maskClosable={false}
      keyboard={false}
      destroyOnClose={true}
    >
      <Form form={form} layout="vertical">
        <div style={{ padding: '20px 0' }}>
          <Steps current={currentStep} style={{ marginBottom: 32 }}>
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          
          <div style={{ minHeight: 400 }}>
            {steps[currentStep].content}
          </div>
          
          {/* Stopka modalu z przyciskami nawigacji */}
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
                <Button onClick={closeModal}>
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
      </Form>
    </Modal>
  );
};