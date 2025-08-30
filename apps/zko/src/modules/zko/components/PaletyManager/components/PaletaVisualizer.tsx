import React, { useState, useMemo } from 'react';
import { Card, Select, Slider, Space, Tag, Typography, Row, Col, Alert, Divider, Empty, Table } from 'antd';
import { EyeOutlined, AppstoreOutlined, ColumnHeightOutlined, BoxPlotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// Predefiniowane rozmiary formatek
const FORMATKI_PRESETS = {
  '600x300': { dlugosc: 600, szerokosc: 300, nazwa: '600×300mm' },
  '800x400': { dlugosc: 800, szerokosc: 400, nazwa: '800×400mm' },
  '400x300': { dlugosc: 400, szerokosc: 300, nazwa: '400×300mm' },
  '600x400': { dlugosc: 600, szerokosc: 400, nazwa: '600×400mm' },
  '500x300': { dlugosc: 500, szerokosc: 300, nazwa: '500×300mm' },
  '496x337': { dlugosc: 496, szerokosc: 337, nazwa: '496×337mm' },
  '996x337': { dlugosc: 996, szerokosc: 337, nazwa: '996×337mm' },
  '1000x500': { dlugosc: 1000, szerokosc: 500, nazwa: '1000×500mm' },
};

const PALETA_EURO = { dlugosc: 1200, szerokosc: 800 };

interface FormatkaData {
  formatka_id?: number;
  dlugosc: number;
  szerokosc: number;
  ilosc: number;
  nazwa?: string;
  kolor?: string;
}

interface PaletaVisualizerProps {
  formatki?: FormatkaData[];
  gruboscDefault?: number;
  maxWysokoscDefault?: number;
  showControls?: boolean;
}

// Kolory dla różnych typów formatek
const FORMATKA_COLORS = [
  '#1890ff', // niebieski
  '#52c41a', // zielony
  '#faad14', // pomarańczowy
  '#f5222d', // czerwony
  '#722ed1', // fioletowy
  '#13c2c2', // cyan
  '#eb2f96', // magenta
  '#fa8c16', // pomarańczowy ciemny
];

export const PaletaVisualizer: React.FC<PaletaVisualizerProps> = ({ 
  formatki,
  gruboscDefault = 18,
  maxWysokoscDefault = 1440,
  showControls = true
}) => {
  const [selectedFormat, setSelectedFormat] = useState('496x337');
  const [gruboscPlyty, setGruboscPlyty] = useState(gruboscDefault);
  const [liczbaFormatek, setLiczbaFormatek] = useState(60);
  const [maxWysokosc, setMaxWysokosc] = useState(maxWysokoscDefault);
  const [viewMode, setViewMode] = useState<'top' | '3d' | 'side'>('top');
  const [mixedMode, setMixedMode] = useState(true); // Tryb mieszany - różne rozmiary

  // Jeśli przekazano rzeczywiste dane formatek, użyj ich
  const useRealData = formatki && formatki.length > 0;
  
  // Przygotuj dane formatek do układania
  const formatkiDoUkladania = useMemo(() => {
    if (useRealData && formatki) {
      // Grupuj formatki po rozmiarach
      const grouped = new Map<string, FormatkaData[]>();
      formatki.forEach(f => {
        const key = `${f.dlugosc}x${f.szerokosc}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(f);
      });
      return grouped;
    }
    
    // Tryb symulacji - różne rozmiary
    if (mixedMode) {
      const grouped = new Map<string, FormatkaData[]>();
      // Przykładowe mieszane formatki
      grouped.set('496x337', [{
        dlugosc: 496,
        szerokosc: 337,
        ilosc: Math.floor(liczbaFormatek * 0.5),
        nazwa: '496×337mm',
        kolor: 'SONOMA'
      }]);
      grouped.set('996x337', [{
        dlugosc: 996,
        szerokosc: 337,
        ilosc: Math.floor(liczbaFormatek * 0.3),
        nazwa: '996×337mm',
        kolor: 'DĄB'
      }]);
      grouped.set('600x300', [{
        dlugosc: 600,
        szerokosc: 300,
        ilosc: Math.floor(liczbaFormatek * 0.2),
        nazwa: '600×300mm',
        kolor: 'BUK'
      }]);
      return grouped;
    }
    
    // Pojedynczy rozmiar
    const formatka = FORMATKI_PRESETS[selectedFormat];
    const grouped = new Map<string, FormatkaData[]>();
    grouped.set(selectedFormat, [{
      dlugosc: formatka.dlugosc,
      szerokosc: formatka.szerokosc,
      ilosc: liczbaFormatek,
      nazwa: formatka.nazwa
    }]);
    return grouped;
  }, [formatki, useRealData, mixedMode, selectedFormat, liczbaFormatek]);

  // Oblicz układanie mieszanych formatek na palecie
  const ukladanieMieszane = useMemo(() => {
    if (!formatkiDoUkladania || formatkiDoUkladania.size === 0) return null;

    const poziomy: Array<{
      formatki: Array<{
        typ: string;
        x: number;
        y: number;
        width: number;
        height: number;
        kolor: string;
        nazwa: string;
      }>;
      wysokosc: number;
    }> = [];

    let currentPoziom: typeof poziomy[0] = { formatki: [], wysokosc: 0 };
    let currentX = 0;
    let currentY = 0;
    let maxYInRow = 0;
    let formatkiIndex = 0;

    // Układaj formatki różnych rozmiarów
    formatkiDoUkladania.forEach((formatkaGroup, typ) => {
      formatkaGroup.forEach(formatkaData => {
        for (let i = 0; i < formatkaData.ilosc; i++) {
          // Sprawdź czy formatka mieści się w aktualnym rzędzie
          if (currentX + formatkaData.dlugosc > PALETA_EURO.dlugosc) {
            // Przejdź do następnego rzędu
            currentX = 0;
            currentY += maxYInRow;
            maxYInRow = 0;
          }

          // Sprawdź czy mieści się na wysokość palety
          if (currentY + formatkaData.szerokosc > PALETA_EURO.szerokosc) {
            // Zapisz poziom i rozpocznij nowy
            if (currentPoziom.formatki.length > 0) {
              poziomy.push(currentPoziom);
            }
            currentPoziom = { formatki: [], wysokosc: gruboscPlyty };
            currentX = 0;
            currentY = 0;
            maxYInRow = 0;
          }

          // Dodaj formatkę do poziomu
          currentPoziom.formatki.push({
            typ,
            x: currentX,
            y: currentY,
            width: formatkaData.dlugosc,
            height: formatkaData.szerokosc,
            kolor: formatkaData.kolor || FORMATKA_COLORS[formatkiIndex % FORMATKA_COLORS.length],
            nazwa: formatkaData.nazwa || typ
          });

          currentX += formatkaData.dlugosc;
          maxYInRow = Math.max(maxYInRow, formatkaData.szerokosc);
          formatkiIndex++;
        }
      });
    });

    // Dodaj ostatni poziom jeśli nie jest pusty
    if (currentPoziom.formatki.length > 0) {
      poziomy.push(currentPoziom);
    }

    // Oblicz statystyki
    const totalFormatek = Array.from(formatkiDoUkladania.values())
      .reduce((sum, group) => sum + group.reduce((s, f) => s + f.ilosc, 0), 0);
    const wysokoscStosu = poziomy.length * gruboscPlyty;
    const maxPoziomow = Math.floor(maxWysokosc / gruboscPlyty);

    return {
      poziomy,
      liczbaPoziomow: poziomy.length,
      totalFormatek,
      wysokoscStosu,
      maxPoziomow,
      przekroczenie: wysokoscStosu > maxWysokosc,
      wykorzystanie: maxPoziomow > 0 ? Math.round((poziomy.length / maxPoziomow) * 100) : 0,
      rozneRozmiary: formatkiDoUkladania.size
    };
  }, [formatkiDoUkladania, gruboscPlyty, maxWysokosc]);

  // Renderowanie widoku z góry - pokazuje mieszane formatki
  const renderTopView = () => {
    if (!ukladanieMieszane || ukladanieMieszane.poziomy.length === 0) return null;

    const scale = 0.4;
    const paletaWidth = PALETA_EURO.dlugosc * scale;
    const paletaHeight = PALETA_EURO.szerokosc * scale;
    
    // Pokaż pierwszy poziom
    const poziom = ukladanieMieszane.poziomy[0];

    return (
      <div>
        <svg 
          width={paletaWidth + 40} 
          height={paletaHeight + 40} 
          style={{ border: '2px solid #d9d9d9', borderRadius: 8, background: '#fafafa' }}
        >
          {/* Paleta */}
          <rect
            x="20"
            y="20"
            width={paletaWidth}
            height={paletaHeight}
            fill="none"
            stroke="#8c8c8c"
            strokeWidth="3"
            strokeDasharray="10,5"
          />
          
          {/* Formatki różnych rozmiarów */}
          <g transform="translate(20, 20)">
            {poziom.formatki.map((formatka, idx) => (
              <g key={idx}>
                <rect
                  x={formatka.x * scale + 2}
                  y={formatka.y * scale + 2}
                  width={formatka.width * scale - 4}
                  height={formatka.height * scale - 4}
                  fill={formatka.kolor}
                  stroke="#0050b3"
                  strokeWidth="2"
                  rx="4"
                  opacity={0.85}
                />
                {/* Etykieta rozmiaru dla większych formatek */}
                {formatka.width * scale > 80 && (
                  <text
                    x={formatka.x * scale + (formatka.width * scale) / 2}
                    y={formatka.y * scale + (formatka.height * scale) / 2}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                  >
                    {formatka.width}×{formatka.height}
                  </text>
                )}
              </g>
            ))}
          </g>
          
          {/* Wymiary palety */}
          <text x={paletaWidth/2 + 20} y="15" textAnchor="middle" fontSize="12" fill="#595959">
            {PALETA_EURO.dlugosc}mm
          </text>
          <text 
            x="10" 
            y={paletaHeight/2 + 20} 
            textAnchor="middle" 
            fontSize="12" 
            fill="#595959"
            transform={`rotate(-90, 10, ${paletaHeight/2 + 20})`}
          >
            {PALETA_EURO.szerokosc}mm
          </text>
        </svg>
        
        {/* Info o poziomie */}
        <Alert
          message={`Poziom 1 z ${ukladanieMieszane.liczbaPoziomow}`}
          description={`Pokazano ${poziom.formatki.length} formatek różnych rozmiarów na pierwszym poziomie`}
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      </div>
    );
  };

  // Renderowanie widoku 3D - pokazuje stosy różnych formatek
  const render3DView = () => {
    if (!ukladanieMieszane) return null;

    const scale = 0.3;
    const baseWidth = PALETA_EURO.dlugosc * scale;
    const baseHeight = PALETA_EURO.szerokosc * scale;
    const levelHeight = 8;
    
    const svgWidth = baseWidth + 100;
    const svgHeight = baseHeight + (Math.min(ukladanieMieszane.liczbaPoziomow, 10) * levelHeight) + 100;

    const pokazPoziomow = Math.min(ukladanieMieszane.liczbaPoziomow, 10);
    const poziomy = [];

    for (let level = 0; level < pokazPoziomow; level++) {
      const offsetY = (pokazPoziomow - level - 1) * levelHeight;
      const offsetX = level * 3;
      
      // Różne kolory dla poziomów z mieszanymi formatkami
      const gradient = `url(#gradient-${level})`;
      
      poziomy.push(
        <g key={level} transform={`translate(${50 - offsetX}, ${50 + offsetY})`}>
          {/* Gradient dla poziomu */}
          <defs>
            <linearGradient id={`gradient-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={FORMATKA_COLORS[level % FORMATKA_COLORS.length]} />
              <stop offset="50%" stopColor={FORMATKA_COLORS[(level + 1) % FORMATKA_COLORS.length]} />
              <stop offset="100%" stopColor={FORMATKA_COLORS[(level + 2) % FORMATKA_COLORS.length]} />
            </linearGradient>
          </defs>
          
          {/* Górna powierzchnia */}
          <rect
            x="0"
            y="0"
            width={baseWidth}
            height={baseHeight}
            fill={gradient}
            stroke="#0050b3"
            strokeWidth="1"
            opacity={0.9}
          />
          
          {/* Bok prawy */}
          <path
            d={`M ${baseWidth} 0 L ${baseWidth + 10} ${-10} L ${baseWidth + 10} ${baseHeight - 10} L ${baseWidth} ${baseHeight} Z`}
            fill="#096dd9"
            stroke="#003a8c"
            strokeWidth="1"
            opacity={0.8}
          />
          
          {/* Bok dolny */}
          <path
            d={`M 0 ${baseHeight} L 10 ${baseHeight - 10} L ${baseWidth + 10} ${baseHeight - 10} L ${baseWidth} ${baseHeight} Z`}
            fill="#0050b3"
            stroke="#003a8c"
            strokeWidth="1"
            opacity={0.8}
          />
        </g>
      );
    }

    return (
      <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 8 }}>
        <svg width={svgWidth} height={svgHeight}>
          {poziomy}
          
          <text x={svgWidth/2} y={svgHeight - 10} textAnchor="middle" fontSize="14" fill="#262626">
            Stos {ukladanieMieszane.liczbaPoziomow} poziomów × {gruboscPlyty}mm = {ukladanieMieszane.wysokoscStosu}mm
          </text>
          
          {ukladanieMieszane.liczbaPoziomow > 10 && (
            <text x={svgWidth/2} y={20} textAnchor="middle" fontSize="12" fill="#8c8c8c">
              (pokazano pierwsze 10 z {ukladanieMieszane.liczbaPoziomow} poziomów)
            </text>
          )}
        </svg>
      </div>
    );
  };

  // Renderowanie widoku z boku
  const renderSideView = () => {
    if (!ukladanieMieszane) return null;

    const scale = 0.4;
    const width = PALETA_EURO.dlugosc * scale;
    const maxHeight = 300;
    const actualHeight = Math.min((ukladanieMieszane.wysokoscStosu / maxWysokosc) * maxHeight, maxHeight);
    
    return (
      <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 8 }}>
        <svg width={width + 80} height={maxHeight + 60}>
          {/* Paleta podstawa */}
          <rect
            x="40"
            y={maxHeight - 10}
            width={width}
            height="20"
            fill="#8c8c8c"
            stroke="#595959"
            strokeWidth="2"
          />
          
          {/* Gradient dla stosu mieszanych formatek */}
          <defs>
            <linearGradient id="stack-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {FORMATKA_COLORS.map((color, idx) => (
                <stop 
                  key={idx} 
                  offset={`${(idx / FORMATKA_COLORS.length) * 100}%`} 
                  stopColor={color} 
                />
              ))}
            </linearGradient>
          </defs>
          
          {/* Stos formatek */}
          <rect
            x="40"
            y={maxHeight - actualHeight - 10}
            width={width}
            height={actualHeight}
            fill="url(#stack-gradient)"
            stroke="#0050b3"
            strokeWidth="2"
            rx="4"
            opacity={0.9}
          />
          
          {/* Linie poziomów */}
          {Array.from({ length: Math.min(ukladanieMieszane.liczbaPoziomow, 20) }, (_, i) => {
            const y = maxHeight - 10 - ((i + 1) * actualHeight / ukladanieMieszane.liczbaPoziomow);
            return (
              <line
                key={i}
                x1="40"
                y1={y}
                x2={width + 40}
                y2={y}
                stroke="#0050b3"
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })}
          
          {/* Limit wysokości */}
          <line
            x1="30"
            y1={maxHeight - (maxWysokosc / maxWysokosc) * maxHeight - 10}
            x2={width + 50}
            y2={maxHeight - (maxWysokosc / maxWysokosc) * maxHeight - 10}
            stroke="#ff4d4f"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <text x={width + 55} y={maxHeight - maxHeight - 5} fontSize="12" fill="#ff4d4f">
            Max: {maxWysokosc}mm
          </text>
          
          {/* Wymiary */}
          <text x={20} y={maxHeight - actualHeight/2} textAnchor="middle" fontSize="12" fill="#262626"
            transform={`rotate(-90, 20, ${maxHeight - actualHeight/2})`}>
            {ukladanieMieszane.wysokoscStosu}mm
          </text>
          <text x={width/2 + 40} y={maxHeight + 35} textAnchor="middle" fontSize="12" fill="#262626">
            {PALETA_EURO.dlugosc}mm
          </text>
        </svg>
      </div>
    );
  };

  // Tabela podsumowania formatek
  const renderFormatkiSummary = () => {
    if (!formatkiDoUkladania) return null;

    const data = Array.from(formatkiDoUkladania.entries()).map(([typ, formatki], idx) => {
      const f = formatki[0];
      return {
        key: idx,
        rozmiar: `${f.dlugosc}×${f.szerokosc}mm`,
        ilosc: formatki.reduce((sum, f) => sum + f.ilosc, 0),
        kolor: f.kolor || 'STANDARD',
        kolorDot: FORMATKA_COLORS[idx % FORMATKA_COLORS.length]
      };
    });

    return (
      <Table
        dataSource={data}
        size="small"
        pagination={false}
        columns={[
          {
            title: 'Kolor',
            dataIndex: 'kolorDot',
            width: 50,
            render: (color) => (
              <div style={{ 
                width: 20, 
                height: 20, 
                backgroundColor: color,
                borderRadius: 4,
                border: '1px solid #d9d9d9'
              }} />
            )
          },
          {
            title: 'Rozmiar',
            dataIndex: 'rozmiar',
          },
          {
            title: 'Ilość',
            dataIndex: 'ilosc',
            render: (val) => <Text strong>{val} szt.</Text>
          },
          {
            title: 'Kolor płyty',
            dataIndex: 'kolor',
            render: (val) => <Tag>{val}</Tag>
          }
        ]}
      />
    );
  };

  if (!ukladanieMieszane) {
    return (
      <Card>
        <Empty description="Brak danych do wizualizacji" />
      </Card>
    );
  }

  return (
    <Card title={
      <Space>
        <BoxPlotOutlined />
        <span>Wizualizacja Układu Formatek na Palecie EURO</span>
        {useRealData && <Tag color="green">Rzeczywiste dane</Tag>}
        {mixedMode && <Tag color="purple">Różne rozmiary</Tag>}
      </Space>
    }>
      <Row gutter={[16, 16]}>
        {/* Panel kontrolny */}
        {showControls && (
          <Col xs={24} lg={8}>
            <Card size="small" title="Parametry">
              <Space direction="vertical" style={{ width: '100%' }}>
                {!useRealData && (
                  <>
                    <div>
                      <Text strong>Tryb układania:</Text>
                      <Select
                        value={mixedMode ? 'mixed' : 'single'}
                        onChange={(val) => setMixedMode(val === 'mixed')}
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        <Option value="mixed">
                          <Tag color="purple">Różne rozmiary</Tag>
                        </Option>
                        <Option value="single">
                          <Tag color="blue">Jeden rozmiar</Tag>
                        </Option>
                      </Select>
                    </div>

                    {!mixedMode && (
                      <div>
                        <Text strong>Rozmiar formatki:</Text>
                        <Select
                          value={selectedFormat}
                          onChange={setSelectedFormat}
                          style={{ width: '100%', marginTop: 8 }}
                        >
                          {Object.entries(FORMATKI_PRESETS).map(([key, value]) => (
                            <Option key={key} value={key}>{value.nazwa}</Option>
                          ))}
                        </Select>
                      </div>
                    )}

                    <div>
                      <Text strong>Liczba formatek: {liczbaFormatek}</Text>
                      <Slider
                        min={1}
                        max={200}
                        value={liczbaFormatek}
                        onChange={setLiczbaFormatek}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Text strong>Grubość płyty: {gruboscPlyty}mm</Text>
                  <Slider
                    min={10}
                    max={40}
                    value={gruboscPlyty}
                    onChange={setGruboscPlyty}
                  />
                </div>

                <div>
                  <Text strong>Max wysokość: {maxWysokosc}mm</Text>
                  <Slider
                    min={500}
                    max={2000}
                    step={100}
                    value={maxWysokosc}
                    onChange={setMaxWysokosc}
                  />
                </div>

                <div>
                  <Text strong>Widok:</Text>
                  <Select
                    value={viewMode}
                    onChange={setViewMode}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="top">
                      <AppstoreOutlined /> Z góry (poziom)
                    </Option>
                    <Option value="3d">
                      <EyeOutlined /> 3D (izometryczny)
                    </Option>
                    <Option value="side">
                      <ColumnHeightOutlined /> Z boku (wysokość)
                    </Option>
                  </Select>
                </div>
              </Space>
            </Card>

            <Card size="small" title="Formatki na palecie" style={{ marginTop: 16 }}>
              {renderFormatkiSummary()}
            </Card>

            <Card size="small" title="Statystyki" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Różnych rozmiarów:</Text>
                  <div>
                    <Tag color="purple" style={{ fontSize: 16 }}>
                      {ukladanieMieszane.rozneRozmiary}
                    </Tag>
                  </div>
                </div>

                <div>
                  <Text type="secondary">Liczba poziomów:</Text>
                  <div>
                    <Tag color="green" style={{ fontSize: 16 }}>
                      {ukladanieMieszane.liczbaPoziomow}
                    </Tag>
                  </div>
                </div>

                <div>
                  <Text type="secondary">Wysokość stosu:</Text>
                  <div>
                    <Tag 
                      color={ukladanieMieszane.przekroczenie ? 'red' : 'green'} 
                      style={{ fontSize: 16 }}
                    >
                      {ukladanieMieszane.wysokoscStosu}mm
                    </Tag>
                    {ukladanieMieszane.przekroczenie && (
                      <Text type="danger"> (przekroczono!)</Text>
                    )}
                  </div>
                </div>

                <div>
                  <Text type="secondary">Wykorzystanie limitu:</Text>
                  <div>
                    <Tag 
                      color={ukladanieMieszane.wykorzystanie > 80 ? 'red' : 'green'} 
                      style={{ fontSize: 16 }}
                    >
                      {ukladanieMieszane.wykorzystanie}%
                    </Tag>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        )}

        {/* Wizualizacja */}
        <Col xs={24} lg={showControls ? 16 : 24}>
          <Card 
            size="small" 
            title={
              <Space>
                {viewMode === 'top' && <><AppstoreOutlined /> Widok z góry - układanie różnych rozmiarów</>}
                {viewMode === '3d' && <><EyeOutlined /> Widok 3D - stos mieszanych formatek</>}
                {viewMode === 'side' && <><ColumnHeightOutlined /> Widok z boku - wysokość stosu</>}
              </Space>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              {viewMode === 'top' && renderTopView()}
              {viewMode === '3d' && render3DView()}
              {viewMode === 'side' && renderSideView()}
            </div>
          </Card>

          {ukladanieMieszane && (
            <Alert
              message="Podsumowanie układania mieszanych formatek"
              description={
                <div>
                  <Text>
                    Dla {ukladanieMieszane.totalFormatek} formatek w {ukladanieMieszane.rozneRozmiary} różnych rozmiarach
                    potrzeba {ukladanieMieszane.liczbaPoziomow} poziomów. 
                    Całkowita wysokość stosu: {ukladanieMieszane.wysokoscStosu}mm.
                  </Text>
                  {ukladanieMieszane.przekroczenie && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="danger" strong>
                        ⚠️ Przekroczono limit wysokości! Rozważ podział na {Math.ceil(ukladanieMieszane.liczbaPoziomow / ukladanieMieszane.maxPoziomow)} palet.
                      </Text>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Wizualizacja pokazuje optymalne układanie różnych rozmiarów formatek obok siebie, 
                      wykorzystując maksymalnie przestrzeń palety EURO.
                    </Text>
                  </div>
                </div>
              }
              type={ukladanieMieszane.przekroczenie ? 'warning' : 'success'}
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Col>
      </Row>
    </Card>
  );
};
