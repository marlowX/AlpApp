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

// Mapowanie statusów na możliwe następne kroki zgodnie z v_instrukcja_workflow
const WORKFLOW_TRANSITIONS: Record<string, Array<{kod_etapu: string, nazwa_etapu: string}>> = {
  // Start produkcji
  'NOWE': [
    { kod_etapu: 'CIECIE_START', nazwa_etapu: 'Rozpocznij cięcie' },
    { kod_etapu: 'ANULOWANE', nazwa_etapu: 'Anuluj zlecenie' }
  ],
  
  // Cięcie
  'CIECIE_START': [
    { kod_etapu: 'OTWARCIE_PALETY', nazwa_etapu: 'Otwórz paletę' },
    { kod_etapu: 'CIECIE_STOP', nazwa_etapu: 'Zakończ cięcie' }
  ],
  'CIECIE_STOP': [
    { kod_etapu: 'OTWARCIE_PALETY', nazwa_etapu: 'Otwórz paletę' }
  ],
  
  // Pakowanie na palety
  'OTWARCIE_PALETY': [
    { kod_etapu: 'PAKOWANIE_PALETY', nazwa_etapu: 'Pakuj na paletę' }
  ],
  'PAKOWANIE_PALETY': [
    { kod_etapu: 'ZAMKNIECIE_PALETY', nazwa_etapu: 'Zamknij paletę' }
  ],
  'ZAMKNIECIE_PALETY': [
    { kod_etapu: 'OTWARCIE_PALETY', nazwa_etapu: 'Otwórz kolejną paletę' },
    { kod_etapu: 'BUFOR_PILA', nazwa_etapu: 'Do bufora piły' }
  ],
  
  // Bufor piła i transport
  'BUFOR_PILA': [
    { kod_etapu: 'TRANSPORT_1', nazwa_etapu: 'Transport do następnego etapu' },
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Do bufora okleiniarki' },
    { kod_etapu: 'BUFOR_WIERTARKA', nazwa_etapu: 'Do bufora wiertarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  'TRANSPORT_1': [
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Do bufora okleiniarki' },
    { kod_etapu: 'BUFOR_WIERTARKA', nazwa_etapu: 'Do bufora wiertarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  
  // Oklejanie
  'BUFOR_OKLEINIARKA': [
    { kod_etapu: 'OKLEJANIE_START', nazwa_etapu: 'Rozpocznij oklejanie' }
  ],
  'OKLEJANIE_START': [
    { kod_etapu: 'OKLEJANIE_STOP', nazwa_etapu: 'Zakończ oklejanie' }
  ],
  'OKLEJANIE_STOP': [
    { kod_etapu: 'BUFOR_WIERTARKA', nazwa_etapu: 'Do bufora wiertarki' },
    { kod_etapu: 'BUFOR_KOMPLETOWANIE', nazwa_etapu: 'Do kompletowania' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  
  // Wiercenie
  'BUFOR_WIERTARKA': [
    { kod_etapu: 'WIERCENIE_START', nazwa_etapu: 'Rozpocznij wiercenie' }
  ],
  'WIERCENIE_START': [
    { kod_etapu: 'WIERCENIE_STOP', nazwa_etapu: 'Zakończ wiercenie' }
  ],
  'WIERCENIE_STOP': [
    { kod_etapu: 'BUFOR_KOMPLETOWANIE', nazwa_etapu: 'Do kompletowania' },
    { kod_etapu: 'BUFOR_PAKOWANIE', nazwa_etapu: 'Do pakowania' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  
  // Kompletowanie
  'BUFOR_KOMPLETOWANIE': [
    { kod_etapu: 'KOMPLETOWANIE_START', nazwa_etapu: 'Rozpocznij kompletowanie' }
  ],
  'KOMPLETOWANIE_START': [
    { kod_etapu: 'KOMPLETOWANIE_STOP', nazwa_etapu: 'Zakończ kompletowanie' }
  ],
  'KOMPLETOWANIE_STOP': [
    { kod_etapu: 'BUFOR_PAKOWANIE', nazwa_etapu: 'Do pakowania' },
    { kod_etapu: 'BUFOR_WYSYLKA', nazwa_etapu: 'Do wysyłki' }
  ],
  
  // Pakowanie finalne
  'BUFOR_PAKOWANIE': [
    { kod_etapu: 'PAKOWANIE_START', nazwa_etapu: 'Rozpocznij pakowanie' }
  ],
  'PAKOWANIE_START': [
    { kod_etapu: 'PAKOWANIE_STOP', nazwa_etapu: 'Zakończ pakowanie' }
  ],
  'PAKOWANIE_STOP': [
    { kod_etapu: 'BUFOR_WYSYLKA', nazwa_etapu: 'Do wysyłki' },
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij' }
  ],
  
  // Wysyłka
  'BUFOR_WYSYLKA': [
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij do klienta' }
  ],
  'WYSYLKA': [
    { kod_etapu: 'ZAKONCZONE', nazwa_etapu: 'Zakończ zlecenie' }
  ],
  
  // Magazyn
  'MAGAZYN': [
    { kod_etapu: 'BUFOR_WYSYLKA', nazwa_etapu: 'Do wysyłki' },
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij z magazynu' },
    { kod_etapu: 'ZAKONCZONE', nazwa_etapu: 'Zakończ zlecenie' }
  ],
  
  // Stany końcowe
  'ZAKONCZONE': [],
  'ZAKONCZONA': [],
  'ANULOWANE': [],
  
  // Fallback dla starych statusów
  'CIECIE': [
    { kod_etapu: 'OKLEJANIE_START', nazwa_etapu: 'Rozpocznij oklejanie' },
    { kod_etapu: 'BUFOR_OKLEINIARKA', nazwa_etapu: 'Do bufora okleiniarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  'OKLEJANIE': [
    { kod_etapu: 'WIERCENIE_START', nazwa_etapu: 'Rozpocznij wiercenie' },
    { kod_etapu: 'BUFOR_WIERTARKA', nazwa_etapu: 'Do bufora wiertarki' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  'WIERCENIE': [
    { kod_etapu: 'PAKOWANIE_START', nazwa_etapu: 'Rozpocznij pakowanie' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  'PAKOWANIE': [
    { kod_etapu: 'WYSYLKA', nazwa_etapu: 'Wyślij' },
    { kod_etapu: 'MAGAZYN', nazwa_etapu: 'Na magazyn' }
  ],
  'TRANSPORT': [
    { kod_etapu: 'ZAKONCZONE', nazwa_etapu: 'Zakończ zlecenie' }
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
        
        // Jeśli API zwróciło puste dane, użyj lokalnej mapy workflow
        if (!data || data.length === 0) {
          console.warn('API returned empty steps, using workflow map for status:', currentStatus);
          const workflowSteps = WORKFLOW_TRANSITIONS[currentStatus.toUpperCase()] || 
                               WORKFLOW_TRANSITIONS[currentStatus] || [];
          setAvailableSteps(workflowSteps);
          setUseFallback(true);
        } else {
          setAvailableSteps(data);
        }
      } else {
        console.error('Failed to fetch next steps, using workflow map');
        const workflowSteps = WORKFLOW_TRANSITIONS[currentStatus.toUpperCase()] || 
                             WORKFLOW_TRANSITIONS[currentStatus] || [];
        setAvailableSteps(workflowSteps);
        setUseFallback(true);
      }
    } catch (error) {
      console.error('Error fetching next steps, using workflow map:', error);
      const workflowSteps = WORKFLOW_TRANSITIONS[currentStatus.toUpperCase()] || 
                           WORKFLOW_TRANSITIONS[currentStatus] || [];
      setAvailableSteps(workflowSteps);
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

  // Mapowanie kodów etapów na czytelne nazwy z emoji
  const getStepLabel = (kod: string) => {
    const labels: Record<string, string> = {
      // Cięcie
      'CIECIE_START': '🔪 Rozpocznij cięcie',
      'CIECIE_STOP': '🔪 Zakończ cięcie',
      'CIECIE': '🔪 Cięcie',
      
      // Palety
      'OTWARCIE_PALETY': '📦 Otwórz paletę',
      'PAKOWANIE_PALETY': '📦 Pakuj na paletę',
      'ZAMKNIECIE_PALETY': '🔒 Zamknij paletę',
      
      // Bufory
      'BUFOR_PILA': '⏸️ Bufor piły',
      'BUFOR_OKLEINIARKA': '⏸️ Bufor okleiniarki',
      'BUFOR_WIERTARKA': '⏸️ Bufor wiertarki',
      'BUFOR_KOMPLETOWANIE': '⏸️ Bufor kompletowania',
      'BUFOR_PAKOWANIE': '⏸️ Bufor pakowania',
      'BUFOR_WYSYLKA': '⏸️ Bufor wysyłki',
      
      // Oklejanie
      'OKLEJANIE_START': '🎨 Rozpocznij oklejanie',
      'OKLEJANIE_STOP': '🎨 Zakończ oklejanie',
      'OKLEJANIE': '🎨 Oklejanie',
      
      // Wiercenie
      'WIERCENIE_START': '🔩 Rozpocznij wiercenie',
      'WIERCENIE_STOP': '🔩 Zakończ wiercenie',
      'WIERCENIE': '🔩 Wiercenie',
      
      // Kompletowanie
      'KOMPLETOWANIE_START': '📋 Rozpocznij kompletowanie',
      'KOMPLETOWANIE_STOP': '📋 Zakończ kompletowanie',
      
      // Pakowanie
      'PAKOWANIE_START': '📦 Rozpocznij pakowanie',
      'PAKOWANIE_STOP': '📦 Zakończ pakowanie',
      'PAKOWANIE': '📦 Pakowanie',
      
      // Transport i wysyłka
      'TRANSPORT_1': '🚚 Transport',
      'TRANSPORT': '🚚 Transport',
      'WYSYLKA': '📮 Wyślij do klienta',
      
      // Inne
      'MAGAZYN': '🏭 Na magazyn',
      'ZAKONCZONE': '✅ Zakończ zlecenie',
      'ZAKONCZONA': '✅ Zakończ zlecenie',
      'ANULOWANE': '❌ Anuluj zlecenie'
    };
    return labels[kod] || kod;
  };

  // Określ opis statusu
  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      'NOWE': 'Zlecenie oczekuje na rozpoczęcie produkcji',
      'CIECIE_START': 'Trwa cięcie formatek na pile',
      'OTWARCIE_PALETY': 'Paleta otwarta, gotowa do pakowania',
      'PAKOWANIE_PALETY': 'Trwa pakowanie formatek na paletę',
      'ZAMKNIECIE_PALETY': 'Paleta zamknięta',
      'BUFOR_PILA': 'Formatki w buforze piły',
      'TRANSPORT_1': 'Transport do następnego stanowiska',
      'BUFOR_OKLEINIARKA': 'Formatki czekają na oklejanie',
      'OKLEJANIE_START': 'Trwa oklejanie krawędzi',
      'OKLEJANIE_STOP': 'Oklejanie zakończone',
      'BUFOR_WIERTARKA': 'Formatki czekają na wiercenie',
      'WIERCENIE_START': 'Trwa wiercenie otworów',
      'WIERCENIE_STOP': 'Wiercenie zakończone',
      'BUFOR_KOMPLETOWANIE': 'Czeka na kompletowanie',
      'KOMPLETOWANIE_START': 'Trwa kompletowanie zamówienia',
      'BUFOR_PAKOWANIE': 'Czeka na pakowanie finalne',
      'PAKOWANIE_START': 'Trwa pakowanie do wysyłki',
      'PAKOWANIE_STOP': 'Pakowanie zakończone',
      'BUFOR_WYSYLKA': 'Czeka na wysyłkę',
      'WYSYLKA': 'Wysłane do klienta',
      'MAGAZYN': 'Na magazynie',
      'ZAKONCZONE': 'Zlecenie zakończone',
      'ANULOWANE': 'Zlecenie anulowane'
    };
    return descriptions[status] || 'Status: ' + status;
  };

  // Określ ikonę dla przycisku
  const getButtonIcon = () => {
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE') {
      return <CheckCircleOutlined />;
    }
    if (currentStatus === 'NOWE') {
      return <RocketOutlined />;
    }
    if (currentStatus === 'ANULOWANE') {
      return <LockOutlined />;
    }
    return <SendOutlined />;
  };

  // Określ tekst przycisku
  const getButtonText = () => {
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE') {
      return 'Zlecenie zakończone';
    }
    if (currentStatus === 'ANULOWANE') {
      return 'Zlecenie anulowane';
    }
    if (currentStatus === 'NOWE') {
      return 'Rozpocznij produkcję';
    }
    return 'Zmień status';
  };

  // Określ kolor przycisku
  const getButtonType = () => {
    if (currentStatus === 'NOWE') return 'primary';
    if (currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE' || currentStatus === 'ANULOWANE') return 'default';
    return 'primary';
  };

  const isStatusFinal = currentStatus === 'ZAKONCZONA' || currentStatus === 'ZAKONCZONE' || currentStatus === 'ANULOWANE';

  return (
    <>
      <Tooltip 
        title={
          isStatusFinal
            ? 'Status końcowy' 
            : 'Zmień status zlecenia'
        }
      >
        <Button
          type={getButtonType() as any}
          icon={getButtonIcon()}
          onClick={handleOpenModal}
          disabled={disabled || isStatusFinal}
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
              <Tooltip title="Używam lokalnej mapy workflow z instrukcji systemowej">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={650}
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
            {/* Alert o używaniu lokalnego workflow */}
            {useFallback && (
              <Alert
                message="Tryb lokalny"
                description="Używam mapy workflow z instrukcji systemowej (zko.v_instrukcja_workflow)"
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Alert z aktualnym statusem */}
            <Alert
              message="Aktualny status"
              description={
                <Space direction="vertical" size="small">
                  <Space>
                    <strong style={{ fontSize: '16px' }}>{currentStatus}</strong>
                  </Space>
                  <Text type="secondary">{getStatusDescription(currentStatus)}</Text>
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
                        ) : step.kod_etapu.includes('STOP') ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : step.kod_etapu === 'ANULOWANE' ? (
                          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                        ) : (
                          <PlayCircleOutlined style={{ color: '#1890ff' }} />
                        )}
                        <span>{getStepLabel(step.kod_etapu)}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              ) : (
                <Alert
                  message="Brak dostępnych kroków"
                  description={
                    isStatusFinal 
                      ? "To jest status końcowy - zlecenie zostało zakończone lub anulowane."
                      : "Nie znaleziono następnych kroków dla tego statusu. Skontaktuj się z administratorem."
                  }
                  type={isStatusFinal ? "info" : "warning"}
                  showIcon
                />
              )}
            </Form.Item>

            {/* Informacja o wybranym kroku */}
            {selectedStep && (
              <Alert
                message="Informacja o wybranym kroku"
                description={getStatusDescription(selectedStep)}
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
              <Input placeholder="Lokalizacja/stanowisko (opcjonalnie)" />
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