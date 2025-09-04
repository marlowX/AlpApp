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
} from "antd";
import {
  BgColorsOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";

dayjs.extend(relativeTime);
dayjs.locale("pl");

const { Title, Text } = Typography;

export const WorkerViewOkleiniarka = () => {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    wTransporcie: 0,
    wBuforze: 0,
    wTrakcie: 0,
    dzisiejszeFormatki: 0,
  });

  // Statusy widoczne dla pracownika okleiniarki
  const STATUSY_OKLEINIARKA = [
    "TRANSPORT_1",           // Transport z piły
    "BUFOR_OKLEINIARKA",    // W buforze okleiniarki
    "OKLEJANIE_START",      // Rozpoczęte oklejanie
    "OKLEJANIE_STOP"        // Zakończone oklejanie
  ];

  const fetchZlecenia = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/zko");
      const data = await response.json();
      
      // Filtruj tylko zlecenia w odpowiednich statusach
      const filtered = (data.data || []).filter((zko) =>
        STATUSY_OKLEINIARKA.includes(zko.status)
      );
      
      console.log("Fetched ZKOs:", data.data?.length, "Filtered for OKLEINIARKA:", filtered.length);
      
      setZlecenia(filtered);
      
      // Policz statystyki
      const wTransporcie = filtered.filter(z => z.status === "TRANSPORT_1").length;
      const wBuforze = filtered.filter(z => z.status === "BUFOR_OKLEINIARKA").length;
      const wTrakcie = filtered.filter(z => z.status === "OKLEJANIE_START").length;
      const zakonczonych = filtered.filter(z => z.status === "OKLEJANIE_STOP").length;
      
      setStats({
        wTransporcie,
        wBuforze,
        wTrakcie,
        zakonczonych,
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
    
    // Dodaj style dla animacji
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
      .processing-animation {
        animation: pulse 2s infinite;
      }
      .transport-row {
        background-color: #fff7e6;
      }
      .buffer-row {
        background-color: #f6ffed;
      }
      .completed-row {
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
          uzytkownik: localStorage.getItem("operator") || "Operator Okleiniarki",
          operator: localStorage.getItem("operator") || "Operator Okleiniarki",
          lokalizacja: nowyStatus === "TRANSPORT_2" ? "TRANSPORT" : "OKLEINIARKA",
          komentarz: `Zmiana statusu przez panel okleiniarki na ${nowyStatus}`
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

  const getStatusColor = (status) => {
    const colors = {
      TRANSPORT_1: "purple",
      BUFOR_OKLEINIARKA: "orange",
      OKLEJANIE_START: "processing",
      OKLEJANIE_STOP: "success",
      TRANSPORT_2: "purple",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      TRANSPORT_1: "W transporcie z piły",
      BUFOR_OKLEINIARKA: "W buforze",
      OKLEJANIE_START: "Oklejanie w toku",
      OKLEJANIE_STOP: "Oklejanie zakończone",
      TRANSPORT_2: "Transport do wiertarki",
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      TRANSPORT_1: "BUFOR_OKLEINIARKA",
      BUFOR_OKLEINIARKA: "OKLEJANIE_START",
      OKLEJANIE_START: "OKLEJANIE_STOP",
      OKLEJANIE_STOP: "TRANSPORT_2",
    };
    return flow[currentStatus];
  };

  const getActionButton = (record) => {
    const nextStatus = getNextStatus(record.status);
    if (!nextStatus) return null;

    const labels = {
      BUFOR_OKLEINIARKA: "📥 Przyjmij do bufora",
      OKLEJANIE_START: "🎨 Rozpocznij oklejanie",
      OKLEJANIE_STOP: "✅ Zakończ oklejanie",
      TRANSPORT_2: "🚚 Wyślij do wiertarki",
    };

    const icons = {
      BUFOR_OKLEINIARKA: <InboxOutlined />,
      OKLEJANIE_START: <PlayCircleOutlined />,
      OKLEJANIE_STOP: <CheckCircleOutlined />,
      TRANSPORT_2: <TruckOutlined />,
    };

    const buttonType = {
      BUFOR_OKLEINIARKA: "default",
      OKLEJANIE_START: "primary",
      OKLEJANIE_STOP: "primary",
      TRANSPORT_2: "primary",
    };

    return (
      <Button
        type={buttonType[nextStatus] || "primary"}
        danger={nextStatus === "TRANSPORT_2"}
        icon={icons[nextStatus]}
        onClick={() => zmienStatus(record.id, nextStatus)}
        size="large"
      >
        {labels[nextStatus]}
      </Button>
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
        <Badge status={
          status === "OKLEJANIE_START" ? "processing" : 
          status === "TRANSPORT_1" ? "warning" :
          "default"
        }>
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
      title: "Czas w statusie",
      key: "czas",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text type="secondary">
            <ClockCircleOutlined /> {getStatusLabel(record.status)}
          </Text>
          <Text>{dayjs(record.updated_at || record.data_utworzenia).fromNow()}</Text>
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
            <BgColorsOutlined /> Panel Operatora Okleiniarki
          </Title>
        </Col>
      </Row>

      {stats.wTransporcie > 0 && (
        <Alert
          message={`${stats.wTransporcie} zleceń w transporcie z piły`}
          description="Zlecenia są w drodze, przygotuj się na przyjęcie"
          type="warning"
          showIcon
          icon={<TruckOutlined />}
          style={{ marginBottom: "20px" }}
        />
      )}

      {stats.wBuforze > 3 && (
        <Alert
          message="Uwaga: Duża ilość zleceń w buforze!"
          description={`Masz ${stats.wBuforze} zleceń oczekujących na oklejanie`}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="W transporcie"
              value={stats.wTransporcie}
              prefix={<TruckOutlined />}
              valueStyle={{ color: "#722ed1" }}
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
          <Card className={stats.wTrakcie > 0 ? "processing-animation" : ""}>
            <Statistic
              title="W trakcie oklejania"
              value={stats.wTrakcie}
              prefix={<BgColorsOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Formatki dziś"
              value={stats.dzisiejszeFormatki}
              suffix="szt"
              valueStyle={{ color: "#1890ff" }}
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
            emptyText: "Brak zleceń do oklejania",
          }}
          rowClassName={(record) => {
            if (record.status === "TRANSPORT_1") return "transport-row";
            if (record.status === "BUFOR_OKLEINIARKA") return "buffer-row";
            if (record.status === "OKLEJANIE_START") return "processing-animation";
            if (record.status === "OKLEJANIE_STOP") return "completed-row";
            return "";
          }}
        />
      </Card>
    </div>
  );
};