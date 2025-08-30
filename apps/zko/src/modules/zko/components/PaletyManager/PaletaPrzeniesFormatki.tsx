import React, { useState } from 'react';
import { 
  Modal, 
  Select, 
  InputNumber, 
  Space, 
  Typography, 
  Button,
  message,
  Alert,
  Card,
  Progress,
  Divider,
  Row,
  Col,
  Radio,
  Statistic
} from 'antd';
import { SwapOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Paleta, TransferFormatekParams, LIMITY_PALETY, MESSAGES } from './types';

const { Text } = Typography;
const { Option } = Select;

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
  const [iloscDoPrzeniesienia, setIloscDoPrzeniesienia] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transferMode, setTransferMode] = useState<'ilosc' | 'wszystkie'>('ilosc');

  const targetPaleta = palety.find(p => p.id === targetPaletaId) || initialTarget;

  // Oblicz co się stanie po przeniesieniu
  const iloscPrzenoszonych = transferMode === 'wszystkie' 
    ? sourcePaleta.ilosc_formatek 
    : Math.min(iloscDoPrzeniesienia, sourcePaleta.ilosc_formatek);
    
  const sourcePoTransferze = sourcePaleta.ilosc_formatek - iloscPrzenoszonych;
  const targetPoTransferze = targetPaleta.ilosc_formatek + iloscPrzenoszonych;
  
  // Sprawdź czy transfer jest możliwy
  const czyMoznaTransfer = targetPoTransferze <= LIMITY_PALETY.MAX_FORMATEK;
  const procentWykorzystaniaTarget = Math.round(
    (targetPoTransferze / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100
  );

  const handlePrzenies = async () => {
    if (iloscPrzenoszonych === 0) {
      message.warning('Wybierz formatki do przeniesienia');
      return;
    }

    if (!czyMoznaTransfer) {
      message.error('Paleta docelowa nie pomieści wszystkich formatek');
      return;
    }

    try {
      setLoading(true);
      
      // Przygotuj parametry transferu V5
      const transferParams: TransferFormatekParams = {
        z_palety_id: sourcePaleta.id,
        na_palete_id: targetPaletaId,
        ilosc_sztuk: transferMode === 'wszystkie' ? undefined : iloscPrzenoszonych,
        formatki_ids: transferMode === 'wszystkie' ? sourcePaleta.formatki_ids : undefined,
        operator: 'user',
        powod: `Transfer ${iloscPrzenoszonych} formatek z palety ${sourcePaleta.numer_palety}`
      };

      // Wywołaj nowe API V5
      const response = await fetch('/api/pallets/transfer-v5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferParams)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.sukces) {
          message.success(result.komunikat || MESSAGES.TRANSFER_SUCCESS);
          
          // Pokaż szczegóły transferu
          Modal.success({
            title: 'Transfer zakończony pomyślnie',
            content: (
              <div>
                <p><strong>Przeniesiono:</strong> {iloscPrzenoszonych} formatek</p>
                <p><strong>Z palety:</strong> {sourcePaleta.numer_palety} ({sourcePoTransferze} pozostało)</p>
                <p><strong>Na paletę:</strong> {targetPaleta.numer_palety} ({targetPoTransferze} łącznie)</p>
                {result.z_palety_info && result.na_palete_info && (
                  <div>
                    <Divider />
                    <Text type="secondary">Szczegóły operacji zostały zapisane w historii zmian.</Text>
                  </div>
                )}
              </div>
            )
          });
          
          onSuccess();
        } else {
          message.error(result.komunikat || MESSAGES.TRANSFER_ERROR);
        }
      } else {
        const error = await response.json();
        message.error(error.error || MESSAGES.TRANSFER_ERROR);
      }
    } catch (error) {
      console.error('Error transferring formatki V5:', error);
      message.error(MESSAGES.TRANSFER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Sprawdź status palet
  const sourcePaletaBlocked = ['wyslana', 'dostarczona'].includes(sourcePaleta.status);
  const targetPaletaBlocked = ['wyslana', 'dostarczona', 'pelna'].includes(targetPaleta.status);
  const transferBlocked = sourcePaletaBlocked || targetPaletaBlocked;

  // Dostępne palety docelowe (bez zablokowanych)
  const dostepnePalety = palety.filter(p => 
    p.id !== sourcePaleta.id && 
    !['wyslana', 'dostarczona', 'pelna'].includes(p.status)
  );

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          Przenieś formatki między paletami V5
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Anuluj
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handlePrzenies}
          disabled={transferBlocked || !czyMoznaTransfer || iloscPrzenoszonych === 0}
          icon={<SwapOutlined />}
        >
          Przenieś {transferMode === 'wszystkie' ? 'wszystkie' : `${iloscPrzenoszonych} szt`}
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Alert o statusach */}
        {transferBlocked && (
          <Alert
            message="Nie można przenieść formatek"
            description={
              sourcePaletaBlocked 
                ? `Paleta źródłowa ma status "${sourcePaleta.status}" - nie można z niej przenosić formatek`
                : `Paleta docelowa ma status "${targetPaleta.status}" - nie może przyjąć formatek`
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        )}

        {/* Wybór palet */}
        <Row gutter={16}>
          <Col span={10}>
            <Card size="small" title="Z palety:" styles={{ body: { padding: 12 } }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{sourcePaleta.numer_palety}</Text>
                <Text type="secondary">Status: {sourcePaleta.status}</Text>
                
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic 
                      title="Formatki"
                      value={sourcePaleta.ilosc_formatek}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Wysokość"
                      value={Math.round(sourcePaleta.wysokosc_stosu || 0)}
                      suffix="mm"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
                
                {sourcePaleta.kolory_na_palecie && (
                  <div>
                    <Text type="secondary">Kolory:</Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>{sourcePaleta.kolory_na_palecie}</Text>
                  </div>
                )}
                
                <Progress 
                  percent={Math.round((sourcePaleta.ilosc_formatek / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)}
                  size="small"
                  status={sourcePaleta.ilosc_formatek > LIMITY_PALETY.DOMYSLNE_FORMATEK ? 'exception' : 'normal'}
                  format={(percent) => `${percent}% zapełnienia`}
                />
              </Space>
            </Card>
          </Col>
          
          <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SwapOutlined style={{ fontSize: 32, color: transferBlocked ? '#ff4d4f' : '#1890ff' }} />
          </Col>
          
          <Col span={10}>
            <Card size="small" title="Na paletę:" styles={{ body: { padding: 12 } }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  value={targetPaletaId}
                  onChange={setTargetPaletaId}
                  style={{ width: '100%' }}
                  disabled={transferBlocked}
                >
                  {dostepnePalety.map(paleta => (
                    <Option key={paleta.id} value={paleta.id}>
                      <Space>
                        <Text>{paleta.numer_palety}</Text>
                        <Text type="secondary">({paleta.ilosc_formatek} szt)</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
                
                <Text type="secondary">Status: {targetPaleta.status}</Text>
                
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic 
                      title="Formatki"
                      value={targetPaleta.ilosc_formatek}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Po transferze"
                      value={targetPoTransferze}
                      valueStyle={{ 
                        fontSize: '16px',
                        color: czyMoznaTransfer ? '#52c41a' : '#ff4d4f'
                      }}
                    />
                  </Col>
                </Row>
                
                <Progress 
                  percent={procentWykorzystaniaTarget}
                  size="small"
                  status={
                    procentWykorzystaniaTarget > 100 ? 'exception' : 
                    procentWykorzystaniaTarget > 90 ? 'active' : 'normal'
                  }
                  format={(percent) => `${percent}% po transferze`}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Konfiguracja transferu */}
        <Card title="Konfiguracja transferu" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Tryb transferu:</Text>
              <Radio.Group 
                value={transferMode} 
                onChange={(e) => setTransferMode(e.target.value)}
                style={{ marginLeft: 16 }}
              >
                <Radio value="ilosc">Określona ilość</Radio>
                <Radio value="wszystkie">Wszystkie formatki</Radio>
              </Radio.Group>
            </div>

            {transferMode === 'ilosc' && (
              <div>
                <Text strong>Ilość formatek do przeniesienia:</Text>
                <InputNumber
                  min={1}
                  max={sourcePaleta.ilosc_formatek}
                  value={iloscDoPrzeniesienia}
                  onChange={(value) => setIloscDoPrzeniesienia(value || 1)}
                  style={{ marginLeft: 16, width: 120 }}
                  addonAfter="szt"
                />
              </div>
            )}
          </Space>
        </Card>

        {/* Podgląd zmian */}
        <Card 
          title="Podgląd zmian" 
          size="small"
          extra={
            czyMoznaTransfer ? 
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
              <WarningOutlined style={{ color: '#ff4d4f' }} />
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ padding: 8, background: '#fff2e8', borderRadius: 4 }}>
                <Text strong>{sourcePaleta.numer_palety}</Text>
                <br />
                <Text>
                  {sourcePaleta.ilosc_formatek} → <strong>{sourcePoTransferze}</strong> formatek
                </Text>
                <br />
                <Text type="secondary">
                  {sourcePoTransferze === 0 ? '(paleta będzie pusta)' : 
                   `(zostanie ${Math.round((sourcePoTransferze / LIMITY_PALETY.DOMYSLNE_FORMATEK) * 100)}% zapełnienia)`}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ 
                padding: 8, 
                background: czyMoznaTransfer ? '#f6ffed' : '#fff2f0', 
                borderRadius: 4 
              }}>
                <Text strong>{targetPaleta.numer_palety}</Text>
                <br />
                <Text>
                  {targetPaleta.ilosc_formatek} → <strong>{targetPoTransferze}</strong> formatek
                </Text>
                <br />
                <Text type="secondary">
                  ({procentWykorzystaniaTarget}% zapełnienia)
                </Text>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Podsumowanie operacji:</Text>
              <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                <li>Przenoszenie: <strong>{iloscPrzenoszonych} formatek</strong></li>
                <li>Kierunek: {sourcePaleta.numer_palety} → {targetPaleta.numer_palety}</li>
                <li>Nowe wykorzystanie palety docelowej: <strong>{procentWykorzystaniaTarget}%</strong></li>
                {sourcePoTransferze === 0 && (
                  <li style={{ color: '#faad14' }}>⚠️ Paleta źródłowa będzie pusta</li>
                )}
                {procentWykorzystaniaTarget > 90 && (
                  <li style={{ color: '#ff4d4f' }}>⚠️ Paleta docelowa będzie bardzo pełna</li>
                )}
              </ul>
            </div>

            {/* Ostrzeżenia */}
            {!czyMoznaTransfer && (
              <Alert
                message="Przekroczenie limitu!"
                description={`Paleta docelowa może pomieścić maksymalnie ${LIMITY_PALETY.MAX_FORMATEK} formatek. Po transferze będzie miała ${targetPoTransferze} formatek.`}
                type="error"
                showIcon
              />
            )}

            {czyMoznaTransfer && procentWykorzystaniaTarget > 90 && (
              <Alert
                message="Wysokie wykorzystanie palety"
                description={`Paleta docelowa będzie wykorzystana w ${procentWykorzystaniaTarget}%. Upewnij się, że to nie sprawi problemów.`}
                type="warning"
                showIcon
              />
            )}

            {sourcePoTransferze === 0 && (
              <Alert
                message="Paleta zostanie opróżniona"
                description="Paleta źródłowa będzie pusta po transferze. Rozważ jej usunięcie lub reorganizację palet."
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* Szczegóły formatek (opcjonalnie) */}
        {sourcePaleta.formatki_ids && sourcePaleta.formatki_ids.length > 0 && (
          <Card title="Szczegóły formatek" size="small" style={{ maxHeight: 200, overflow: 'auto' }}>
            <Text type="secondary">
              ID formatek na palecie źródłowej: {sourcePaleta.formatki_ids.slice(0, 20).join(', ')}
              {sourcePaleta.formatki_ids.length > 20 && ` ... i ${sourcePaleta.formatki_ids.length - 20} więcej`}
            </Text>
          </Card>
        )}
      </Space>
    </Modal>
  );
};