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
} from "antd";
import {
  ScissorOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";

dayjs.extend(relativeTime);
dayjs.locale("pl");

const { Title, Text } = Typography;

export const WorkerViewPila = () => {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    oczekujace: 0,
    wTrakcie: 0,
    dzisiejszeFormatki: 0,
  });

  // Statusy widoczne dla pracownika piły
  const STATUSY_PILA = ["NOWE", "CIECIE_START", "OTWARCIE_PALETY", "PAKOWANIE_PALETY", "ZAMKNIECIE_PALETY", "CIECIE_STOP"];

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
      
      setStats({
        oczekujace,
        wTrakcie,
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
      .cutting-animation {
        animation: pulse 2s infinite;
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
          zko_id: zkoId, // Poprawka: używaj zko_id zamiast zkoId
          nowy_etap_kod: nowyStatus, // Poprawka: używaj nowy_etap_kod zamiast nowyStatus
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

  const getStatusColor = (status) => {
    const colors = {
      NOWE: "blue",
      CIECIE_START: "processing",
      OTWARCIE_PALETY: "orange",
      PAKOWANIE_PALETY: "orange",
      ZAMKNIECIE_PALETY: "green",
      CIECIE_STOP: "success",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      NOWE: "Oczekuje",
      CIECIE_START: "Rozpoczęto cięcie",
      OTWARCIE_PALETY: "Otwarta paleta",
      PAKOWANIE_PALETY: "Pakowanie",
      ZAMKNIECIE_PALETY: "Zamknięta paleta",
      CIECIE_STOP: "Zakończono cięcie",
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      NOWE: "CIECIE_START",
      CIECIE_START: "OTWARCIE_PALETY",
      OTWARCIE_PALETY: "PAKOWANIE_PALETY",
      PAKOWANIE_PALETY: "ZAMKNIECIE_PALETY",
      ZAMKNIECIE_PALETY: "CIECIE_STOP",
      CIECIE_STOP: "BUFOR_PILA",
    };
    return flow[currentStatus];
  };

  const getActionButton = (record) => {
    const nextStatus = getNextStatus(record.status);
    if (!nextStatus) return null;

    const labels = {
      CIECIE_START: "🚀 Rozpocznij cięcie",
      OTWARCIE_PALETY: "📦 Otwórz paletę",
      PAKOWANIE_PALETY: "📋 Pakuj formatki",
      ZAMKNIECIE_PALETY: "✅ Zamknij paletę",
      CIECIE_STOP: "🏁 Zakończ cięcie",
      BUFOR_PILA: "📤 Przenieś do bufora",
    };

    return (
      <Button
        type="primary"
        icon={<PlayCircleOutlined />}
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

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Oczekujące"
              value={stats.oczekujace}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={stats.wTrakcie > 0 ? "cutting-animation" : ""}>
            <Statistic
              title="W trakcie cięcia"
              value={stats.wTrakcie}
              prefix={<ScissorOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
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
          rowClassName={(record) =>
            record.status === "CIECIE_START" ? "cutting-animation" : ""
          }
        />
      </Card>
    </div>
  );
};