  // 🆕 SZYBKIE PLANOWANIE Z KOLORAMI (bez modal)
  const handlePlanujModularnieQuick = async () => {
    try {
      const result = await inteligentneZnalowanie(zkoId, {
        max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
        max_formatek_na_palete: 80,
        operator: 'user',
        strategia: 'kolory'  // 🆕 DOMYŚLNIE KOLORY
      });

      // Sprawdź czy potrzebne jest potwierdzenie
      if (result?.potrzebaTPotwierdzenia) {
        Modal.confirm({
          title: '🤔 Czy nadpisać istniejące palety?',
          icon: <ExclamationCircleOutlined />,
          content: (
            <div>
              <p>{result.komunikat}</p>
              <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 6 }}>
                <Text strong>Obecny stan:</Text>
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li>Palet: {result.obecnyStatus?.podsumowanie?.palety?.liczba_palet || 0}</li>
                  <li>Sztuk: {result.obecnyStatus?.podsumowanie?.palety?.total_sztuk || 0}</li>
                  <li>Status: <Tag color={result.obecnyStatus?.status === 'OK' ? 'green' : 'orange'}>
                    {result.obecnyStatus?.status}
                  </Tag></li>
                </ul>
              </div>
              {result.zalecaneNadpisanie && (
                <Alert
                  message="⚠️ Zalecane nadpisanie"
                  description="Wykryto błędy w obecnych paletach - nadpisanie naprawi problemy"
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
              <Alert
                message="🎨 Planowanie z kolorami"
                description="Nowa strategia utworzy palety pogrupowane po kolorach - każda paleta = jeden kolor formatek"
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            </div>
          ),
          okText: result.strategia === 'kolory' ? 'Tak, grupuj po kolorach' : 'Tak, nadpisz palety',
          cancelText: 'Anuluj',
          okButtonProps: { 
            style: { background: '#13c2c2', borderColor: '#13c2c2' }
          },
          onOk: async () => {
            // Wykonaj planowanie z nadpisaniem
            const finalResult = await inteligentneZnalowanie(zkoId, {
              max_wysokosc_mm: LIMITY_PALETY.DOMYSLNA_WYSOKOSC_MM,
              max_formatek_na_palete: 80,
              operator: 'user',
              strategia: 'kolory'
            }, true); // force overwrite

            if (finalResult && !finalResult.potrzebaTPotwierdzenia) {
              showPlanningSuccessModal(finalResult, 'Szybkie Planowanie z Kolorami', true);
              fetchPalety();
              onRefresh?.();
            }
          }
        });
        return;
      }

      // Jeśli nie ma palet lub nadpisano - pokaż wyniki
      if (result && !result.potrzebaTPotwierdzenia) {
        const isExisting = result.szczegoly?.palety;
        showPlanningSuccessModal(
          result, 
          isExisting ? 'Palety już istniejące' : 'Szybkie Planowanie z Kolorami',
          false
        );
        
        fetchPalety();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error in intelligent color planning:', error);
      message.error('Błąd inteligentnego planowania z kolorami');
    }
  };

  // 🆕 FUNKCJA POKAZUJĄCA MODAL SUKCESU z wizualizacją
  const showPlanningSuccessModal = (result: any, title: string, wasOverwritten: boolean) => {
    const palety = result.szczegoly?.palety || result.planowanie?.palety_szczegoly || [];
    const weryfikacja = result.weryfikacja;
    const strategia = result.planowanie?.strategia || 'kolory';
    
    Modal.success({
      title: `✅ ${title} - Sukces!`,
      width: 800,
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <Tag color="blue" style={{ fontSize: 14 }}>
                📦 {palety.length} palet
              </Tag>
              <Tag color="green" style={{ fontSize: 14 }}>
                🔢 {weryfikacja?.podsumowanie?.zko?.total_sztuk || 'N/A'} sztuk
              </Tag>
              {strategia === 'kolory' && (
                <Tag color="cyan" style={{ fontSize: 14 }}>
                  🎨 Grupowanie po kolorach
                </Tag>
              )}
              {weryfikacja?.status && (
                <Tag color={weryfikacja.status === 'OK' ? 'green' : 'orange'} style={{ fontSize: 14 }}>
                  📊 Status: {weryfikacja.status}
                </Tag>
              )}
            </Space>
          </div>

          {strategia === 'kolory' && palety.length > 0 && (
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              marginTop: 16,
              padding: 12,
              backgroundColor: '#fafafa',
              borderRadius: 6
            }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                🎨 Podgląd palet z kolorami:
              </Text>
              <Row gutter={[16, 16]}>
                {palety.slice(0, 4).map((paleta: any) => (
                  <Col span={12} key={paleta.id}>
                    <Card 
                      size="small" 
                      style={{ backgroundColor: 'white' }}
                      title={
                        <Space>
                          <Text strong style={{ fontSize: 12 }}>
                            {paleta.numer_palety}
                          </Text>
                          {paleta.kolory_na_palecie && (
                            <Tag color="cyan" size="small">
                              {paleta.kolory_na_palecie}
                            </Tag>
                          )}
                        </Space>
                      }
                    >
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text style={{ fontSize: 12 }}>
                          📦 <strong>{paleta.sztuk_total}</strong> sztuk
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                          🎨 <strong>{paleta.formatki_szczegoly?.length || 0}</strong> typów
                        </Text>
                        {paleta.formatki_szczegoly?.slice(0, 2).map((f: any, idx: number) => (
                          <Text key={idx} type="secondary" style={{ fontSize: 10 }}>
                            • {f.nazwa}: {f.ilosc}szt
                          </Text>
                        ))}
                        {(paleta.formatki_szczegoly?.length || 0) > 2 && (
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            ... i {paleta.formatki_szczegoly.length - 2} więcej
                          </Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
              {palety.length > 4 && (
                <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
                  ... i {palety.length - 4} więcej palet
                </Text>
              )}
            </div>
          )}
          
          <Alert
            message={strategia === 'kolory' ? "🎨 Planowanie z kolorami" : "⚡ Planowanie modulariczne"}
            description={
              strategia === 'kolory' 
                ? "Każda paleta zawiera formatki tylko jednego koloru - łatwa identyfikacja i transport!"
                : "Formatki rozłożone proporcjonalnie na wszystkich paletach"
            }
            type={wasOverwritten ? "warning" : "success"}
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    });
  };