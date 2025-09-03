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
  UserOutlined
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
  const [form] = Form.useForm();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Pobierz dostępne następne kroki
  const fetchNextSteps = async () => {
    setLoadingSteps(true);
    try {
      const response = await fetch(`/api/workflow/next-steps/${zkoId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Next steps from API:', data);
        setAvailableSteps(data || []);
      } else {
        console.error('Failed to fetch next steps');
        setAvailableSteps([]);
      }
    } catch (error) {
      console.error('Error fetching next steps:', error);
      message.error('Błąd pobierania dostępnych kroków');
      setAvailableSteps([]);
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
      'BUFOR_CIECIE': '📦 Bufor piły',
      'OKLEJANIE': '🎨 Rozpocznij oklejanie',
      'BUFOR_OKLEINIARKA': '📦 Bufor okleiniarki',
      'WIERCENIE': '🔩 Rozpocznij wiercenie',
      'BUFOR_WIERCENIE': '📦 Bufor wiertarki',
      'PAKOWANIE': '📦 Rozpocznij pakowanie',
      'TRANSPORT': '🚚 Wyślij transport',
      'ZAKONCZONA': '✅ Zakończ zlecenie',
      'MAGAZYN': '🏭 Przekaż na magazyn'
    };
    return labels[kod] || kod;
  };

  // Określ ikonę dla przycisku
  const getButtonIcon = () => {
    if (currentStatus === 'ZAKONCZONA') {
      return <CheckCircleOutlined />;
    }
    if (currentStatus === 'NOWE') {
      return <RocketOutlined />;
    }
    return <SendOutlined />;
  };

  // Określ tekst przycisku
  const getButtonText = () => {
    if (currentStatus === 'ZAKONCZONA') {
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
    if (currentStatus === 'ZAKONCZONA') return 'default';
    return 'primary';
  };

  return (
    <>
      <Tooltip 
        title={currentStatus === 'ZAKONCZONA' ? 'Zlecenie zakończone' : 'Zmień status zlecenia'}
      >
        <Button
          type={getButtonType() as any}
          icon={getButtonIcon()}
          onClick={handleOpenModal}
          disabled={disabled || currentStatus === 'ZAKONCZONA'}
        >
          {getButtonText()}
        </Button>
      </Tooltip>

      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>Zmiana statusu ZKO</span>
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
            {/* Alert z aktualnym statusem */}
            <Alert
              message="Aktualny status"
              description={
                <Space>
                  <strong>{currentStatus}</strong>
                  {currentStatus === 'NOWE' && '- Zlecenie oczekuje na rozpoczęcie produkcji'}
                  {currentStatus === 'CIECIE' && '- Trwa cięcie formatek'}
                  {currentStatus === 'OKLEJANIE' && '- Trwa oklejanie krawędzi'}
                  {currentStatus === 'WIERCENIE' && '- Trwa wiercenie otworów'}
                  {currentStatus === 'PAKOWANIE' && '- Trwa pakowanie'}
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
                  description="Nie znaleziono następnych kroków dla tego zlecenia. Sprawdź status zlecenia."
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