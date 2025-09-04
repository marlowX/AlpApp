import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tooltip,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";

dayjs.extend(relativeTime);
dayjs.locale("pl");

const { Title, Text } = Typography;

export const WorkerViewPila = () => {
  const navigate = useNavigate();
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [selectedZko, setSelectedZko] = useState(null);
  const [transportDestination, setTransportDestination] = useState("BUFOR_OKLEINIARKA");
  const [stats, setStats] = useState({
    oczekujace: 0,
    wTrakcie: 0,
    wBuforze: 0,
    dzisiejszeFormatki: 0,
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
      
      // Policz statystyki
      const oczekujace = filtered.filter(z => z.status === "NOWE").length;
      const wTrakcie = filtered.filter(z => 
        ["CIECIE_START", "OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY", "CIECIE_STOP"].includes(z.status)
      ).length;
      const wBuforze = filtered.filter(z => z.status === "BUFOR_PILA").length;
      
      setStats({
        oczekujace,
        wTrakcie,
        wBuforze,
        dzisiejszeFormatki: filtered.reduce((sum, z) => 
          sum + (z.formatki_count || 0), 0
        ),
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
    
    // Dodaj style
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
          lokalizacja: "PIŁA",
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

  const handleOpenZKODetails = (zkoId) => {
    // Przekieruj do strony szczegółów ZKO dla operatora
    navigate(`/worker/zko/${zkoId}`);
  };

  const handleTransportClick = (record) => {
    setSelectedZko(record);
    setTransportModalVisible(true);
  };

  const handleTransport = async () => {
    if (!selectedZko) return;

    try {
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

        message.success(`ZKO ${selectedZko.numer_zko} przetransportowane`);
        fetchZlecenia();
      }, 1000);

      setTransportModalVisible(false);
      setSelectedZko(null);
    } catch (error) {
      console.error("Błąd transportu:", error);
      message.error(error.message || "Błąd transportu");
    }
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
    };
    return labels[status] || status;
  };

  const getActionButton = (record) => {
    // Dla statusów związanych z paletami - przekieruj do szczegółów
    if (["OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY"].includes(record.status)) {
      return (
        <Space direction="vertical">
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => handleOpenZKODetails(record.id)}
            size="large"
          >
            📦 Zarządzaj paletami
          </Button>
          <Tooltip title="Otwórz pełne szczegóły zlecenia z zarządzaniem paletami">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kliknij aby zarządzać paletami i formatkami
            </Text>
          </Tooltip>
        </Space>
      );
    }
    
    // Dla statusu NOWE - rozpocznij cięcie
    if (record.status === "NOWE") {
      return (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => zmienStatus(record.id, "CIECIE_START")}
          size="large"
        >
          🚀 Rozpocznij cięcie
        </Button>
      );
    }
    
    // Dla statusu CIECIE_START - przejdź do zarządzania paletami
    if (record.status === "CIECIE_START") {
      return (
        <Button
          type="primary"
          icon={<AppstoreOutlined />}
          onClick={() => zmienStatus(record.id, "OTWARCIE_PALETY")}
          size="large"
        >
          📦 Przejdź do palet
        </Button>
      );
    }
    
    // Dla statusu CIECIE_STOP - przenieś do bufora
    if (record.status === "CIECIE_STOP") {
      return (
        <Button
          type="primary"
          icon={<InboxOutlined />}
          onClick={() => zmienStatus(record.id, "BUFOR_PILA")}
          size="large"
        >
          📤 Przenieś do bufora
        </Button>
      );
    }
    
    // Dla statusu BUFOR_PILA - wybierz transport
    if (record.status === "BUFOR_PILA") {
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
    
    return null;
  };

  const columns = [
    {
      title: "ZKO",
      dataIndex: "numer_zko",
      key: "numer_zko",
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Button 
            type="link" 
            style={{ padding: 0, fontSize: "16px", fontWeight: "bold" }}
            onClick={() => handleOpenZKODetails(record.id)}
          >
            {text}
          </Button>
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
      title: "Formatki",
      key: "formatki",
      render: (_, record) => (
        <Statistic
          value={record.formatki_count || 0}
          suffix="szt"
          valueStyle={{ fontSize: "18px" }}
        />
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
      render: (_, record) => (
        <Space direction="vertical">
          {getActionButton(record)}
          {/* Zawsze pokazuj link do szczegółów */}
          <Button 
            type="link" 
            size="small"
            onClick={() => handleOpenZKODetails(record.id)}
          >
            Zobacz szczegóły →
          </Button>
        </Space>
      ),
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
        <Col span={6}>
          <Card>
            <Statistic
              title="Oczekujące"
              value={stats.oczekujace}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={stats.wTrakcie > 0 ? "cutting-animation" : ""}>
            <Statistic
              title="W trakcie"
              value={stats.wTrakcie}
              prefix={<ScissorOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="W buforze"
              value={stats.wBuforze}
              prefix={<InboxOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
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
        <Alert
          message="Kliknij na numer ZKO aby otworzyć pełne szczegóły zlecenia"
          description="W szczegółach możesz zarządzać pozycjami, paletami i formatkami używając tych samych komponentów co w głównym module ZKO"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
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

      {/* Modal wyboru celu transportu - poprawione visible na open */}
      <Modal
        title={
          <Space>
            <TruckOutlined />
            <span>Wybierz cel transportu dla {selectedZko?.numer_zko}</span>
          </Space>
        }
        open={transportModalVisible}
        onOk={handleTransport}
        onCancel={() => {
          setTransportModalVisible(false);
          setSelectedZko(null);
        }}
        okText="Wyślij transport"
        cancelText="Anuluj"
        width={600}
      >
        <Radio.Group
          value={transportDestination}
          onChange={(e) => setTransportDestination(e.target.value)}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Card hoverable>
              <Radio value="BUFOR_OKLEINIARKA">
                <Space>
                  <BgColorsOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
                  <div>
                    <Text strong>Do Okleiniarki</Text>
                    <br />
                    <Text type="secondary">
                      Formatki wymagają oklejania krawędzi
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
            
            <Card hoverable>
              <Radio value="BUFOR_WIERTARKA">
                <Space>
                  <ToolOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                  <div>
                    <Text strong>Do Wiertarki</Text>
                    <br />
                    <Text type="secondary">
                      Formatki nie wymagają oklejania
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
            
            <Card hoverable>
              <Radio value="MAGAZYN">
                <Space>
                  <HomeOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <div>
                    <Text strong>Do Magazynu</Text>
                    <br />
                    <Text type="secondary">
                      Formatki gotowe, bez dalszej obróbki
                    </Text>
                  </div>
                </Space>
              </Radio>
            </Card>
          </Space>
        </Radio.Group>
      </Modal>
    </div>
  );
};