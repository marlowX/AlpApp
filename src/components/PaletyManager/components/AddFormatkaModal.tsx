import React, { useState } from 'react';
import { Modal, Select, InputNumber, Button, Space, Tag, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Formatka } from '../types';

interface AddFormatkaModalProps {
  visible: boolean;
  paletaId: string;
  dostepneFormatki: Formatka[];
  onAdd: (paletaId: string, formatkaId: number, ilosc: number) => void;
  onCancel: () => void;
}

export const AddFormatkaModal: React.FC<AddFormatkaModalProps> = ({
  visible,
  paletaId,
  dostepneFormatki,
  onAdd,
  onCancel
}) => {
  const [selectedFormatkaId, setSelectedFormatkaId] = useState<number>();
  const [ilosc, setIlosc] = useState<number>(1);

  const handleAdd = () => {
    if (selectedFormatkaId && ilosc > 0) {
      onAdd(paletaId, selectedFormatkaId, ilosc);
      // Reset form
      setSelectedFormatkaId(undefined);
      setIlosc(1);
      onCancel();
    }
  };

  const selectedFormatka = dostepneFormatki.find(f => f.id === selectedFormatkaId);
  const maxDostepna = selectedFormatka?.ilosc_dostepna || 0;

  return (
    <Modal
      title="Dodaj formatkę do palety"
      open={visible}
      onOk={handleAdd}
      onCancel={onCancel}
      okText="Dodaj"
      cancelText="Anuluj"
      okButtonProps={{ disabled: !selectedFormatkaId || ilosc <= 0 || ilosc > maxDostepna }}
    >
      <Space direction="vertical" className="w-full" size="middle">
        {/* Wybór formatki */}
        <div>
          <label className="block mb-2 font-medium">Wybierz formatkę:</label>
          <Select
            placeholder="Wybierz formatkę"
            className="w-full"
            value={selectedFormatkaId}
            onChange={setSelectedFormatkaId}
            showSearch
            optionFilterProp="children"
          >
            {dostepneFormatki
              .filter(f => f.ilosc_dostepna > 0)
              .map(formatka => (
                <Select.Option key={formatka.id} value={formatka.id}>
                  <div className="flex justify-between items-center">
                    <span>{formatka.nazwa}</span>
                    <Space>
                      <Tag color="blue">{formatka.kolor}</Tag>
                      <Tag color="green">Dostępne: {formatka.ilosc_dostepna} szt.</Tag>
                    </Space>
                  </div>
                </Select.Option>
              ))}
          </Select>
        </div>

        {/* Szczegóły wybranej formatki */}
        {selectedFormatka && (
          <Alert
            message="Szczegóły formatki"
            description={
              <div>
                <p>Nazwa: <strong>{selectedFormatka.nazwa}</strong></p>
                <p>Wymiary: {selectedFormatka.dlugosc}x{selectedFormatka.szerokosc}x18 mm</p>
                <p>Kolor: <Tag color="blue">{selectedFormatka.kolor}</Tag></p>
                <p>Dostępne: <strong>{selectedFormatka.ilosc_dostepna} szt.</strong></p>
                <p>Waga sztuki: {((selectedFormatka.dlugosc * selectedFormatka.szerokosc * 18 * 0.8) / 1000000000).toFixed(3)} kg</p>
              </div>
            }
            type="info"
            showIcon
          />
        )}

        {/* Ilość */}
        <div>
          <label className="block mb-2 font-medium">Ilość sztuk:</label>
          <Space>
            <InputNumber
              min={1}
              max={maxDostepna}
              value={ilosc}
              onChange={(val) => setIlosc(val || 1)}
              className="w-32"
            />
            {selectedFormatka && (
              <>
                <Button 
                  onClick={() => setIlosc(Math.min(10, maxDostepna))}
                  disabled={maxDostepna === 0}
                >
                  10 szt.
                </Button>
                <Button 
                  onClick={() => setIlosc(Math.min(50, maxDostepna))}
                  disabled={maxDostepna === 0}
                >
                  50 szt.
                </Button>
                <Button 
                  type="primary"
                  onClick={() => setIlosc(maxDostepna)}
                  disabled={maxDostepna === 0}
                >
                  Wszystkie ({maxDostepna} szt.)
                </Button>
              </>
            )}
          </Space>
          {selectedFormatka && ilosc > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Waga: {(((selectedFormatka.dlugosc * selectedFormatka.szerokosc * 18 * 0.8) / 1000000000) * ilosc).toFixed(2)} kg
              <br />
              Wysokość stosu: {ilosc * 18} mm
            </div>
          )}
        </div>
      </Space>
    </Modal>
  );
};
