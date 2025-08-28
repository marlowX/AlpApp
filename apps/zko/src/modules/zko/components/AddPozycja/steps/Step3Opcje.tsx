import React from 'react';
import { Alert, Card, Form, Space, Typography, Divider, Row, Col, Tag } from 'antd';
import { 
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { PozycjaAdditionalOptions } from '../PozycjaAdditionalOptions';
import { PozycjaStatistics } from '../PozycjaStatistics';
import type { KolorPlyty, Rozkroj } from '../types';

const { Text } = Typography;

interface Step3OpcjeProps {
  form: any;
  kolorePlyty: KolorPlyty[];
  selectedRozkroj: Rozkroj | null;
}

export const Step3Opcje: React.FC<Step3OpcjeProps> = ({
  form,
  kolorePlyty,
  selectedRozkroj
}) => {
  const getTotalFormatki = () => {
    if (!selectedRozkroj) return 0;
    return kolorePlyty.reduce((total, kolor) => {
      if (!kolor.kolor) return total;
      const formatkiCount = selectedRozkroj.formatki.reduce(
        (sum, formatka) => sum + (formatka.ilosc_sztuk * kolor.ilosc), 0
      );
      return total + formatkiCount;
    }, 0);
  };

  const getTotalPlyty = () => {
    return kolorePlyty.reduce((sum, k) => sum + (k.ilosc || 0), 0);
  };

  const selectedColors = kolorePlyty.filter(k => k.kolor);

  return (
    <div>
      <Alert
        message="Krok 3: Podsumowanie i opcje dodatkowe"
        description="Sprawdź podsumowanie i opcjonalnie dodaj uwagi lub ustaw priorytet"
        type="info"
        showIcon
        icon={<SettingOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Podsumowanie */}
      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Podsumowanie pozycji
          </Space>
        }
        style={{ marginBottom: 16, borderColor: '#52c41a' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {selectedRozkroj && (
            <div>
              <Text strong>Rozkrój:</Text>{' '}
              <Tag color="blue">{selectedRozkroj.kod_rozkroju}</Tag>
              <Text type="secondary">{selectedRozkroj.opis}</Text>
            </div>
          )}

          {selectedColors.length > 0 && (
            <div>
              <Text strong>Wybrane płyty ({selectedColors.length}):</Text>
              <div style={{ marginTop: 8 }}>
                {selectedColors.map((plyta, index) => (
                  <Tag key={index} color="green" style={{ marginBottom: 4 }}>
                    {plyta.kolor} - {plyta.ilosc} szt.
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <PozycjaStatistics
            kolorePlytyCount={selectedColors.length}
            totalKolory={kolorePlyty.length}
            totalPlyty={getTotalPlyty()}
            totalFormatki={getTotalFormatki()}
            isFormValid={true}
          />
        </Space>
      </Card>

      {/* Opcje dodatkowe */}
      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            Opcje dodatkowe (opcjonalne)
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <PozycjaAdditionalOptions />
        </Form>
        
        <Alert
          message="Te pola są opcjonalne"
          description="Możesz je pominąć i dodać pozycję z domyślnymi ustawieniami"
          type="info"
          style={{ marginTop: 16 }}
          showIcon
        />
      </Card>
    </div>
  );
};
