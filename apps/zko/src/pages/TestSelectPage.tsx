import React, { useState } from 'react';
import { Select, Card, Space, Typography, Button, Divider, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export const TestSelectPage: React.FC = () => {
  const [value1, setValue1] = useState<string | undefined>();
  const [value2, setValue2] = useState<string | undefined>();
  const [value3, setValue3] = useState<string | undefined>();

  const testOptions = [
    { value: 'opt1', label: 'Opcja 1' },
    { value: 'opt2', label: 'Opcja 2' },
    { value: 'opt3', label: 'Opcja 3' },
    { value: 'opt4', label: 'Opcja 4' },
    { value: 'opt5', label: 'Opcja 5' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Test Ant Design Select</Title>
      
      <Alert
        message="Strona testowa do debugowania problemów z Select"
        description="Jeśli poniższe selecty nie działają (nie otwierają się po kliknięciu), problem jest w konfiguracji projektu."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* Test 1: Podstawowy Select */}
        <Card title="Test 1: Podstawowy Select">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Najprostszy Select z options prop:</Text>
            <Select
              style={{ width: 300 }}
              placeholder="Kliknij aby wybrać"
              value={value1}
              onChange={setValue1}
              options={testOptions}
            />
            <Text type="secondary">Wybrano: {value1 || 'nic'}</Text>
          </Space>
        </Card>

        {/* Test 2: Select z Option components */}
        <Card title="Test 2: Select z Option components">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Select ze starą składnią Option:</Text>
            <Select
              style={{ width: 300 }}
              placeholder="Kliknij aby wybrać"
              value={value2}
              onChange={setValue2}
            >
              <Option value="a">Opcja A</Option>
              <Option value="b">Opcja B</Option>
              <Option value="c">Opcja C</Option>
            </Select>
            <Text type="secondary">Wybrano: {value2 || 'nic'}</Text>
          </Space>
        </Card>

        {/* Test 3: Select z wyszukiwaniem */}
        <Card title="Test 3: Select z wyszukiwaniem">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Select z showSearch:</Text>
            <Select
              style={{ width: 300 }}
              placeholder="Wpisz aby wyszukać"
              value={value3}
              onChange={setValue3}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: 'bialy', label: 'Biały' },
                { value: 'czarny', label: 'Czarny' },
                { value: 'szary', label: 'Szary' },
                { value: 'niebieski', label: 'Niebieski' },
                { value: 'zielony', label: 'Zielony' },
              ]}
            />
            <Text type="secondary">Wybrano: {value3 || 'nic'}</Text>
          </Space>
        </Card>

        {/* Test 4: Native HTML select */}
        <Card title="Test 4: Native HTML select (porównanie)">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Zwykły HTML select - powinien zawsze działać:</Text>
            <select style={{ width: 300, padding: '4px 8px', fontSize: '14px' }}>
              <option>Opcja 1</option>
              <option>Opcja 2</option>
              <option>Opcja 3</option>
            </select>
            <Text type="secondary">Jeśli ten działa a Ant Design nie - problem jest w konfiguracji</Text>
          </Space>
        </Card>

        <Divider />

        {/* Informacje debugowe */}
        <Card title="Informacje debugowe">
          <Space direction="vertical">
            <Text>Ant Design version: sprawdź package.json</Text>
            <Text>React version: sprawdź package.json</Text>
            <Text>
              Czy widzisz błędy w konsoli przeglądarki? (F12 → Console)
            </Text>
            <Button 
              type="primary" 
              onClick={() => {
                console.log('Test click - czy konsola działa');
                console.log('Value 1:', value1);
                console.log('Value 2:', value2);
                console.log('Value 3:', value3);
              }}
            >
              Test konsoli (sprawdź F12)
            </Button>
          </Space>
        </Card>

      </Space>
    </div>
  );
};
