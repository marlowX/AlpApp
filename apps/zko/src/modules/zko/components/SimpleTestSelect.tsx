import React, { useState } from 'react';
import { Select, Card, Button, message, Space, Alert } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

interface SimpleTestSelectProps {
  onClose?: () => void;
}

export const SimpleTestSelect: React.FC<SimpleTestSelectProps> = ({ onClose }) => {
  const [value, setValue] = useState<string | undefined>();
  const [isWorking, setIsWorking] = useState<boolean | null>(null);

  const handleTest = () => {
    if (value) {
      setIsWorking(true);
      message.success('Select działa poprawnie!');
    } else {
      setIsWorking(false);
      message.error('Select nie działa - nie wybrano wartości');
    }
  };

  return (
    <Card 
      title="Test Select w module ZKO" 
      size="small"
      style={{ marginBottom: 16 }}
      extra={onClose && <Button size="small" onClick={onClose}>Zamknij</Button>}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="Quick Test"
          description="Jeśli poniższy select się nie otwiera po kliknięciu, problem jest globalny."
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
        />
        
        <Select
          style={{ width: '100%' }}
          placeholder="Kliknij tutaj aby otworzyć listę"
          value={value}
          onChange={setValue}
          options={[
            { value: 'test1', label: 'Test 1' },
            { value: 'test2', label: 'Test 2' },
            { value: 'test3', label: 'Test 3' },
          ]}
        />
        
        <Button type="primary" onClick={handleTest} block>
          Sprawdź czy działa
        </Button>
        
        {isWorking === true && (
          <Alert
            message="Sukces!"
            description="Select działa poprawnie. Problem może być tylko w konkretnym komponencie."
            type="success"
            icon={<CheckCircleOutlined />}
          />
        )}
        
        {isWorking === false && (
          <Alert
            message="Problem!"
            description="Select nie działa. Sprawdź konsolę przeglądarki (F12)."
            type="error"
            icon={<WarningOutlined />}
          />
        )}
      </Space>
    </Card>
  );
};
