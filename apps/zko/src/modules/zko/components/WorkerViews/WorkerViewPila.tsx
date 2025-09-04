import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Badge,
  message,
  Typography,
  Alert,
  Modal,
  Radio,
  Tabs,
  List,
  Progress,
  Divider,
} from "antd";
import {
  ScissorOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  InboxOutlined,
  BgColorsOutlined,
  ToolOutlined,
  HomeOutlined,
  AppstoreOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";

// Import komponentu zarządzania paletami
import { PaletyZko } from "../PaletyZko";

dayjs.extend(relativeTime);
dayjs.locale("pl");

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const WorkerViewPila = () => {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [paletyModalVisible, setPaletyModalVisible] = useState(false);
  const [selectedZko, setSelectedZko] = useState(null);
  const [selectedPaleta, setSelectedPaleta] = useState(null);
  const [transportDestination, setTransportDestination] = useState("BUFOR_OKLEINIARKA");
  const [paletyZko, setPaletyZko] = useState({});
  const [stats, setStats] = useState({
    oczekujace: 0,
    wTrakcie: 0,
    wBuforze: 0,
    dzisiejszeFormatki: 0,
    paletyOtwarte: 0,
    paletyZamkniete: 0,
  });

  // Statusy widoczne dla pracownika piły
  const STATUSY_PILA = [
    "NOWE", 
    "CIECIE_START", 
    "OTWARCIE_PALETY", 
    "PAKOWANIE_PALETY", 
    "ZAMKNIECIE_PALETY", 
    "CIECIE_STOP",
    "BUFOR_PILA"
  ];

  const fetchZlecenia = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/zko");
      const data = await response.json();
      
      // Filtruj tylko zlecenia w odpowiednich statusach
      const filtered = (data.data || []).filter((zko) =>
        STATUSY_PILA.includes(zko.status)
      );
      
      console.log("Fetched ZKOs:", data.data?.length, "Filtered for PILA:", filtered.length);
      
      setZlecenia(filtered);
      
      // Pobierz palety dla każdego ZKO
      const paletyData = {};
      for (const zko of filtered) {
        if (["OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY", "CIECIE_STOP", "BUFOR_PILA"].includes(zko.status)) {
          const paletyResponse = await fetch(`/api/zko/${zko.id}/palety`);
          if (paletyResponse.ok) {
            const palety = await paletyResponse.json();
            paletyData[zko.id] = palety.data || [];
          }
        }
      }
      setPaletyZko(paletyData);
      
      // Policz statystyki
      const oczekujace = filtered.filter(z => z.status === "NOWE").length;
      const wTrakcie = filtered.filter(z => 
        ["CIECIE_START", "OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY", "CIECIE_STOP"].includes(z.status)
      ).length;
      const wBuforze = filtered.filter(z => z.status === "BUFOR_PILA").length;
      
      // Policz palety
      let paletyOtwarte = 0;
      let paletyZamkniete = 0;
      Object.values(paletyData).forEach(palety => {
        palety.forEach(paleta => {
          if (paleta.status === "przygotowanie") paletyOtwarte++;
          if (paleta.status === "gotowa_do_transportu") paletyZamkniete++;
        });
      });
      
      setStats({
        oczekujace,
        wTrakcie,
        wBuforze,
        dzisiejszeFormatki: filtered.reduce((sum, z) => 
          sum + (z.formatki_count || 0), 0
        ),
        paletyOtwarte,
        paletyZamkniete,
      });
    } catch (error) {
      console.error("Błąd pobierania zleceń:", error);
      message.error("Błąd pobierania zleceń");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZlecenia();
    const interval = setInterval(fetchZlecenia, 30000); // odświeżaj co 30s
    
    // Dodaj style dla animacji
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
      .cutting-animation {
        animation: pulse 2s infinite;
      }
      .buffer-row {
        background-color: #f6ffed;
      }
      .paleta-item {
        cursor: pointer;
        transition: all 0.3s;
      }
      .paleta-item:hover {
        background-color: #f0f5ff;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      clearInterval(interval);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const zmienStatus = async (zkoId, nowyStatus) => {
    try {
      const response = await fetch("/api/zko/status/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zko_id: zkoId,
          nowy_etap_kod: nowyStatus,
          uzytkownik: localStorage.getItem("operator") || "Operator Piły",
          operator: localStorage.getItem("operator") || "Operator Piły",
          lokalizacja: nowyStatus === "TRANSPORT_1" ? "TRANSPORT" : "PIŁA",
          komentarz: `Zmiana statusu przez panel piły na ${nowyStatus}`
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.sukces) {
        throw new Error(result.komunikat || "Błąd zmiany statusu");
      }

      message.success(result.komunikat || "Status zmieniony pomyślnie");
      fetchZlecenia();
    } catch (error) {
      console.error("Błąd zmiany statusu:", error);
      message.error(error.message || "Błąd zmiany statusu");
    }
  };

  const handleOpenPaletyManager = (record) => {
    setSelectedZko(record);
    setPaletyModalVisible(true);
  };

  const handleTransportClick = (record) => {
    setSelectedZko(record);
    setTransportModalVisible(true);
    setTransportDestination("BUFOR_OKLEINIARKA");
  };

  const handleTransportPaleta = (record, paleta) => {
    setSelectedZko(record);
    setSelectedPaleta(paleta);
    setTransportModalVisible(true);
    setTransportDestination("BUFOR_OKLEINIARKA");
  };

  const handleTransport = async () => {
    if (!selectedZko) return;

    try {
      // Jeśli transport pojedynczej palety
      if (selectedPaleta) {
        message.info(`Transport palety ${selectedPaleta.numer_palety} do ${getDestinationLabel(transportDestination)}`);
        // TODO: API call dla transportu pojedynczej palety
      } else {
        // Transport całego ZKO
        await zmienStatus(selectedZko.id, "TRANSPORT_1");
        
        setTimeout(async () => {
          const response = await fetch("/api/zko/status/change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              zko_id: selectedZko.id,
              nowy_etap_kod: transportDestination,
              uzytkownik: localStorage.getItem("operator") || "Operator Piły",
              operator: localStorage.getItem("operator") || "Transport",
              lokalizacja: transportDestination.replace("BUFOR_", ""),
              komentarz: `Transport z piły do ${transportDestination}`
            }),
          });

          const result = await response.json();
          
          if (!response.ok || !result.sukces) {
            throw new Error(result.komunikat || "Błąd zmiany statusu");
          }

          message.success(`ZKO ${selectedZko.numer_zko} przetransportowane do ${getDestinationLabel(transportDestination)}`);
          fetchZlecenia();
        }, 1000);
      }

      setTransportModalVisible(false);
      setSelectedZko(null);
      setSelectedPaleta(null);
    } catch (error) {
      console.error("Błąd transportu:", error);
      message.error(error.message || "Błąd transportu");
    }
  };

  const getDestinationLabel = (destination) => {
    const labels = {
      BUFOR_OKLEINIARKA: "Okleiniarki",
      BUFOR_WIERTARKA: "Wiertarki",
      MAGAZYN: "Magazynu",
    };
    return labels[destination] || destination;
  };

  const getStatusColor = (status) => {
    const colors = {
      NOWE: "blue",
      CIECIE_START: "processing",
      OTWARCIE_PALETY: "orange",
      PAKOWANIE_PALETY: "orange",
      ZAMKNIECIE_PALETY: "green",
      CIECIE_STOP: "success",
      BUFOR_PILA: "lime",
      TRANSPORT_1: "purple",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      NOWE: "Oczekuje",
      CIECIE_START: "Rozpoczęto cięcie",
      OTWARCIE_PALETY: "Zarządzanie paletami",
      PAKOWANIE_PALETY: "Pakowanie",
      ZAMKNIECIE_PALETY: "Zamykanie palet",
      CIECIE_STOP: "Zakończono cięcie",
      BUFOR_PILA: "W buforze piły",
      TRANSPORT_1: "Transport",
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus, zko) => {
    // Sprawdź czy wszystkie palety są zamknięte
    const palety = paletyZko[zko?.id] || [];
    const wszystkiePaletyZamkniete = palety.length > 0 && 
      palety.every(p => p.status === "gotowa_do_transportu");
    
    const flow = {
      NOWE: "CIECIE_START",
      CIECIE_START: "OTWARCIE_PALETY",
      OTWARCIE_PALETY: wszystkiePaletyZamkniete ? "CIECIE_STOP" : null,
      PAKOWANIE_PALETY: wszystkiePaletyZamkniete ? "CIECIE_STOP" : null,
      ZAMKNIECIE_PALETY: wszystkiePaletyZamkniete ? "CIECIE_STOP" : null,
      CIECIE_STOP: "BUFOR_PILA",
      BUFOR_PILA: "TRANSPORT_CHOICE",
    };
    return flow[currentStatus];
  };

  const getActionButton = (record) => {
    const nextStatus = getNextStatus(record.status, record);
    
    // Jeśli status to zarządzanie paletami
    if (["OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY"].includes(record.status)) {
      const palety = paletyZko[record.id] || [];
      const wszystkiePaletyZamkniete = palety.length > 0 && 
        palety.every(p => p.status === "gotowa_do_transportu");
      
      return (
        <Space direction="vertical">
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => handleOpenPaletyManager(record)}
            size="large"
          >
            📦 Zarządzaj paletami ({palety.length})
          </Button>
          {wszystkiePaletyZamkniete && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => zmienStatus(record.id, "CIECIE_STOP")}
              size="large"
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              🏁 Zakończ cięcie
            </Button>
          )}
        </Space>
      );
    }
    
    if (!nextStatus) return null;

    // Specjalna obsługa dla wyboru transportu
    if (nextStatus === "TRANSPORT_CHOICE") {
      return (
        <Button
          type="primary"
          danger
          icon={<TruckOutlined />}
          onClick={() => handleTransportClick(record)}
          size="large"
        >
          🚚 Wybierz cel transportu
        </Button>
      );
    }

    const labels = {
      CIECIE_START: "🚀 Rozpocznij cięcie",
      OTWARCIE_PALETY: "📦 Zarządzaj paletami",
      CIECIE_STOP: "🏁 Zakończ cięcie",
      BUFOR_PILA: "📤 Przenieś do bufora",
    };

    const icons = {
      CIECIE_START: <PlayCircleOutlined />,
      OTWARCIE_PALETY: <AppstoreOutlined />,
      CIECIE_STOP: <CheckCircleOutlined />,
      BUFOR_PILA: <InboxOutlined />,
    };

    return (
      <Button
        type="primary"
        icon={icons[nextStatus]}
        onClick={() => zmienStatus(record.id, nextStatus)}
        size="large"
      >
        {labels[nextStatus]}
      </Button>
    );
  };

  const renderPaletyInfo = (record) => {
    const palety = paletyZko[record.id] || [];
    if (!["OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY", "CIECIE_STOP", "BUFOR_PILA"].includes(record.status)) {
      return null;
    }
    
    if (palety.length === 0) {
      return (
        <Alert
          message="Brak palet"
          description="Kliknij 'Zarządzaj paletami' aby utworzyć palety"
          type="warning"
          showIcon
          size="small"
        />
      );
    }
    
    const paletyOtwarte = palety.filter(p => p.status === "przygotowanie");
    const paletyZamkniete = palety.filter(p => p.status === "gotowa_do_transportu");
    
    return (
      <div style={{ marginTop: 8 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>Palety: </Text>
            <Tag color="blue">{palety.length} szt</Tag>
            {paletyOtwarte.length > 0 && (
              <Tag color="orange" icon={<UnlockOutlined />}>
                {paletyOtwarte.length} otwarte
              </Tag>
            )}
            {paletyZamkniete.length > 0 && (
              <Tag color="green" icon={<LockOutlined />}>
                {paletyZamkniete.length} zamknięte
              </Tag>
            )}
          </div>
          
          {record.status === "BUFOR_PILA" && paletyZamkniete.length > 0 && (
            <List
              size="small"
              dataSource={paletyZamkniete}
              renderItem={paleta => (
                <List.Item
                  className="paleta-item"
                  actions={[
                    <Button
                      size="small"
                      type="link"
                      onClick={() => handleTransportPaleta(record, paleta)}
                    >
                      Transport
                    </Button>
                  ]}
                >
                  <Space>
                    <InboxOutlined />
                    <Text>{paleta.numer_palety}</Text>
                    <Tag color="green" size="small">{paleta.ilosc_formatek} szt</Tag>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Space>
      </div>
    );
  };

  const columns = [
    {
      title: "ZKO",
      dataIndex: "numer_zko",
      key: "numer_zko",
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: "16px" }}>{text}</Text>
          {record.kooperant && (
            <Text type="secondary">{record.kooperant}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge status={status.includes("START") ? "processing" : "default"}>
          <Tag color={getStatusColor(status)} style={{ fontSize: "14px" }}>
            {getStatusLabel(status)}
          </Tag>
        </Badge>
      ),
    },
    {
      title: "Formatki / Palety",
      key: "formatki",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Statistic
            value={record.formatki_count || 0}
            suffix="szt"
            valueStyle={{ fontSize: "18px" }}
          />
          {renderPaletyInfo(record)}
        </Space>
      ),
    },
    {
      title: "Czas",
      key: "czas",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text type="secondary">
            <ClockCircleOutlined /> Utworzono
          </Text>
          <Text>{dayjs(record.data_utworzenia).fromNow()}</Text>
        </Space>
      ),
    },
    {
      title: "Akcja",
      key: "akcja",
      render: (_, record) => getActionButton(record),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={24}>
          <Title level={2}>
            <ScissorOutlined /> Panel Operatora Piły
          </Title>
        </Col>
      </Row>

      {stats.wBuforze > 0 && (
        <Alert
          message={`Masz ${stats.wBuforze} zleceń gotowych do transportu`}
          description="Zlecenia w buforze czekają na decyzję o kierunku transportu"
          type="info"
          showIcon
          icon={<TruckOutlined />}
          style={{ marginBottom: "20px" }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Oczekujące"
              value={stats.oczekujace}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className={stats.wTrakcie > 0 ? "cutting-animation" : ""}>
            <Statistic
              title="W trakcie"
              value={stats.wTrakcie}
              prefix={<ScissorOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="W buforze"
              value={stats.wBuforze}
              prefix={<InboxOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Palety otwarte"
              value={stats.paletyOtwarte}
              prefix={<UnlockOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Palety zamknięte"
              value={stats.paletyZamkniete}
              prefix={<LockOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Formatki dziś"
              value={stats.dzisiejszeFormatki}
              suffix="szt"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={zlecenia}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="large"
          locale={{
            emptyText: "Brak zleceń do cięcia",
          }}
          rowClassName={(record) => {
            if (record.status === "CIECIE_START") return "cutting-animation";
            if (record.status === "BUFOR_PILA") return "buffer-row";
            return "";
          }}
        />
      </Card>

      {/* Modal zarządzania paletami */}
      <Modal
        title={
          <Space>
            <AppstoreOutlined />
            <span>Zarządzanie paletami - {selectedZko?.numer_zko}</span>
          </Space>
        }
        visible={paletyModalVisible}
        onCancel={() => {
          setPaletyModalVisible(false);
          setSelectedZko(null);
          fetchZlecenia(); // Odśwież dane po zamknięciu
        }}
        width="90%"
        footer={null}
        bodyStyle={{ padding: 0 }}
      >
        {selectedZko && (
          <PaletyZko 
            zkoId={selectedZko.id} 
            onRefresh={() => fetchZlecenia()}
          />
        )}
      </Modal>

      {/* Modal wyboru celu transportu */}
      <Modal
        title={
          <Space>
            <TruckOutlined />
            <span>
              Wybierz cel transportu dla {selectedZko?.numer_zko}
              {selectedPaleta && ` - Paleta: ${selectedPaleta.numer_palety}`}
            </span>
          </Space>
        }
        visible={transportModalVisible}
        onOk={handleTransport}
        onCancel={() => {
          setTransportModalVisible(false);
          setSelectedZko(null);
          setSelectedPaleta(null);
        }}
        okText="Wyślij transport"
        cancelText="Anuluj"
        width={600}
      >
        <Alert
          message="Wybierz gdzie przetransportować palety"
          description="Na podstawie typu formatek zdecyduj o dalszym procesie produkcji"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        
        <Radio.Group
          value={transportDestination}
          onChange={(e) => setTransportDestination(e.target.value)}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Card 
              hoverable
              style={{ 
                borderColor: transportDestination === "BUFOR_OKLEINIARKA" ? "#1890ff" : undefined,
                borderWidth: transportDestination === "BUFOR_OKLEINIARKA" ? 2 : 1
              }}
            >
              <Radio value="BUFOR_OKLEINIARKA">
                <Space>
                  <BgColorsOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
                  <div>
                    <Text strong>Do Okleiniarki</Text>
                    <br />
                    <Text type="secondary">
                      Formatki wymagają oklejania krawędzi, następnie mogą iść do wiertarki
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
            
            <Card 
              hoverable
              style={{ 
                borderColor: transportDestination === "BUFOR_WIERTARKA" ? "#1890ff" : undefined,
                borderWidth: transportDestination === "BUFOR_WIERTARKA" ? 2 : 1
              }}
            >
              <Radio value="BUFOR_WIERTARKA">
                <Space>
                  <ToolOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                  <div>
                    <Text strong>Do Wiertarki</Text>
                    <br />
                    <Text type="secondary">
                      Formatki nie wymagają oklejania, tylko wiercenie otworów
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
            
            <Card 
              hoverable
              style={{ 
                borderColor: transportDestination === "MAGAZYN" ? "#1890ff" : undefined,
                borderWidth: transportDestination === "MAGAZYN" ? 2 : 1
              }}
            >
              <Radio value="MAGAZYN">
                <Space>
                  <HomeOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <div>
                    <Text strong>Do Magazynu</Text>
                    <br />
                    <Text type="secondary">
                      Formatki gotowe, nie wymagają dalszej obróbki
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
          </Space>
        </Radio.Group>
        
        {selectedZko && (
          <Alert
            message="Informacje o zleceniu"
            description={
              <Space direction="vertical">
                <Text>ZKO: {selectedZko.numer_zko}</Text>
                <Text>Formatki: {selectedZko.formatki_count || 0} szt</Text>
                <Text>Kooperant: {selectedZko.kooperant || "Brak"}</Text>
                {selectedPaleta && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <Text strong>Wybrana paleta:</Text>
                    <Text>Numer: {selectedPaleta.numer_palety}</Text>
                    <Text>Formatki: {selectedPaleta.ilosc_formatek} szt</Text>
                  </>
                )}
              </Space>
            }
            type="warning"
            style={{ marginTop: 20 }}
          />
        )}
      </Modal>
    </div>
  );
};