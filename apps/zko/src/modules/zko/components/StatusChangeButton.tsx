import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select, message, Alert, Space, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  LockOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;

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
  const [validating, setValidating] = useState(false);
  const [form] = Form.useForm();
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [confirmWarnings, setConfirmWarnings] = useState(false);

  const handleOpenModal = async () => {
    setModalVisible(true);
    setValidation(null);
    setConfirmWarnings(false);
    form.resetFields();
    
    // Pobierz walidację dla wszystkich kroków
    await validateAllSteps();
  };

  const validateAllSteps = async () => {
    setValidating(true);
    try {
      const response = await fetch(`/api/zko/${zkoId}/status-validation`);
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      }
    } catch (error) {
      console.error('Error validating steps:', error);
    } finally {
      setValidating(false);
    }
  };

  const validateStep = async (stepCode: string) => {
    try {
      const response = await fetch('/api/zko/status/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zko_id: zkoId,
          nowy_etap_kod: stepCode
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error validating step:', error);
    }
    return null;
  };

  const handleStepSelect = async (stepCode: string) => {
    const step = validation?.mozliwe_przejscia?.find((s: any) => s.kod_etapu === stepCode);
    setSelectedStep(step);
    
    // Waliduj wybrany krok
    if (step) {
      const stepValidation = await validateStep(stepCode);
      if (stepValidation) {
        setSelectedStep({
          ...step,
          ...stepValidation
        });
      }
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedStep) {
      message.error('Wybierz etap docelowy');
      return;
    }

    // Jeśli są ostrzeżenia i nie potwierdzono
    if (selectedStep.ostrzezenia?.length > 0 && !confirmWarnings) {
      Modal.confirm({
        title: 'Potwierdzenie zmiany statusu',
        content: (
          <div>
            <p>Wykryto następujące ostrzeżenia:</p>
            <ul>
              {selectedStep.ostrzezenia.map((warning: string, idx: number) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
            <p>Czy na pewno chcesz kontynuować?</p>
          </div>
        ),
        onOk: () => {
          setConfirmWarnings(true);
          handleSubmit({ ...values, wymus: true });
        },
        okText: 'Tak, kontynuuj',
        cancelText: 'Anuluj'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/zko/status/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zko_id: zkoId,
          nowy_etap_kod: selectedStep.kod_etapu,
          uzytkownik: 'system',
          komentarz: values.komentarz,
          operator: values.operator,
          lokalizacja: values.lokalizacja,
          wymus: values.wymus || confirmWarnings
        })
      });

      const data = await response.json();

      if (data.sukces) {
        message.success(data.komunikat || 'Status zmieniony pomyślnie');
        setModalVisible(false);
        form.resetFields();
        onStatusChanged?.();
      } else if (data.wymaga_potwierdzenia) {
        // Pokaż ostrzeżenia
        Modal.confirm({
          title: 'Wymagane potwierdzenie',
          content: (
            <div>
              <Alert
                message="Ostrzeżenia"
                description={
                  <ul>
                    {data.ostrzezenia?.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
              />
            </div>
          ),
          onOk: () => handleSubmit({ ...values, wymus: true }),
          okText: 'Kontynuuj mimo to',
          cancelText: 'Anuluj'
        });
      } else {
        // Pokaż błędy
        Modal.error({
          title: 'Nie można zmienić statusu',
          content: (
            <div>
              <p>{data.komunikat}</p>
              {data.bledy?.length > 0 && (
                <Alert
                  message="Błędy do naprawienia:"
                  description={
                    <ul>
                      {data.bledy.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </div>
          )
        });
      }
    } catch (error: any) {
      console.error('Error changing status:', error);
      message.error('Błąd podczas zmiany statusu');
    } finally {
      setLoading(false);
    }
  };

  // Określ ikonę dla przycisku
  const getButtonIcon = () => {
    if (validation?.ma_blokady) {
      return <LockOutlined />;
    }
    return <PlayCircleOutlined />;
  };

  // Określ tekst przycisku
  const getButtonText = () => {
    if (currentStatus === 'NOWE' && validation?.liczba_pozycji === 0) {
      return 'Dodaj pozycje aby rozpocząć';
    }
    if (currentStatus === 'NOWE' && validation?.liczba_palet === 0) {
      return 'Zaplanuj palety aby rozpocząć';
    }
    return 'Następny krok';
  };

  return (
    <>
      <Tooltip 
        title={validation?.ma_blokady ? 'Są wymagania do spełnienia' : 'Zmień status zlecenia'}
      >
        <Button
          type="primary"
          icon={getButtonIcon()}
          onClick={handleOpenModal}
          disabled={disabled || nextSteps.length === 0}
          danger={validation?.ma_blokady}
        >
          {getButtonText()}
        </Button>
      </Tooltip>

      <Modal
        title="Zmiana statusu ZKO"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Wybór następnego etapu */}
          <Form.Item
            label="Następny etap"
            name="nowy_etap_kod"
            rules={[{ required: true, message: 'Wybierz etap' }]}
          >
            <Select
              placeholder="Wybierz następny etap"
              onChange={handleStepSelect}
              loading={validating}
            >
              {validation?.mozliwe_przejscia?.map((step: any) => (
                <Select.Option 
                  key={step.kod_etapu} 
                  value={step.kod_etapu}
                  disabled={!step.mozna_zmienic}
                >
                  <Space>
                    {step.mozna_zmienic ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <LockOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <span>{step.nazwa_etapu}</span>
                    {step.ostrzezenia?.length > 0 && (
                      <WarningOutlined style={{ color: '#faad14' }} />
                    )}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Pokaż błędy dla wybranego kroku */}
          {selectedStep?.bledy?.length > 0 && (
            <Alert
              message="Wymagania do spełnienia"
              description={
                <ul>
                  {selectedStep.bledy.map((error: string, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Pokaż ostrzeżenia dla wybranego kroku */}
          {selectedStep?.ostrzezenia?.length > 0 && (
            <Alert
              message="Ostrzeżenia"
              description={
                <ul>
                  {selectedStep.ostrzezenia.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Operator */}
          <Form.Item
            label="Operator"
            name="operator"
          >
            <Input placeholder="Imię i nazwisko operatora" />
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
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={selectedStep && !selectedStep.mozna_zmienic}
              >
                Zmień status
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Anuluj
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StatusChangeButton;