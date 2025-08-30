import React from 'react';
import { Card, Space, Tag, Typography, Tooltip, Row, Col } from 'antd';
import { EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FormatkaNaPalecie {
  formatka_id: number;
  ilosc: number;
  nazwa: string;
  dlugosc?: number;
  szerokosc?: number;
  kolor?: string;
}

interface PaletaVisualizationProps {
  formatki: FormatkaNaPalecie[];
  paletaInfo: {
    numer_palety: string;
    sztuk_total: number;
    wysokosc_stosu: number;
    waga_kg: number;
    kolory_na_palecie?: string;
  };
}

// Mapowanie kolorów na style CSS
const KOLOR_MAPPING: Record<string, { background: string; color: string; border: string }> = {
  'BIALY': { background: '#ffffff', color: '#000000', border: '#d9d9d9' },
  'HDF_BIALY': { background: '#f8f9fa', color: '#000000', border: '#dee2e6' },
  'SUROWA': { background: '#d4a574', color: '#ffffff', border: '#b8956a' },
  'LANCELOT': { background: '#8b4513', color: '#ffffff', border: '#654321' },
  'ARTISAN': { background: '#696969', color: '#ffffff', border: '#4a4a4a' },
  'SONOMA': { background: '#deb887', color: '#000000', border: '#cdaa7d' },
  'WOTAN': { background: '#654321', color: '#ffffff', border: '#4a2c17' },
  'DEFAULT': { background: '#f0f0f0', color: '#000000', border: '#d9d9d9' }
};

const getKolorStyle = (kolor: string = '') => {
  const normalizedKolor = kolor.toUpperCase().replace(/\s+/g, '_');
  
  // Sprawdź bezpośrednie dopasowanie
  if (KOLOR_MAPPING[normalizedKolor]) {
    return KOLOR_MAPPING[normalizedKolor];
  }
  
  // Sprawdź czy zawiera znany kolor
  for (const [key, style] of Object.entries(KOLOR_MAPPING)) {
    if (normalizedKolor.includes(key)) {
      return style;
    }
  }
  
  return KOLOR_MAPPING.DEFAULT;
};

// Oblicz proporcjonalne wymiary prostokąta formatki
const calculateDimensions = (
  dlugosc: number = 400, 
  szerokosc: number = 300, 
  ilosc: number = 1,
  maxWidth: number = 200
) => {
  const ratio = szerokosc / dlugosc;
  const baseWidth = Math.min(maxWidth, dlugosc * 0.2); // Skala 1:5
  const baseHeight = baseWidth * ratio;
  
  // Wysokość stosu = wysokość pojedynczej * ilość (z ograniczeniem wizualnym)
  const stackHeight = Math.min(baseHeight * Math.log10(ilosc + 1) * 2, maxWidth);
  
  return {
    width: baseWidth,
    height: baseHeight,
    stackHeight: stackHeight,
    ilosc: ilosc
  };
};

export const PaletaVisualization: React.FC<PaletaVisualizationProps> = ({
  formatki,
  paletaInfo
}) => {
  if (!formatki || formatki.length === 0) {
    return (
      <Card size="small" style={{ textAlign: 'center', padding: 20 }}>
        <Text type="secondary">Brak formatek na palecie</Text>
      </Card>
    );
  }

  const totalSztuk = formatki.reduce((sum, f) => sum + f.ilosc, 0);
  const dominantColor = paletaInfo.kolory_na_palecie || 
    (formatki[0]?.kolor ? formatki[0].kolor : 'DEFAULT');

  return (
    <Card
      title={
        <Space>
          <EyeOutlined />
          <Text strong>{paletaInfo.numer_palety}</Text>
          <Tag color="blue">{totalSztuk} szt.</Tag>
          <Tag color="green">{Math.round(paletaInfo.waga_kg)}kg</Tag>
          <Tag color="orange">{Math.round(paletaInfo.wysokosc_stosu)}mm</Tag>
        </Space>
      }
      size="small"
      extra={
        <Tooltip title={`${formatki.length} typów formatek`}>
          <InfoCircleOutlined />
        </Tooltip>
      }
      style={{ marginBottom: 16 }}
    >
      {/* Informacje o kolorze dominującym */}
      {dominantColor && (
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Text strong>Kolor dominujący:</Text>
            <Tag 
              color={getKolorStyle(dominantColor).background}
              style={{
                color: getKolorStyle(dominantColor).color,
                border: `1px solid ${getKolorStyle(dominantColor).border}`,
                fontWeight: 'bold'
              }}
            >
              {dominantColor}
            </Tag>
          </Space>
        </div>
      )}

      {/* Wizualizacja formatek */}
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 8, 
          padding: 12,
          backgroundColor: '#fafafa',
          borderRadius: 6,
          border: '1px solid #d9d9d9'
        }}
      >
        {formatki.map((formatka, index) => {
          const dimensions = calculateDimensions(
            formatka.dlugosc || 400,
            formatka.szerokosc || 300,
            formatka.ilosc,
            80 // maxWidth dla small cards
          );
          
          const kolorStyle = getKolorStyle(formatka.kolor);
          
          return (
            <Tooltip
              key={formatka.formatka_id || index}
              title={
                <div>
                  <Text strong style={{ color: 'white' }}>{formatka.nazwa}</Text>
                  <br />
                  <Text style={{ color: 'white' }}>Ilość: {formatka.ilosc} szt.</Text>
                  {formatka.dlugosc && formatka.szerokosc && (
                    <>
                      <br />
                      <Text style={{ color: 'white' }}>
                        Wymiary: {formatka.dlugosc}×{formatka.szerokosc}mm
                      </Text>
                    </>
                  )}
                  {formatka.kolor && (
                    <>
                      <br />
                      <Text style={{ color: 'white' }}>Kolor: {formatka.kolor}</Text>
                    </>
                  )}
                </div>
              }
            >
              <div
                style={{
                  position: 'relative',
                  width: dimensions.width,
                  height: dimensions.stackHeight,
                  backgroundColor: kolorStyle.background,
                  border: `2px solid ${kolorStyle.border}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexDirection: 'column',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: kolorStyle.color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                {/* Ilość na środku */}
                <div style={{ 
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {formatka.ilosc}
                  </div>
                  <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    szt
                  </div>
                </div>
                
                {/* Stack indicator jeśli więcej niż 1 */}
                {formatka.ilosc > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      backgroundColor: '#ff4d4f',
                      borderRadius: '50%',
                      fontSize: '6px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatka.ilosc > 99 ? '∞' : formatka.ilosc}
                  </div>
                )}
                
                {/* Kolor indicator */}
                {formatka.kolor && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      right: 2,
                      height: 3,
                      backgroundColor: kolorStyle.border,
                      borderRadius: 1,
                      opacity: 0.7
                    }}
                  />
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
      
      {/* Podsumowanie */}
      <div style={{ marginTop: 12 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">Typy formatek:</Text>
            <br />
            <Text strong>{formatki.length}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Łącznie sztuk:</Text>
            <br />
            <Text strong>{totalSztuk}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Średnio/typ:</Text>
            <br />
            <Text strong>{Math.round(totalSztuk / formatki.length)}</Text>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

// Komponent dla większej wizualizacji (modal/drawer)
export const PaletaVisualizationLarge: React.FC<PaletaVisualizationProps> = ({
  formatki,
  paletaInfo
}) => {
  if (!formatki || formatki.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Brak formatek na palecie
        </Text>
      </div>
    );
  }

  const totalSztuk = formatki.reduce((sum, f) => sum + f.ilosc, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <Space size="large">
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
            📦 {totalSztuk} sztuk
          </Tag>
          <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
            ⚖️ {Math.round(paletaInfo.waga_kg)}kg
          </Tag>
          <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
            📏 {Math.round(paletaInfo.wysokosc_stosu)}mm
          </Tag>
          <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
            🎨 {formatki.length} typów
          </Tag>
        </Space>
      </div>

      {/* Większa wizualizacja */}
      <div 
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 16,
          padding: 20,
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '2px dashed #d9d9d9'
        }}
      >
        {formatki.map((formatka, index) => {
          const dimensions = calculateDimensions(
            formatka.dlugosc || 400,
            formatka.szerokosc || 300,
            formatka.ilosc,
            120 // maxWidth dla large view
          );
          
          const kolorStyle = getKolorStyle(formatka.kolor);
          
          return (
            <div key={formatka.formatka_id || index} style={{ textAlign: 'center' }}>
              {/* Formatka */}
              <div
                style={{
                  width: dimensions.width,
                  height: dimensions.stackHeight,
                  backgroundColor: kolorStyle.background,
                  border: `3px solid ${kolorStyle.border}`,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: kolorStyle.color,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  margin: '0 auto 8px auto',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {formatka.ilosc}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>
                    sztuk
                  </div>
                </div>
                
                {/* Wymiary jako tło */}
                {formatka.dlugosc && formatka.szerokosc && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      right: 2,
                      fontSize: '8px',
                      opacity: 0.6,
                      textAlign: 'center'
                    }}
                  >
                    {formatka.dlugosc}×{formatka.szerokosc}
                  </div>
                )}
              </div>
              
              {/* Nazwa formatki */}
              <Text 
                strong 
                style={{ 
                  fontSize: '12px', 
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 4
                }}
              >
                {formatka.nazwa?.replace(/ - .+$/, '') || `Formatka ${index + 1}`}
              </Text>
              
              {/* Kolor */}
              {formatka.kolor && (
                <Tag 
                  size="small"
                  style={{
                    backgroundColor: kolorStyle.background,
                    color: kolorStyle.color,
                    border: `1px solid ${kolorStyle.border}`,
                    fontSize: '10px',
                    marginTop: 2
                  }}
                >
                  {formatka.kolor}
                </Tag>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};