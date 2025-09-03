import React from 'react';
import { Select, DatePicker, Card, Space, Form, Button } from 'antd';
import dayjs from 'dayjs';

export const TestSelectPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    alert(JSON.stringify(values, null, 2));
  };

  // Opcje dla Select - nowa składnia
  const selectOptions = [
    { value: 'option1', label: 'Opcja 1' },
    { value: 'option2', label: 'Opcja 2' },
    { value: 'option3', label: 'Opcja 3' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Test Select i DatePicker</h1>
      
      <Card title="Prosty test - bez Form">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <h3>Select podstawowy:</h3>
            <Select
              style={{ width: 200 }}
              placeholder="Wybierz opcję"
              options={selectOptions}
              onChange={(value) => console.log('Select changed:', value)}
            />
          </div>

          <div>
            <h3>DatePicker podstawowy:</h3>
            <DatePicker
              placeholder="Wybierz datę"
              onChange={(date) => console.log('Date changed:', date)}
            />
          </div>

          <div>
            <h3>Select z defaultValue:</h3>
            <Select
              style={{ width: 200 }}
              defaultValue="option1"
              options={selectOptions}
            />
          </div>
        </Space>
      </Card>

      <Card title="Test w Form" style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="select"
            label="Select w Form"
            rules={[{ required: true, message: 'Pole wymagane' }]}
          >
            <Select
              placeholder="Wybierz wartość"
              options={selectOptions}
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="DatePicker w Form"
            rules={[{ required: true, message: 'Data wymagana' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Wybierz datę"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Wyślij formularz
          </Button>
        </Form>
      </Card>

      <Card title="Debugowanie" style={{ marginTop: 24 }}>
        <Space direction="vertical">
          <div>React version: {React.version}</div>
          <div>Ant Design DatePicker test: {DatePicker ? '✅ Loaded' : '❌ Not loaded'}</div>
          <div>Ant Design Select test: {Select ? '✅ Loaded' : '❌ Not loaded'}</div>
          <div>Dayjs test: {dayjs ? '✅ Loaded' : '❌ Not loaded'}</div>
        </Space>
      </Card>
    </div>
  );
};