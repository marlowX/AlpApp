import React, { useState } from 'react';
import { 
  Modal, 
  Select, 
  InputNumber, 
  Table, 
  Space, 
  Typography, 
  Button,
  message,
  Alert
} from 'antd';
import { SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface Paleta {
  id: number;
  numer_palety: string;
  ilosc_formatek: number;
  formatki_ids: number[];
}

interface PaletaPrzeniesFormatkiProps {
  visible: boolean;
  sourcePaleta: Paleta;
  targetPaleta: Paleta;
  palety: Paleta[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PaletaPrzeniesFormatki: React.FC<PaletaPrzeniesFormatkiProps> = ({
  visible,
  sourcePaleta,
  targetPaleta: initialTarget,
  palety,
  onClose,
  onSuccess
}) => {
  const [targetPaletaId, setTargetPaletaId] = useState(initialTarget.id);
  const [selectedFormatki, setSelectedFormatki] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const targetPaleta = palety.find(p => p.id === targetPaletaId) || initialTarget;

  const handlePrzenies = async () => {
    if (selectedFormatki.length === 0) {
      message.warning('Wybierz formatki do przeniesienia');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/zko/palety/przenies-formatki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatki_ids: selectedFormatki,
          z_palety_id: sourcePaleta.id,
          na_palete_id: targetPaletaId
        })
      });

      if (response.ok) {
        message.success('Przeniesiono formatki');
        onSuccess();
      } else {
        message.error('Błąd przenoszenia formatek');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Błąd przenoszenia formatek');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          Przenieś formatki między paletami
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Anuluj
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handlePrzenies}
          disabled={selectedFormatki.length === 0}
        >
          Przenieś wybrane ({selectedFormatki.length})
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Wybór palet */}
        <div>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Text strong>Z palety:</Text>
              <div style={{ 
                padding: 8, 
                background: '#f0f0f0', 
                borderRadius: 4,
                marginTop: 4
              }}>
                <Text>{sourcePaleta.numer_palety}</Text>
                <br />
                <Text type="secondary">
                  Formatek: {sourcePaleta.ilosc_formatek}
                </Text>
              </div>
            </div>
            
            <SwapOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            
            <div>
              <Text strong>Na paletę:</Text>
              <Select
                value={targetPaletaId}
                onChange={setTargetPaletaId}
                style={{ width: 200, display: 'block', marginTop: 4 }}
              >
                {palety
                  .filter(p => p.id !== sourcePaleta.id)
                  .map(paleta => (
                    <Option key={paleta.id} value={paleta.id}>
                      {paleta.numer_palety} ({paleta.ilosc_formatek} szt)
                    </Option>
                  ))
                }
              </Select>
            </div>
          </Space>
        </div>

        {/* Lista formatek - uproszczona */}
        <Alert
          message="Formatki do przeniesienia"
          description={`Wybierz które formatki chcesz przenieść z palety ${sourcePaleta.numer_palety}`}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 4, 
          padding: 16 
        }}>
          <Text>Formatki na palecie źródłowej: {sourcePaleta.formatki_ids.length}</Text>
          <br />
          <Text type="secondary">
            ID formatek: {sourcePaleta.formatki_ids.join(', ') || 'brak'}
          </Text>
          
          <div style={{ marginTop: 16 }}>
            <Text strong>Ile formatek przenieść?</Text>
            <InputNumber
              min={1}
              max={sourcePaleta.ilosc_formatek}
              defaultValue={1}
              style={{ marginLeft: 8, width: 100 }}
              onChange={(value) => {
                // Symulacja wyboru formatek
                if (value) {
                  setSelectedFormatki(
                    sourcePaleta.formatki_ids.slice(0, value)
                  );
                }
              }}
            />
          </div>
        </div>

        {/* Podsumowanie */}
        <Alert
          message="Podsumowanie"
          description={
            <Space direction="vertical">
              <div>Przenoszenie: {selectedFormatki.length} formatek</div>
              <div>Z: {sourcePaleta.numer_palety} → Do: {targetPaleta.numer_palety}</div>
              <div>Po przeniesieniu:</div>
              <div>• {sourcePaleta.numer_palety}: {sourcePaleta.ilosc_formatek - selectedFormatki.length} formatek</div>
              <div>• {targetPaleta.numer_palety}: {targetPaleta.ilosc_formatek + selectedFormatki.length} formatek</div>
            </Space>
          }
          type={selectedFormatki.length > 0 ? "success" : "warning"}
        />
      </Space>
    </Modal>
  );
};
