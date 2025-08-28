import React from 'react';
import { Row, Col, Form, InputNumber, Select } from 'antd';

const { Option } = Select;

export const PozycjaAdditionalOptions: React.FC = () => {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item name="kolejnosc" label="Kolejność (opcjonalne)">
          <InputNumber 
            min={1} 
            placeholder="Kolejność wykonania (1 = najwyższy priorytet)" 
            style={{ width: '100%' }} 
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="uwagi" label="Uwagi (opcjonalne)">
          <Select 
            mode="tags" 
            placeholder="Dodaj uwagi lub wpisz własne" 
            style={{ width: '100%' }}
          >
            <Option value="PILNE">PILNE</Option>
            <Option value="Priorytet wysoki">Priorytet wysoki</Option>
            <Option value="Uwaga na wymiary">Uwaga na wymiary</Option>
            <Option value="Specjalne oklejenie">Specjalne oklejenie</Option>
            <Option value="Kontrola jakości">Kontrola jakości</Option>
            <Option value="Delikatna płyta">Delikatna płyta</Option>
            <Option value="Najpierw wykonać">Najpierw wykonać</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
};
