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
  ToolOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";

dayjs.extend(relativeTime);
dayjs.locale("pl");

const { Title, Text } = Typography;

export const WorkerViewWiertarka = () => {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    wTransporcie: 0,
    wBuforze: 0,
    wTrakcie: 0,
    zakonczonych: 0,
    dzisiejszeOtwory: 0,
  });

  // Statusy widoczne dla pracownika wiertarki
  const STATUSY_WIERTARKA = [
    "TRANSPORT_2",          // Transport z okleiniarki
    "BUFOR_WIERTARKA",     // W buforze wiertarki
    "WIERCENIE_START",     // Rozpoczęte wiercenie
    "WIERCENIE_STOP"       // Zakończone wiercenie
  ];

  const fetchZlecenia = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/zko");
      const data = await response.json();
      
      // Filtruj tylko zlecenia w odpowiednich statusach
      const filtered = (data.data || []).filter((zko) =>
        STATUSY_WIERTARKA.includes(zko.status)
      );
      
      console.log("Fetched ZKOs:", data.data?.length, "Filtered for WIERTARKA:", filtered.length);
      
      setZlecenia(filtered);
      
      // Policz statystyki
      const wTransporcie = filtered.filter(z => z.status === "TRANSPORT_2").length;
      const wBuforze = filtered.filter(z => z.status === "BUFOR_WIERTARKA").length;
      const wTrakcie = filtered.filter(z => z.status === "WIERCENIE_START").length;
      const zakonczonych = filtered.filter(z => z.status === "WIERCENIE_STOP").length;
      
      setStats({
        wTransporcie,
        wBuforze,
        wTrakcie,
        zakonczonych,
        dzisiejszeOtwory: filtered.reduce((sum, z) => 
          sum + (z.formatki_count || 0) * 4, 0  // Zakładamy średnio 4 otwory na formatkę
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
      @keyframes drilling {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .drilling-icon {
        animation: drilling 2s linear infinite;
        display: inline-block;
      }
      .drilling-row {
        background-color: #fff1f0;
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
          uzytkownik: localStorage.getItem("operator") || "Operator Wiertarki",
          operator: localStorage.getItem("operator") || "Operator Wiertarki",
          lokalizacja: nowyStatus === "TRANSPORT_3" ? "TRANSPORT" : "WIERTARKA",
          komentarz: `Zmiana statusu przez panel wiertarki na ${nowyStatus}`
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
      TRANSPORT_2: "purple",
      BUFOR_WIERTARKA: "orange",
      WIERCENIE_START: "processing",
      WIERCENIE_STOP: "success",
      TRANSPORT_3: "purple",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      TRANSPORT_2: "W transporcie z okleiniarki",
      BUFOR_WIERTARKA: "W buforze",
      WIERCENIE_START: "Wiercenie w toku",
      WIERCENIE_STOP: "Wiercenie zakończone",
      TRANSPORT_3: "Transport do magazynu",
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      TRANSPORT_2: "BUFOR_WIERTARKA",
      BUFOR_WIERTARKA: "WIERCENIE_START",
      WIERCENIE_START: "WIERCENIE_STOP",
      WIERCENIE_STOP: "TRANSPORT_3",
    };
    return flow[currentStatus];
  };

  const getActionButton = (record) => {
    const nextStatus = getNextStatus(record.status);
    if (!nextStatus) return null;

    const labels = {
      BUFOR_WIERTARKA: "📥 Przyjmij do bufora",
      WIERCENIE_START: "🔧 Rozpocznij wiercenie",
      WIERCENIE_STOP: "✅ Zakończ wiercenie",
      TRANSPORT_3: "🚚 Wyślij do magazynu",
    };

    const icons = {
      BUFOR_WIERTARKA: <InboxOutlined />,
      WIERCENIE_START: <ToolOutlined />,
      WIERCENIE_STOP: <CheckCircleOutlined />,
      TRANSPORT_3: <TruckOutlined />,
    };

    return (
      <Button
        type="primary"
        danger={nextStatus === "TRANSPORT_3"}
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
          status === "WIERCENIE_START" ? "processing" : 
          status === "TRANSPORT_2" ? "warning" :
          "default"
        }>
          <Tag color={getStatusColor(status)} style={{ fontSize: "14px" }}>
            {status === "WIERCENIE_START" && (
              <span className="drilling-icon">⚙️ </span>
            )}
            {getStatusLabel(status)}
          </Tag>
        </Badge>
      ),
    },
    {
      title: "Formatki",
      key: "formatki",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Statistic
            value={record.formatki_count || 0}
            suffix="szt"
            valueStyle={{ fontSize: "18px" }}
          />
          <Text type="secondary">
            ~{(record.formatki_count || 0) * 4} otworów
          </Text>
        </Space>
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
            <ToolOutlined /> Panel Operatora Wiertarki
          </Title>
        </Col>
      </Row>

      {stats.wTransporcie > 0 && (
        <Alert
          message={`${stats.wTransporcie} zleceń w transporcie z okleiniarki`}
          description="Zlecenia są w drodze, przygotuj wiertarkę"
          type="warning"
          showIcon
          icon={<TruckOutlined />}
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
          <Card className={stats.wTrakcie > 0 ? "drilling-row" : ""}>
            <Statistic
              title="W trakcie wiercenia"
              value={stats.wTrakcie}
              prefix={<ToolOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Otwory dziś"
              value={stats.dzisiejszeOtwory}
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
            emptyText: "Brak zleceń do wiercenia",
          }}
          rowClassName={(record) => {
            if (record.status === "TRANSPORT_2") return "transport-row";
            if (record.status === "BUFOR_WIERTARKA") return "buffer-row";
            if (record.status === "WIERCENIE_START") return "drilling-row";
            if (record.status === "WIERCENIE_STOP") return "completed-row";
            return "";
          }}
        />
      </Card>
    </div>
  );
};