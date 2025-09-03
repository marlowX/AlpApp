import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, message, Alert, Space, Tooltip, Spin, Typography } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  LockOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SendOutlined,
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface StatusChangeButtonProps {
  zkoId: number;
  currentStatus: string;
  onStatusChanged?: () => void;
  nextSteps?: any[];
  disabled?: boolean;
}

// Fallback - mapowanie statusów na możliwe następne kroki
const FALLBACK_NEXT_STEPS: Record<string, Array<{kod_etapu: string, nazwa_etapu: string}>> = {
  'NOWE': [
    { kod_etapu: 'CIECIE', nazwa_etapu: 'Rozpocznij cięcie' },
    { kod_etapu: 'BUFOR_PILA', nazwa_etapu: 'Przekaż do bufora piły' }
  ],
  'BUFOR_PILA': [
    { kod_etapu: 'OKLEJANIE', nazwa_etapu: 'Rozpocznij oklejanie' },
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Przekaż do bufora okleiniarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'CIECIE': [
    { kod_etapu: 'OKLEJANIE', nazwa_etapu: 'Rozpocznij oklejanie' },
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Przekaż do bufora okleiniarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'CIECIE_START': [
    { kod_etapu: 'OKLEJANIE', nazwa_etapu: 'Rozpocznij oklejanie' },
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Przekaż do bufora okleiniarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'OKLEJANIE': [
    { kod_etapu: 'WIERCENIE', nazwa_etapu: 'Rozpocznij wiercenie' },
    { kod_etapu: 'BUFOR_WIERCENIE', nazwa_etapu: 'Przekaż do bufora wiertarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'OKLEJANIE_START': [
    { kod_etapu: 'WIERCENIE', nazwa_etapu: 'Rozpocznij wiercenie' },
    { kod_etapu: 'BUFOR_WIERCENIE', nazwa_etapu: 'Przekaż do bufora wiertarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'WIERCENIE': [
    { kod_etapu: 'PAKOWANIE', nazwa_etapu: 'Rozpocznij pakowanie' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' }
  ],
  'PAKOWANIE': [
    { kod_etapu: 'TRANSPORT', nazwa_etapu: 'Przygotuj do transportu' },
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij do klienta' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' },
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Zakończ zlecenie' }
  ],
  'PAKOWANIE_STOP': [
    { kod_etapu: 'TRANSPORT', nazwa_etapu: 'Przygotuj do transportu' },
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij do klienta' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Przekaż na magazyn' },
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Zakończ zlecenie' }
  ],
  'TRANSPORT': [
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Potwierdź odbiór i zakończ' }
  ],
  'TRANSPORT_1': [
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Potwierdź odbiór i zakończ' }
  ],
  'WYSYLKA': [
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Potwierdź odbiór i zakończ' }
  ],
  'MAGAZYN': [
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij z magazynu' },
    { kod_etapu: 'ZAKONCZONA', nazwa_etapu: 'Zakończ zlecenie' }
  ]
};

export const StatusChangeButton: React.FC<StatusChangeButtonProps> = ({
  zkoId,
  currentStatus,
  onStatusChanged,
  nextSteps = [],
  disabled = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [availableSteps, setAvailableSteps] = useState<any[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [form] = Form.useForm();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Pobierz dostępne następne kroki
  const fetchNextSteps = async () => {
    setLoadingSteps(true);
    setUseFallback(false);
    
    try {
      const response = await fetch(`/api/workflow/next-steps/${zkoId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Next steps from API:', data);
        
        // Jeśli API zwróciło puste dane, użyj fallback
        if (!data || data.length === 0) {
          console.warn('API returned empty steps, using fallback for status:', currentStatus);
          const fallbackSteps = FALLBACK_NEXT_STEPS[currentStatus.toUpperCase()] || [];
          setAvailableSteps(fallbackSteps);
          setUseFallback(true);
        } else {
          setAvailableSteps(data);
        }
      } else {
        console.error('Failed to fetch next steps, using fallback');
        const fallbackSteps = FALLBACK_NEXT_STEPS[currentStatus.toUpperCase()] || [];
        setAvailableSteps(fallbackSteps);
        setUseFallback(true);
      }
    } catch (error) {
      console.error('Error fetching next steps, using fallback:', error);
      const fallbackSteps = FALLBACK_NEXT_STEPS[currentStatus.toUpperCase()] || [];
      setAvailableSteps(fallbackSteps);
      setUseFallback(true);
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    setSelectedStep(null);
    form.resetFields();
    fetchNextSteps();
  };

  const handleSubmit = async (values: any) => {
    if (!selectedStep) {
      message.error('Wybierz następny etap');
      return;
    }

    setLoading(true);
    try {
      // Używamy endpointa PUT /api/zko/:id/status
      const response = await fetch(`/api/zko/${zkoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nowy_etap_kod: selectedStep,
          komentarz: values.komentarz,
          operator: values.operator || 'system',
          lokalizacja: values.lokalizacja || ''
        })
      });

      const data = await response.json();

      if (response.ok && data.sukces) {
        message.success(data.komunikat || 'Status zmieniony pomyślnie');
        setModalVisible(false);
        form.resetFields();
        onStatusChanged?.();
      } else {
        // Obsługa błędów
        if (data.bledy && data.bledy.length > 0) {
          Modal.error({
            title: 'Nie można zmienić statusu',
            content: (
              <div>
                <p>{data.komunikat}</p>
                <Alert
                  message="Wymagania do spełnienia:"
                  description={
                    <ul style={{ marginTop: 8 }}>
                      {data.bledy.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              </div>
            )
          });
        } else if (data.ostrzezenia && data.ostrzezenia.length > 0) {
          // Pokaż ostrzeżenia i zapytaj o kontynuację
          Modal.confirm({
            title: 'Wykryto ostrzeżenia',
            content: (
              <div>
                <Alert
                  message="Ostrzeżenia:"
                  description={
                    <ul style={{ marginTop: 8 }}>
                      {data.ostrzezenia.map((warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
                <p style={{ marginTop: 16 }}>Czy chcesz kontynuować mimo ostrzeżeń?</p>
              </div>
            ),
            onOk: () => handleSubmit({ ...values, wymus: true }),
            okText: 'Tak, kontynuuj',
            cancelText: 'Anuluj'
          });
        } else {
          message.error(data.komunikat || 'Błąd podczas zmiany statusu');
        }
      }
    } catch (error: any) {
      console.error('Error changing status:', error);
      message.error('Błąd podczas zmiany statusu');
    } finally {
      setLoading(false);
    }
  };

  // Mapowanie kodów etapów na czytelne nazwy
  const getStepLabel = (kod: string) => {
    const labels: Record<string, string> = {
      'CIECIE': '🔪 Rozpocznij cięcie',
      'BUFOR_PILA': '📦 Bufor piły',
      'OKLEJANIE': '🎨 Rozpocznij oklejanie',
      'BUFOR_OKLEINIARKA': '📦 Bufor okleiniarki',
      'WIERCENIE': '🔩 Rozpocznij wiercenie',
      'BUFOR_WIERCENIE': '📦 Bufor wiertarki',
      'PAKOWANIE': '📦 Rozpocznij pakowanie',
      'TRANSPORT': '🚚 Wyślij transport',
      'ZAKONCZONA': '✅ Zakończ zlecenie',
      'MAGAZYN': '🏭 Przekaż na magazyn',
      'WYSYLKA': '📮 Wyślij do klienta'
    };
    return labels[kod] || kod;
  };

  // Określ ikonę dla przycisku
  const getButtonIcon = () => {
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE') {
      return <CheckCircleOutlined />;
    }
    if (currentStatus === 'NOWE') {
      return <RocketOutlined />;
    }
    return <SendOutlined />;
  };

  // Określ tekst przycisku
  const getButtonText = () => {
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE') {
      return 'Zlecenie zakończone';
    }
    if (currentStatus === 'NOWE') {
      return 'Rozpocznij produkcję';
    }
    return 'Zmień status';
  };

  // Określ kolor przycisku
  const getButtonType = () => {
    if (currentStatus === 'NOWE') return 'primary';
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE') return 'default';
    return 'primary';
  };

  return (
    <>
      <Tooltip 
        title={
          currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE' 
            ? 'Zlecenie zakończone' 
            : 'Zmień status zlecenia'
        }
      >
        <Button
          type={getButtonType() as any}
          icon={getButtonIcon()}
          onClick={handleOpenModal}
          disabled={disabled || currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE'}
        >
          {getButtonText()}
        </Button>
      </Tooltip>

      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>Zmiana statusu ZKO</span>
            {useFallback && (
              <Tooltip title="Używam lokalnej mapy przejść statusów, ponieważ serwer nie zwrócił danych">
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {loadingSteps ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Pobieranie dostępnych kroków..." />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {/* Alert o używaniu fallback */}
            {useFallback && (
              <Alert
                message="Tryb awaryjny"
                description="Używam lokalnej mapy przejść statusów. Skontaktuj się z administratorem, aby zaktualizować funkcję w bazie danych."
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Alert z aktualnym statusem */}
            <Alert
              message="Aktualny status"
              description={
                <Space>
                  <strong>{currentStatus}</strong>
                  {currentStatus === 'NOWE' && '- Zlecenie oczekuje na rozpoczęcie produkcji'}
                  {currentStatus === 'CIECIE' && '- Trwa cięcie formatek'}
                  {currentStatus === 'BUFOR_PILA' && '- Formatki w buforze piły'}
                  {currentStatus === 'OKLEJANIE' && '- Trwa oklejanie krawędzi'}
                  {currentStatus === 'WIERCENIE' && '- Trwa wiercenie otworów'}
                  {currentStatus === 'PAKOWANIE' && '- Trwa pakowanie'}
                  {currentStatus === 'TRANSPORT' && '- W transporcie'}
                  {currentStatus === 'WYSYLKA' && '- Wysłane do klienta'}
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* Wybór następnego etapu */}
            <Form.Item
              label="Wybierz następny etap"
              name="nowy_etap"
              rules={[{ required: true, message: 'Wybierz etap docelowy' }]}
            >
              {availableSteps.length > 0 ? (
                <Select
                  placeholder="Wybierz następny etap"
                  onChange={setSelectedStep}
                  size="large"
                >
                  {availableSteps.map((step: any) => (
                    <Option key={step.kod_etapu} value={step.kod_etapu}>
                      <Space>
                        {step.kod_etapu.includes('BUFOR') ? (
                          <InfoCircleOutlined style={{ color: '#faad14' }} />
                        ) : (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        )}
                        <span>{getStepLabel(step.kod_etapu)}</span>
                        {step.nazwa_etapu && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ({step.nazwa_etapu})
                          </Text>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              ) : (
                <Alert
                  message="Brak dostępnych kroków"
                  description="Nie znaleziono następnych kroków dla tego zlecenia. Status może być końcowy lub nieobsługiwany."
                  type="warning"
                  showIcon
                />
              )}
            </Form.Item>

            {/* Informacja o wybranym kroku */}
            {selectedStep && (
              <Alert
                message="Informacja o kroku"
                description={
                  <div>
                    {selectedStep.includes('BUFOR') && (
                      <p>📦 Bufor jest opcjonalnym etapem pośrednim. Służy do tymczasowego składowania formatek.</p>
                    )}
                    {selectedStep === 'CIECIE' && (
                      <p>🔪 Rozpoczęcie cięcia formatek na pile formatowej.</p>
                    )}
                    {selectedStep === 'OKLEJANIE' && (
                      <p>🎨 Rozpoczęcie oklejania krawędzi na okleiniarce.</p>
                    )}
                    {selectedStep === 'WIERCENIE' && (
                      <p>🔩 Rozpoczęcie wiercenia otworów na wiertarce.</p>
                    )}
                    {selectedStep === 'PAKOWANIE' && (
                      <p>📦 Rozpoczęcie pakowania gotowych formatek.</p>
                    )}
                    {selectedStep === 'TRANSPORT' && (
                      <p>🚚 Przygotowanie do transportu.</p>
                    )}
                    {selectedStep === 'WYSYLKA' && (
                      <p>📮 Wysyłka do klienta.</p>
                    )}
                    {selectedStep === 'MAGAZYN' && (
                      <p>🏭 Przekazanie na magazyn.</p>
                    )}
                    {selectedStep === 'ZAKONCZONA' && (
                      <p>✅ Zakończenie zlecenia - wszystkie formatki zostały wyprodukowane.</p>
                    )}
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Operator */}
            <Form.Item
              label="Operator"
              name="operator"
            >
              <Input 
                placeholder="Imię i nazwisko operatora (opcjonalnie)" 
                prefix={<UserOutlined />}
              />
            </Form.Item>

            {/* Lokalizacja */}
            <Form.Item
              label="Lokalizacja"
              name="lokalizacja"
            >
              <Input placeholder="Lokalizacja (opcjonalnie)" />
            </Form.Item>

            {/* Komentarz */}
            <Form.Item
              label="Komentarz"
              name="komentarz"
            >
              <TextArea
                rows={3}
                placeholder="Dodaj komentarz (opcjonalnie)"
              />
            </Form.Item>

            {/* Przyciski */}
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setModalVisible(false)}>
                  Anuluj
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!selectedStep || availableSteps.length === 0}
                  icon={<SendOutlined />}
                >
                  Zmień status
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default StatusChangeButton;