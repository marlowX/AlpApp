/**
 * @fileoverview Hook do obsługi drag & drop formatek
 * @module PaletyZko/hooks/useDragDrop
 */

import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { DragDropItem, Formatka, Paleta } from '../types';
import { czyMoznaDodacFormatki, obliczWageSztuki } from '../utils';

export const useDragDrop = (
  onDropFormatka: (
    formatka: Formatka,
    ilosc: number,
    sourcePaletaId: number | undefined,
    targetPaletaId: number
  ) => Promise<boolean>
) => {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [dragOverPaletaId, setDragOverPaletaId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  /**
   * Rozpoczyna przeciąganie formatki
   */
  const handleDragStart = useCallback((
    e: React.DragEvent,
    formatka: Formatka,
    ilosc: number,
    sourcePaletaId?: number
  ) => {
    const item: DragDropItem = {
      type: 'formatka',
      formatka,
      ilosc,
      sourcePaletaId
    };
    
    setDraggedItem(item);
    setIsDragging(true);
    
    // Ustaw dane do przeniesienia
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    
    // Ustaw custom drag image jeśli potrzebne
    if (e.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.innerHTML = `📦 ${formatka.numer_formatki || 'Formatka'} (${ilosc} szt.)`;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.background = 'white';
      dragImage.style.padding = '8px';
      dragImage.style.borderRadius = '4px';
      dragImage.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  }, []);

  /**
   * Obsługuje wejście nad paletę
   */
  const handleDragEnter = useCallback((
    e: React.DragEvent,
    paletaId: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current++;
    
    if (draggedItem && draggedItem.sourcePaletaId !== paletaId) {
      setDragOverPaletaId(paletaId);
    }
  }, [draggedItem]);

  /**
   * Obsługuje przesuwanie nad paletą
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ustaw efekt wizualny
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }, []);

  /**
   * Obsługuje wyjście z palety
   */
  const handleDragLeave = useCallback((
    e: React.DragEvent,
    paletaId: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setDragOverPaletaId(null);
    }
  }, []);

  /**
   * Obsługuje upuszczenie formatki
   */
  const handleDrop = useCallback(async (
    e: React.DragEvent,
    targetPaletaId: number,
    targetPaleta: Paleta
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current = 0;
    setDragOverPaletaId(null);
    
    if (!draggedItem) {
      return;
    }
    
    // Sprawdź czy to nie ta sama paleta
    if (draggedItem.sourcePaletaId === targetPaletaId) {
      message.info('Formatka już jest na tej palecie');
      return;
    }
    
    // Sprawdź limity palety docelowej
    const formatkaZIloscia = {
      ...draggedItem.formatka,
      ilosc_na_palecie: draggedItem.ilosc
    };
    
    const obecneFormatki = targetPaleta.formatki_szczegoly || [];
    const sprawdzenie = czyMoznaDodacFormatki(
      obecneFormatki,
      [formatkaZIloscia],
      targetPaleta.max_waga_kg,
      targetPaleta.max_wysokosc_mm
    );
    
    if (!sprawdzenie.mozna) {
      message.warning(sprawdzenie.powod || 'Nie można dodać formatki do tej palety');
      return;
    }
    
    // Wykonaj przeniesienie
    const sukces = await onDropFormatka(
      draggedItem.formatka,
      draggedItem.ilosc,
      draggedItem.sourcePaletaId,
      targetPaletaId
    );
    
    if (sukces) {
      message.success('Formatka przeniesiona');
    }
  }, [draggedItem, onDropFormatka]);

  /**
   * Kończy przeciąganie
   */
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverPaletaId(null);
    setIsDragging(false);
    dragCounter.current = 0;
  }, []);

  /**
   * Sprawdza czy paleta może przyjąć przeciąganą formatkę
   */
  const canDropOnPaleta = useCallback((
    paletaId: number,
    paleta: Paleta
  ): boolean => {
    if (!draggedItem) return false;
    if (draggedItem.sourcePaletaId === paletaId) return false;
    
    // Sprawdź wagę
    const wagaFormatki = obliczWageSztuki(draggedItem.formatka) * draggedItem.ilosc;
    const nowaWaga = (paleta.waga_kg || 0) + wagaFormatki;
    
    return nowaWaga <= paleta.max_waga_kg;
  }, [draggedItem]);

  /**
   * Zwraca klasę CSS dla palety podczas drag & drop
   */
  const getDragOverClass = useCallback((paletaId: number): string => {
    if (!isDragging) return '';
    
    if (dragOverPaletaId === paletaId) {
      return 'drag-over';
    }
    
    if (draggedItem?.sourcePaletaId === paletaId) {
      return 'drag-source';
    }
    
    return 'drag-available';
  }, [isDragging, dragOverPaletaId, draggedItem]);

  return {
    draggedItem,
    dragOverPaletaId,
    isDragging,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    canDropOnPaleta,
    getDragOverClass
  };
};
