import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  Row, 
  Col, 
  Space, 
  Spin, 
  Alert,
  message 
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useZKO } from '../hooks';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export const ZKOEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: zko, isLoading, error } = useZKO(Number(id));
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (zko) {
      form.setFieldsValue({
        kooperant: zko.kooperant,
        priorytet: zko.priorytet,
        data_planowana: zko.data_planowana ? dayjs(zko.data_planowana) : null,
        data_wyslania: zko.data_wyslania ? dayjs(zko.data_wyslania) : null,
        operator_pily: zko.operator_pily,
        operator_oklejarki: zko.operator_oklejarki,
        operator_wiertarki: zko.operator_wiertarki,
        komentarz: zko.komentarz,
      });
    }
  }, [zko, form]);

  const onFinish = async (values: any) => {
    try {
      // TODO: Implementuj API call do aktualizacji
      console.log('Update ZKO:', values);
      message.success('ZKO zaktualizowane pomyślnie');
      navigate(`/zko/${id}`);
    } catch (error) {
      message.error('Błąd podczas aktualizacji ZKO');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !zko) {
    return (
      <Alert
        message="Błąd ładowania danych"
        description="Nie udało się załadować danych ZKO do edycji"
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => navigate(`/zko/${id}`)}>
            Powrót do szczegółów
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/zko/${id}`)}
            >
              Powrót
            </Button>
            <h2 style={{ margin: 0 }}>
              Edytuj {zko.numer_zko}
            </h2>
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="Edycja podstawowych informacji">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Kooperant"
                    name="kooperant"
                    rules={[
                      { required: true, message: 'Podaj nazwę kooperanta' },
                      { min: 2, message: 'Nazwa musi mieć minimum 2 znaki' }
                    ]}
                  >
                    <Input placeholder="Nazwa kooperanta" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Priorytet"
                    name="priorytet"
                    rules={[{ required: true, message: 'Wybierz priorytet' }]}
                  >
                    <Select placeholder="Wybierz priorytet">
                      <Option value={1}>1 - Bardzo niski</Option>
                      <Option value={2}>2 - Niski</Option>
                      <Option value={3}>3 - Normalny</Option>
                      <Option value={4}>4 - Normalny+</Option>
                      <Option value={5}>5 - Średni</Option>
                      <Option value={6}>6 - Podwyższony</Option>
                      <Option value={7}>7 - Wysoki</Option>
                      <Option value={8}>8 - Bardzo wysoki</Option>
                      <Option value={9}>9 - Krytyczny</Option>
                      <Option value={10}>10 - Natychmiastowy</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Data planowana"
                    name="data_planowana"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      format="DD.MM.YYYY"
                      placeholder="Wybierz datę"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Data wysłania"
                    name="data_wyslania"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      format="DD.MM.YYYY"
                      placeholder="Wybierz datę"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Komentarz"
                name="komentarz"
              >
                <TextArea
                  rows={4}
                  placeholder="Dodatkowe uwagi do zlecenia..."
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Zapisz zmiany
                  </Button>
                  <Button onClick={() => navigate(`/zko/${id}`)}>
                    Anuluj
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Przypisanie operatorów">
            <Form
              layout="vertical"
              initialValues={{
                operator_pily: zko.operator_pily,
                operator_oklejarki: zko.operator_oklejarki,
                operator_wiertarki: zko.operator_wiertarki,
              }}
            >
              <Form.Item
                label="Operator piły"
                name="operator_pily"
              >
                <Select
                  placeholder="Wybierz operatora"
                  allowClear
                >
                  <Option value="Jan Kowalski">Jan Kowalski</Option>
                  <Option value="Anna Nowak">Anna Nowak</Option>
                  <Option value="Piotr Wiśniewski">Piotr Wiśniewski</Option>
                  <Option value="Maria Dąbrowska">Maria Dąbrowska</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Operator okleiniarki"
                name="operator_oklejarki"
              >
                <Select
                  placeholder="Wybierz operatora"
                  allowClear
                >
                  <Option value="Jan Kowalski">Jan Kowalski</Option>
                  <Option value="Anna Nowak">Anna Nowak</Option>
                  <Option value="Piotr Wiśniewski">Piotr Wiśniewski</Option>
                  <Option value="Maria Dąbrowska">Maria Dąbrowska</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Operator wiertarki"
                name="operator_wiertarki"
              >
                <Select
                  placeholder="Wybierz operatora"
                  allowClear
                >
                  <Option value="Jan Kowalski">Jan Kowalski</Option>
                  <Option value="Anna Nowak">Anna Nowak</Option>
                  <Option value="Piotr Wiśniewski">Piotr Wiśniewski</Option>
                  <Option value="Maria Dąbrowska">Maria Dąbrowska</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Informacje o statusie" style={{ marginTop: '24px' }}>
            <Alert
              message="Uwaga"
              description="Zmiana statusu i etapów realizacji odbywa się poprzez moduł Workflow. Edycja dotyczy tylko podstawowych informacji."
              type="warning"
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ZKOEditPage;