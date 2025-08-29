import React from 'react';
import { Alert, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export const PaletyDatabaseError: React.FC = () => {
  return (
    <Alert
      message={
        <Space>
          <ExclamationCircleOutlined />
          <Text strong>Problem z bazą danych</Text>
        </Space>
      }
      description={
        <div>
          <Paragraph>
            Wykryto problem z konfiguracją bazy danych, który uniemożliwia tworzenie palet.
          </Paragraph>
          <Paragraph>
            <Text type="danger" strong>Szczegóły techniczne:</Text>
          </Paragraph>
          <ul>
            <li>Trigger <Text code>palety_historia_trigger</Text> odwołuje się do nieistniejącej kolumny <Text code>utworzyl</Text></li>
            <li>Błąd: <Text code>record "new" has no field "utworzyl"</Text></li>
          </ul>
          <Paragraph>
            <Text strong>Rozwiązanie:</Text> Administrator bazy danych musi:
          </Paragraph>
          <ol>
            <li>Dodać kolumnę <Text code>utworzyl VARCHAR(100)</Text> do tabeli <Text code>zko.palety</Text></li>
            <li>LUB poprawić trigger aby używał <Text code>operator_pakujacy</Text> zamiast <Text code>utworzyl</Text></li>
          </ol>
          <Paragraph type="secondary">
            <DatabaseOutlined /> Kontakt z administratorem: biuro@alpmeb.pl
          </Paragraph>
        </div>
      }
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};