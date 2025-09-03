import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Select, DatePicker, ConfigProvider, Button, Space } from 'antd';
import plPL from 'antd/locale/pl_PL';
import 'antd/dist/reset.css';

// Test TYLKO Ant Design - bez ThemeProvider, bez routera
const AntdTestApp = () => {
  const [selectValue, setSelectValue] = useState<string | undefined>();
  const [dateValue, setDateValue] = useState<any>(null);

  const options = [
    { value: 'opt1', label: 'Opcja 1' },
    { value: 'opt2', label: 'Opcja 2' },
    { value: 'opt3', label: 'Opcja 3' },
  ];

  return (
    <ConfigProvider locale={plPL}>
      <div style={{ padding: '20px' }}>
        <h1>Test Ant Design - BEZ dodatkowych providerów</h1>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <h3>Ant Design Select:</h3>
            <Select
              style={{ width: 200 }}
              placeholder="Wybierz opcję"
              value={selectValue}
              onChange={(value) => {
                console.log('Ant Select changed:', value);
                setSelectValue(value);
              }}
              options={options}
            />
            <p>Wybrana wartość: {selectValue || 'brak'}</p>
          </div>

          <div>
            <h3>Ant Design DatePicker:</h3>
            <DatePicker
              placeholder="Wybierz datę"
              value={dateValue}
              onChange={(date, dateString) => {
                console.log('Ant DatePicker changed:', date, dateString);
                setDateValue(date);
              }}
            />
            <p>Wybrana data: {dateValue ? dateValue.format('YYYY-MM-DD') : 'brak'}</p>
          </div>

          <div>
            <h3>Ant Design Button:</h3>
            <Button 
              type="primary"
              onClick={() => {
                console.log('Ant Button clicked!');
                alert(`Select: ${selectValue}, Date: ${dateValue?.format('YYYY-MM-DD')}`);
              }}
            >
              Test Ant Button
            </Button>
          </div>

          <hr />

          <div>
            <h3>Zwykły HTML select (dla porównania):</h3>
            <select onChange={(e) => console.log('HTML select:', e.target.value)}>
              <option value="">-- Wybierz --</option>
              <option value="1">HTML Opcja 1</option>
              <option value="2">HTML Opcja 2</option>
            </select>
          </div>
        </Space>

        <div style={{ 
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #d0d0d0'
        }}>
          <h3>Debug:</h3>
          <ul>
            <li>React version: {React.version}</li>
            <li>Ant Design Select loaded: {Select ? '✅' : '❌'}</li>
            <li>Ant Design DatePicker loaded: {DatePicker ? '✅' : '❌'}</li>
            <li>ConfigProvider loaded: {ConfigProvider ? '✅' : '❌'}</li>
          </ul>
        </div>
      </div>
    </ConfigProvider>
  );
};

// Renderuj BEZPOŚREDNIO - bez ThemeProvider
ReactDOM.createRoot(document.getElementById('root')!).render(<AntdTestApp />);
