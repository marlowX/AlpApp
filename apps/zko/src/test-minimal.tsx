import React from 'react';
import ReactDOM from 'react-dom/client';
import { Select, ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

const TestApp = () => {
  const [value, setValue] = React.useState<string | undefined>(undefined);

  return (
    <div style={{ padding: 50 }}>
      <h1>Minimalny test Select</h1>
      
      <div style={{ marginBottom: 20 }}>
        <h3>Test 1: Bez ConfigProvider</h3>
        <Select
          style={{ width: 200 }}
          placeholder="Kliknij tutaj"
          onChange={(val) => {
            console.log('Selected:', val);
            setValue(val);
          }}
          value={value}
        >
          <Select.Option value="opt1">Opcja 1</Select.Option>
          <Select.Option value="opt2">Opcja 2</Select.Option>
        </Select>
        <div>Wybrano: {value}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Test 2: Z ConfigProvider</h3>
        <ConfigProvider>
          <Select
            style={{ width: 200 }}
            placeholder="Kliknij tutaj"
            options={[
              { value: 'a', label: 'Opcja A' },
              { value: 'b', label: 'Opcja B' },
            ]}
          />
        </ConfigProvider>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Test 3: Native HTML</h3>
        <select style={{ width: 200, padding: 5 }}>
          <option>Native 1</option>
          <option>Native 2</option>
        </select>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('test-root')!).render(<TestApp />);
