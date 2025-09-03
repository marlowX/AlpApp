import React, { useState } from 'react';
import { Select, Button, Card, Space, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';

export const SelectTestPage: React.FC = () => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  
  // Proste opcje
  const simpleOptions = [
    { value: 'option1', label: 'Opcja 1' },
    { value: 'option2', label: 'Opcja 2' },
    { value: 'option3', label: 'Opcja 3' },
  ];

  const handleChange = (val: string) => {
    console.log('Selected:', val);
    setValue(val);
    message.success(`Wybrano: ${val}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => navigate('/zko')} style={{ marginBottom: 24 }}>
        Powrót do ZKO
      </Button>
      
      <Card title="Test Selectów">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* Test 1: Prosty Select */}
          <div>
            <h3>Test 1: Prosty Select</h3>
            <Select
              style={{ width: 300 }}
              placeholder="Wybierz opcję"
              onChange={handleChange}
              value={value}
              options={simpleOptions}
            />
            <div style={{ marginTop: 8 }}>
              Wybrana wartość: {value || 'brak'}
            </div>
          </div>

          {/* Test 2: Select z wyszukiwaniem */}
          <div>
            <h3>Test 2: Select z wyszukiwaniem</h3>
            <Select
              showSearch
              style={{ width: 300 }}
              placeholder="Wpisz aby wyszukać"
              optionFilterProp="label"
              options={simpleOptions}
            />
          </div>

          {/* Test 3: Select w Form */}
          <div>
            <h3>Test 3: Select w Form</h3>
            <Form layout="vertical">
              <Form.Item label="Wybierz wartość" name="test">
                <Select
                  placeholder="Wybierz z listy"
                  options={simpleOptions}
                />
              </Form.Item>
            </Form>
          </div>

          {/* Test 4: Select z virtual=false */}
          <div>
            <h3>Test 4: Select bez virtual scroll</h3>
            <Select
              virtual={false}
              style={{ width: 300 }}
              placeholder="Select bez virtual"
              options={simpleOptions}
            />
          </div>

          {/* Test 5: Native HTML select dla porównania */}
          <div>
            <h3>Test 5: Native HTML select (dla porównania)</h3>
            <select 
              style={{ width: 300, padding: 8 }}
              onChange={(e) => console.log('Native select:', e.target.value)}
            >
              <option value="">Wybierz opcję</option>
              <option value="1">Opcja 1</option>
              <option value="2">Opcja 2</option>
              <option value="3">Opcja 3</option>
            </select>
          </div>

        </Space>
      </Card>

      <Card title="Informacje debugowania" style={{ marginTop: 24 }}>
        <pre>
          {JSON.stringify({
            antdVersion: '5.12.0',
            reactVersion: '18.3.0',
            strictMode: 'wyłączony',
            virtual: 'false w ConfigProvider'
          }, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default SelectTestPage;
