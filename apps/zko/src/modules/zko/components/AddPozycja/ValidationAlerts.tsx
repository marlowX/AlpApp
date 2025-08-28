import React from 'react';
import { Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

interface ValidationAlertsProps {
  validationErrors: string[];
}

export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({
  validationErrors
}) => {
  if (validationErrors.length === 0) return null;

  return (
    <Alert
      message={`Formularz zawiera ${validationErrors.length} ${
        validationErrors.length === 1 ? 'błąd' : 'błędów'
      }`}
      description={
        <ul style={{ margin: 0, paddingLeft: 16, maxHeight: 150, overflowY: 'auto' }}>
          {validationErrors.map((error, index) => (
            <li key={index} style={{ marginBottom: 4 }}>
              <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />
              {error}
            </li>
          ))}
        </ul>
      }
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};
