import React, { useState } from 'react';
import { 
  Card, 
  Steps, 
  Button, 
  Space, 
  Alert,
  Descriptions,
  Tag,
  Timeline,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Table
} from 'antd';
import { 
  ScissorOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useZKOList, useReportProduction } from '../../zko/hooks';

const { TextArea } = Input;
const { Option } = Select;

interface CuttingInstruction {
  step: number;
  title: string;
  description: string;
  safety?: string;
  tools?: string[];
}

export const CuttingPage: React.FC = () => {
  const [selectedZKO, setSelectedZKO] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [form] = Form.useForm();
  
  const { data: zkoData, refetch } = useZKOList({ 
    status: 'CIECIE_START' 
  });
  const reportMutation = useReportProduction();

  const cuttingInstructions: CuttingInstruction[] = [
    {
      step: 1,
      title: "Przygotowanie stanowiska",
      description: "Sprawdź stan piły, ostrość piły, prowadnice i urządzenia pomiarowe",
      safety: "Upewnij się, że wszystkie osłony są na miejscu",
      tools: ["Pila formatowa", "Liniał", "Kątownik", "Śrubokręt"]
    },
    {
      step: 2,
      title: "Weryfikacja zlecenia",
      description: "Sprawdź numer ZKO, rodzaj płyty, wymiary i ilości do przecięcia",
      safety: "Upewnij się, że masz właściwy rozkrój",
      tools: ["Dokumentacja ZKO", "Karta rozkroju"]
    },
    {
      step: 3,
      title: "Przygotowanie materiału",
      description: "Sprawdź płytę pod kątem wad, ustaw na stole, wyrównaj krawędzie",
      safety: "Uważaj na ostre krawędzie płyt",
      tools: ["Wózek paletowy", "Rękawice ochronne"]
    },
    {
      step: 4,
      title: "Ustawienie wymiarów",
      description: "Ustaw prowadnice na wymiary zgodne z rozkrojem",
      safety: "Dokładnie sprawdź wymiary przed rozpoczęciem cięcia",
      tools: ["Miarka", "Ołówek do zaznaczania"]
    },
    {
      step: 5,
      title: "Rozpoczęcie cięcia",
      description: "Rozpocznij cięcie według kolejności z rozkroju, zachowaj równomierne tempo",
      safety: "Używaj popychaczy, nie przechodziś przez płaszczyznę cięcia",
      tools: ["Popychacze", "Okulary ochronne", "Nauszniki"]
    },
    {
      step: 6,
      title: "Kontrola jakości",
      description: "Sprawdzaj wymiary każdej formatki, oznaczaj wadliwe elementy",
      safety: "Używaj narzędzi pomiarowych, nie sprawdzaj ręką",
      tools: ["Suwmiarka", "Kątownik", "Marker"]
    },
    {
      step: 7,
      title: "Układanie na palecie",
      description: "Układaj formatki zgodnie z instrukcją, oddzielaj warstwy",
      safety: "Nie przekraczaj maksymalnej wysokości palety (180cm)",
      tools: ["Paleta EURO", "Przekładki", "Folia stretch"]
    },
    {
      step: 8,
      title: "Finalizacja",
      description: "Oznacz paletę, wypełnij raport produkcji, posprzątaj stanowisko",
      safety: "Wyłącz maszynę, zabezpiecz narzędzia",
      tools: ["Etykieta palety", "Formularz raportu"]
    }
  ];

  const handleReportProduction = async (values: any) => {
    try {
      await reportMutation.mutateAsync({
        pozycja_id: values.pozycja_id,
        formatka_id: values.formatka_id,
        ilosc_ok: values.ilosc_ok,
        ilosc_uszkodzona: values.ilosc_uszkodzona || 0,
        operator: values.operator,
        uwagi: values.uwagi
      });
      
      setShowReportModal(false);
      form.resetFields();
      refetch();
      message.success('Raport produkcji został zapisany');
    } catch (error) {
      message.error('Błąd podczas zapisywania raportu');
    }
  };

  const queueColumns = [
    {
      title: 'ZKO',
      dataIndex: 'numer_zko',
      key: 'numer_zko',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Kooperant',
      dataIndex: 'kooperant',
      key: 'kooperant',
    },
    {
      title: 'Priorytet',
      dataIndex: 'priorytet',
      key: 'priorytet',
      render: (priority: number) => (
        <Tag color={priority >= 8 ? 'red' : priority >= 6 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
      sorter: (a: any, b: any) => b.priorytet - a.priorytet,
    },
    {
      title: 'Akcje',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small"
            onClick={() => setSelectedZKO(record)}
          >
            Wybierz
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Stanowisko cięcia - Instrukcje</h1>

      {/* Kolejka zadań */}
      <Card title="Kolejka zadań do cięcia" style={{ marginBottom: '24px' }}>
        {zkoData?.data && zkoData.data.length > 0 ? (
          <Table
            columns={queueColumns}
            dataSource={zkoData.data}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Alert
            message="Brak zadań w kolejce"
            description="Obecnie nie ma zleceń oczekujących na cięcie"
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Wybrane ZKO */}
      {selectedZKO && (
        <Card 
          title={`Aktualnie realizowane: ZKO ${selectedZKO.numer_zko}`}
          style={{ marginBottom: '24px' }}
          extra={
            <Button 
              type="primary"
              onClick={() => setShowReportModal(true)}
            >
              Raportuj produkcję
            </Button>
          }
        >
          <Descriptions column={2}>
            <Descriptions.Item label="Kooperant">
              {selectedZKO.kooperant}
            </Descriptions.Item>
            <Descriptions.Item label="Priorytet">
              <Tag color={selectedZKO.priorytet >= 8 ? 'red' : 'green'}>
                {selectedZKO.priorytet}/10
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Instrukcje krok po kroku */}
      <Card title="Instrukcja cięcia - krok po kroku">
        <Steps
          direction="vertical"
          current={-1}
          items={cuttingInstructions.map((instruction) => ({
            title: `Krok ${instruction.step}: ${instruction.title}`,
            description: (
              <div style={{ paddingTop: '8px' }}>
                <p style={{ marginBottom: '8px' }}>{instruction.description}</p>
                
                {instruction.safety && (
                  <Alert
                    message="Bezpieczeństwo"
                    description={instruction.safety}
                    type="warning"
                    size="small"
                    showIcon
                    icon={<SafetyOutlined />}
                    style={{ marginBottom: '8px' }}
                  />
                )}
                
                {instruction.tools && (
                  <div>
                    <strong>Narzędzia:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {instruction.tools.map((tool, index) => (
                        <Tag key={index} icon={<ToolOutlined />} style={{ margin: '2px' }}>
                          {tool}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
            status: 'wait',
            icon: <ScissorOutlined />
          }))}
        />
      </Card>

      {/* Zasady bezpieczeństwa */}
      <Card title="Zasady bezpieczeństwa" style={{ marginTop: '24px' }}>
        <Alert
          message="WAŻNE: Zawsze przestrzegaj zasad BHP!"
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <Timeline
          items={[
            {
              color: 'red',
              children: 'Używaj środków ochrony indywidualnej - okulary, nauszniki, rękawice'
            },
            {
              color: 'orange', 
              children: 'Sprawdź stan techniczny maszyny przed rozpoczęciem pracy'
            },
            {
              color: 'blue',
              children: 'Nigdy nie usuwaj osłon bezpieczeństwa'
            },
            {
              color: 'green',
              children: 'Używaj popychaczy - nigdy nie prowadź materiału ręką'
            },
            {
              color: 'purple',
              children: 'Wyłącz maszynę podczas czyszczenia lub serwisu'
            },
            {
              color: 'gray',
              children: 'W razie problemów natychmiast zawiadom przełożonego'
            }
          ]}
        />
      </Card>

      {/* Modal raportowania */}
      <Modal
        title="Raportowanie produkcji"
        open={showReportModal}
        onCancel={() => {
          setShowReportModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleReportProduction}
        >
          <Form.Item
            label="ID Pozycji"
            name="pozycja_id"
            rules={[{ required: true, message: 'ID pozycji jest wymagany' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="ID pozycji z ZKO"
            />
          </Form.Item>

          <Form.Item
            label="ID Formatki"
            name="formatka_id"
            rules={[{ required: true, message: 'ID formatki jest wymagany' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="ID formatki"
            />
          </Form.Item>

          <Form.Item
            label="Ilość OK (wyprodukowana)"
            name="ilosc_ok"
            rules={[{ required: true, message: 'Ilość OK jest wymagana' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              min={0}
              placeholder="Ilość prawidłowo wykonanych formatek"
            />
          </Form.Item>

          <Form.Item
            label="Ilość uszkodzona"
            name="ilosc_uszkodzona"
          >
            <InputNumber 
              style={{ width: '100%' }}
              min={0}
              placeholder="Ilość uszkodzonych formatek"
            />
          </Form.Item>

          <Form.Item
            label="Operator"
            name="operator"
            rules={[{ required: true, message: 'Operator jest wymagany' }]}
          >
            <Select placeholder="Wybierz operatora">
              <Option value="Jan Kowalski">Jan Kowalski</Option>
              <Option value="Anna Nowak">Anna Nowak</Option>
              <Option value="Piotr Wiśniewski">Piotr Wiśniewski</Option>
              <Option value="Marcin Test">Marcin Test</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Uwagi"
            name="uwagi"
          >
            <TextArea 
              rows={3}
              placeholder="Dodatkowe uwagi o produkcji..."
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowReportModal(false);
                form.resetFields();
              }}>
                Anuluj
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={reportMutation.isPending}
                icon={<CheckCircleOutlined />}
              >
                Zapisz raport
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CuttingPage;