import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Steps, 
  Button, 
  Space, 
  Select, 
  Input, 
  Form, 
  Modal,
  message,
  Descriptions,
  Tag,
  Alert,
  Progress,
  Timeline,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlayCircleOutlined, 
  CheckCircleOutlined,
  ForwardOutlined,
  ScissorOutlined,
  PauseCircleOutlined,
  ToolOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useZKO, useChangeStatus, useNextSteps } from '../../zko/hooks';
import { statusLabels } from '../../zko/utils/constants';

const { Option } = Select;
const { TextArea } = Input;

export const WorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: zko, refetch } = useZKO(Number(id));
  const { data: nextSteps } = useNextSteps(Number(id));
  const changeStatusMutation = useChangeStatus();

  const workflowSteps = [
    { 
      title: 'Utworzenie ZKO', 
      key: 'nowe', 
      description: 'Zlecenie utworzone, oczekuje na rozpoczęcie',
      icon: <PlayCircleOutlined />
    },
    { 
      title: 'Start cięcia', 
      key: 'CIECIE_START', 
      description: 'Rozpoczęcie procesu cięcia na pile',
      icon: <ScissorOutlined />
    },
    { 
      title: 'Otwarcie palety', 
      key: 'OTWARCIE_PALETY', 
      description: 'Otworzenie palety do pakowania formatek',
      icon: <ToolOutlined />
    },
    { 
      title: 'Pakowanie palety', 
      key: 'PAKOWANIE_PALETY', 
      description: 'Układanie formatek na palecie',
      icon: <ToolOutlined />
    },
    { 
      title: 'Zamknięcie palety', 
      key: 'ZAMKNIECIE_PALETY', 
      description: 'Paleta zapakowana i oznakowana',
      icon: <CheckCircleOutlined />
    },
    { 
      title: 'Stop cięcia', 
      key: 'CIECIE_STOP', 
      description: 'Zakończenie procesu cięcia',
      icon: <PauseCircleOutlined />
    },
    { 
      title: 'Bufor piła', 
      key: 'BUFOR_PILA', 
      description: 'Paleta w buforze po cięciu',
      icon: <PauseCircleOutlined />
    },
    { 
      title: 'Transport 1', 
      key: 'TRANSPORT_1', 
      description: 'Transport do okleiniarki',
      icon: <TruckOutlined />
    },
    { 
      title: 'Bufor okleiniarka', 
      key: 'BUFOR_OKLEINIARKA', 
      description: 'Oczekiwanie na oklejanie',
      icon: <PauseCircleOutlined />
    },
    { 
      title: 'Start oklejania', 
      key: 'OKLEJANIE_START', 
      description: 'Rozpoczęcie oklejania krawędzi',
      icon: <ToolOutlined />
    },
    { 
      title: 'Stop oklejania', 
      key: 'OKLEJANIE_STOP', 
      description: 'Zakończenie oklejania',
      icon: <CheckCircleOutlined />
    },
    { 
      title: 'Transport 2', 
      key: 'TRANSPORT_2', 
      description: 'Transport do wiertarki',
      icon: <TruckOutlined />
    },
    { 
      title: 'Bufor wiertarka', 
      key: 'BUFOR_WIERTARKA', 
      description: 'Oczekiwanie na wiercenie',
      icon: <PauseCircleOutlined />
    },
    { 
      title: 'Start wiercenia', 
      key: 'WIERCENIE_START', 
      description: 'Rozpoczęcie wiercenia otworów',
      icon: <ToolOutlined />
    },
    { 
      title: 'Stop wiercenia', 
      key: 'WIERCENIE_STOP', 
      description: 'Zakończenie wiercenia',
      icon: <CheckCircleOutlined />
    },
    { 
      title: 'Kompletowanie', 
      key: 'KOMPLETOWANIE_START', 
      description: 'Kompletowanie i kontrola jakości',
      icon: <CheckCircleOutlined />
    },
    { 
      title: 'Wysyłka', 
      key: 'WYSYLKA', 
      description: 'Wysłano do klienta',
      icon: <TruckOutlined />
    },
    { 
      title: 'Zakończone', 
      key: 'ZAKONCZONE', 
      description: 'Zlecenie zakończone pomyślnie',
      icon: <CheckCircleOutlined />
    },
  ];

  const currentStepIndex = workflowSteps.findIndex(step => step.key === zko?.status);

  const handleStatusChange = async (values: any) => {
    try {
      await changeStatusMutation.mutateAsync({
        zko_id: Number(id),
        nowy_etap_kod: selectedStatus,
        komentarz: values.komentarz,
        operator: values.operator,
        lokalizacja: values.lokalizacja,
      });
      
      setShowModal(false);
      form.resetFields();
      refetch();
      message.success(`Status zmieniony na: ${statusLabels[selectedStatus] || selectedStatus}`);
    } catch (error) {
      message.error('Błąd podczas zmiany statusu');
    }
  };

  const openStatusModal = (status: string) => {
    setSelectedStatus(status);
    setShowModal(true);
  };

  // Oblicz postęp
  const progressPercent = currentStepIndex >= 0 ? 
    Math.round((currentStepIndex / (workflowSteps.length - 1)) * 100) : 0;

  // Szybkie akcje dla najczęstszych statusów
  const getQuickActions = () => {
    const currentStatus = zko?.status;
    
    const quickActions = [];
    
    if (currentStatus === 'nowe') {
      quickActions.push({
        key: 'CIECIE_START',
        label: 'Rozpocznij cięcie',
        type: 'primary',
        icon: <ScissorOutlined />
      });
    }
    
    if (currentStatus === 'CIECIE_START') {
      quickActions.push({
        key: 'OTWARCIE_PALETY',
        label: 'Otwórz paletę',
        type: 'default',
        icon: <ToolOutlined />
      });
    }
    
    if (currentStatus === 'OTWARCIE_PALETY') {
      quickActions.push({
        key: 'PAKOWANIE_PALETY',
        label: 'Pakuj paletę',
        type: 'default',
        icon: <ToolOutlined />
      });
    }
    
    if (currentStatus === 'PAKOWANIE_PALETY') {
      quickActions.push({
        key: 'ZAMKNIECIE_PALETY',
        label: 'Zamknij paletę',
        type: 'default',
        icon: <CheckCircleOutlined />
      });
    }
    
    if (currentStatus === 'ZAMKNIECIE_PALETY') {
      quickActions.push({
        key: 'CIECIE_STOP',
        label: 'Zakończ cięcie',
        type: 'default',
        icon: <PauseCircleOutlined />
      });
    }

    return quickActions;
  };

  const quickActions = getQuickActions();

  if (!zko) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/zko/${id}`)}
          style={{ marginRight: '16px' }}
        >
          Powrót
        </Button>
        <h1 style={{ margin: 0 }}>
          Workflow - ZKO {zko.numer_zko}
        </h1>
      </div>

      {/* Postęp ogólny */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Postęp realizacji</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Krok {currentStepIndex + 1} z {workflowSteps.length}
            </p>
          </div>
          <Tag color="processing" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {statusLabels[zko.status] || zko.status}
          </Tag>
        </div>
        <Progress 
          percent={progressPercent} 
          status="active"
          strokeColor={{
            '0%': '#1890ff',
            '50%': '#52c41a',
            '100%': '#52c41a',
          }}
        />
      </Card>

      {/* Podstawowe info */}
      <Card style={{ marginBottom: '24px' }}>
        <Descriptions column={3}>
          <Descriptions.Item label="Kooperant">
            <strong>{zko.kooperant}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Priorytet">
            <Tag color={zko.priorytet >= 8 ? 'red' : zko.priorytet >= 6 ? 'orange' : 'green'}>
              {zko.priorytet}/10
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Operator piły">
            {zko.operator_pily || 'Nie przypisany'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Szybkie akcje */}
      {quickActions.length > 0 && (
        <Card title="Szybkie akcje" style={{ marginBottom: '24px' }}>
          <Space wrap>
            {quickActions.map((action) => (
              <Button
                key={action.key}
                type={action.type as any}
                icon={action.icon}
                size="large"
                onClick={() => openStatusModal(action.key)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* Timeline workflow */}
      <Card title="Historia workflow" style={{ marginBottom: '24px' }}>
        <Timeline
          items={workflowSteps.map((step, index) => {
            let color = 'gray';
            let status = 'Oczekuje';
            
            if (index < currentStepIndex) {
              color = 'green';
              status = 'Zakończono';
            } else if (index === currentStepIndex) {
              color = 'blue';
              status = 'W trakcie';
            }
            
            return {
              color,
              dot: step.icon,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{step.title}</strong>
                    <Tag color={color === 'green' ? 'success' : color === 'blue' ? 'processing' : 'default'}>
                      {status}
                    </Tag>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {step.description}
                  </p>
                </div>
              )
            };
          })}
        />
      </Card>

      {/* Wszystkie dostępne akcje */}
      <Card title="Wszystkie dostępne akcje">
        {nextSteps && nextSteps.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {nextSteps.map((step) => (
              <Button
                key={step.kod_etapu}
                type={step.czy_dostepny ? 'default' : 'dashed'}
                icon={<ForwardOutlined />}
                disabled={!step.czy_dostepny}
                onClick={() => openStatusModal(step.kod_etapu)}
                title={step.czy_dostepny ? step.komunikat : `Niedostępne: ${step.komunikat}`}
              >
                {step.nazwa}
              </Button>
            ))}
          </div>
        ) : (
          <Alert
            message="Brak dostępnych akcji"
            description="Zlecenie może być w stanie końcowym lub występuje błąd w konfiguracji workflow."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Modal zmiany statusu */}
      <Modal
        title={`Zmiana statusu na: ${statusLabels[selectedStatus] || selectedStatus}`}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStatusChange}
          initialValues={{
            operator: 'Operator systemu',
            lokalizacja: 'Stanowisko produkcyjne'
          }}
        >
          <Alert 
            message={`Zmiana statusu z "${statusLabels[zko.status] || zko.status}" na "${statusLabels[selectedStatus] || selectedStatus}"`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="Operator"
            name="operator"
            help="Nazwa operatora wykonującego operację"
            rules={[{ required: true, message: 'Operator jest wymagany' }]}
          >
            <Select placeholder="Wybierz operatora">
              <Option value="Jan Kowalski">Jan Kowalski - Operator piły</Option>
              <Option value="Anna Nowak">Anna Nowak - Operator okleiniarki</Option>
              <Option value="Piotr Wiśniewski">Piotr Wiśniewski - Operator wiertarki</Option>
              <Option value="Marcin Test">Marcin Test - Operator uniwersalny</Option>
              <Option value="Operator systemu">Operator systemu</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Lokalizacja"
            name="lokalizacja"
            help="Miejsce wykonania operacji"
            rules={[{ required: true, message: 'Lokalizacja jest wymagana' }]}
          >
            <Select placeholder="Wybierz lokalizację">
              <Option value="Piła formatowa 1">Piła formatowa 1</Option>
              <Option value="Piła formatowa 2">Piła formatowa 2</Option>
              <Option value="Okleiniarka A">Okleiniarka A</Option>
              <Option value="Okleiniarka B">Okleiniarka B</Option>
              <Option value="Wiertarka CNC">Wiertarka CNC</Option>
              <Option value="Stanowisko kompletowania">Stanowisko kompletowania</Option>
              <Option value="Magazyn">Magazyn</Option>
              <Option value="Stanowisko produkcyjne">Stanowisko produkcyjne</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Komentarz"
            name="komentarz"
            help="Dodatkowe informacje o zmianie statusu"
          >
            <TextArea 
              rows={3}
              placeholder="Wpisz komentarz o wykonanej operacji..."
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowModal(false);
                form.resetFields();
              }}>
                Anuluj
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={changeStatusMutation.isPending}
                icon={<CheckCircleOutlined />}
                size="large"
              >
                Potwierdź zmianę statusu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowPage;