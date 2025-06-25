'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CursorPosition {
  user_id: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  user: {
    full_name?: string;
    email: string;
  };
}

interface CollaborativeCursorsProps {
  cursors: CursorPosition[];
  editorRef: React.RefObject<HTMLDivElement>;
  onCursorMove?: (position: number, selection?: { start: number; end: number }) => void;
}

interface CursorElement {
  id: string;
  element: HTMLDivElement;
  label: HTMLDivElement;
}

const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  cursors,
  editorRef,
  onCursorMove
}) => {
  const [cursorElements, setCursorElements] = useState<Map<string, CursorElement>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Detectar mudanças de cursor/seleção no editor
  useEffect(() => {
    if (!editorRef.current) return;

    const handleSelectionChange = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || !editorRef.current) return;

        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (!range) return;

        // Calcular posição relativa no editor
        const editorRect = editorRef.current.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();
        
        const position = getTextPosition(range.startContainer, range.startOffset);
        
        let selectionRange: { start: number; end: number } | undefined;
        if (!range.collapsed) {
          selectionRange = {
            start: getTextPosition(range.startContainer, range.startOffset),
            end: getTextPosition(range.endContainer, range.endOffset)
          };
        }

        onCursorMove?.(position, selectionRange);
      }, 100);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editorRef.current.addEventListener('click', handleSelectionChange);
    editorRef.current.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleSelectionChange);
        editorRef.current.removeEventListener('keyup', handleSelectionChange);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [editorRef, onCursorMove]);

  // Atualizar cursors quando mudarem
  useEffect(() => {
    updateCursors();
  }, [cursors]);

  // Limpar cursors quando componente desmonta
  useEffect(() => {
    return () => {
      cursorElements.forEach(({ element, label }) => {
        element.remove();
        label.remove();
      });
    };
  }, []);

  const getTextPosition = (node: Node, offset: number): number => {
    if (!editorRef.current) return 0;

    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let position = 0;
    let currentNode;

    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return position + offset;
      }
      position += currentNode.textContent?.length || 0;
    }

    return position;
  };

  const getPositionCoordinates = (position: number): { x: number; y: number } | null => {
    if (!editorRef.current) return null;

    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPosition = 0;
    let currentNode;

    while (currentNode = walker.nextNode()) {
      const nodeLength = currentNode.textContent?.length || 0;
      
      if (currentPosition + nodeLength >= position) {
        const offset = position - currentPosition;
        
        try {
          const range = document.createRange();
          range.setStart(currentNode, Math.min(offset, nodeLength));
          range.setEnd(currentNode, Math.min(offset, nodeLength));
          
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          
          return {
            x: rect.left - editorRect.left,
            y: rect.top - editorRect.top
          };
        } catch (error) {
          console.warn('Error getting position coordinates:', error);
          return null;
        }
      }
      
      currentPosition += nodeLength;
    }

    return null;
  };

  const createCursorElement = (cursor: CursorPosition): CursorElement => {
    // Criar elemento do cursor
    const cursorEl = document.createElement('div');
    cursorEl.className = 'collaborative-cursor';
    cursorEl.style.cssText = `
      position: absolute;
      width: 2px;
      height: 20px;
      background-color: ${cursor.color};
      pointer-events: none;
      z-index: 1000;
      opacity: 0.8;
      transition: all 0.15s ease-out;
    `;

    // Criar label do usuário
    const labelEl = document.createElement('div');
    labelEl.className = 'collaborative-cursor-label';
    labelEl.textContent = cursor.user.full_name || cursor.user.email.split('@')[0];
    labelEl.style.cssText = `
      position: absolute;
      top: -25px;
      left: -5px;
      background-color: ${cursor.color};
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      z-index: 1001;
      opacity: 0;
      transform: translateY(5px);
      transition: all 0.2s ease-out;
    `;

    // Adicionar ao editor
    if (editorRef.current) {
      editorRef.current.appendChild(cursorEl);
      editorRef.current.appendChild(labelEl);
    }

    // Mostrar label temporariamente
    setTimeout(() => {
      labelEl.style.opacity = '1';
      labelEl.style.transform = 'translateY(0)';
    }, 50);

    setTimeout(() => {
      labelEl.style.opacity = '0';
      labelEl.style.transform = 'translateY(-5px)';
    }, 2000);

    return {
      id: cursor.user_id,
      element: cursorEl,
      label: labelEl
    };
  };

  const updateCursors = () => {
    if (!editorRef.current) return;

    // Remover cursors que não existem mais
    const currentCursorIds = new Set(cursors.map(c => c.user_id));
    cursorElements.forEach((cursorEl, userId) => {
      if (!currentCursorIds.has(userId)) {
        cursorEl.element.remove();
        cursorEl.label.remove();
        cursorElements.delete(userId);
      }
    });

    // Atualizar ou criar cursors
    cursors.forEach(cursor => {
      const coords = getPositionCoordinates(cursor.position);
      if (!coords) return;

      let cursorEl = cursorElements.get(cursor.user_id);
      
      if (!cursorEl) {
        // Criar novo cursor
        cursorEl = createCursorElement(cursor);
        setCursorElements(prev => new Map(prev).set(cursor.user_id, cursorEl!));
      }

      // Atualizar posição
      cursorEl.element.style.left = `${coords.x}px`;
      cursorEl.element.style.top = `${coords.y}px`;
      cursorEl.label.style.left = `${coords.x - 5}px`;
      cursorEl.label.style.top = `${coords.y - 25}px`;

      // Mostrar seleção se existir
      if (cursor.selection) {
        const startCoords = getPositionCoordinates(cursor.selection.start);
        const endCoords = getPositionCoordinates(cursor.selection.end);
        
        if (startCoords && endCoords) {
          // Criar ou atualizar highlight de seleção
          let selectionEl = editorRef.current?.querySelector(
            `.collaborative-selection[data-user="${cursor.user_id}"]`
          ) as HTMLDivElement;

          if (!selectionEl) {
            selectionEl = document.createElement('div');
            selectionEl.className = 'collaborative-selection';
            selectionEl.setAttribute('data-user', cursor.user_id);
            selectionEl.style.cssText = `
              position: absolute;
              background-color: ${cursor.color};
              opacity: 0.2;
              pointer-events: none;
              z-index: 999;
              border-radius: 2px;
            `;
            editorRef.current?.appendChild(selectionEl);
          }

          // Calcular dimensões da seleção
          const width = Math.abs(endCoords.x - startCoords.x);
          const height = Math.max(20, Math.abs(endCoords.y - startCoords.y) + 20);
          
          selectionEl.style.left = `${Math.min(startCoords.x, endCoords.x)}px`;
          selectionEl.style.top = `${Math.min(startCoords.y, endCoords.y)}px`;
          selectionEl.style.width = `${width || 2}px`;
          selectionEl.style.height = `${height}px`;
        }
      } else {
        // Remover seleção se não existir
        const selectionEl = editorRef.current?.querySelector(
          `.collaborative-selection[data-user="${cursor.user_id}"]`
        );
        if (selectionEl) {
          selectionEl.remove();
        }
      }
    });
  };

  // Adicionar estilos CSS uma vez
  useEffect(() => {
    const styleId = 'collaborative-cursors-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .collaborative-cursor {
        animation: cursor-blink 1s infinite;
      }
      
      @keyframes cursor-blink {
        0%, 50% { opacity: 0.8; }
        51%, 100% { opacity: 0.3; }
      }
      
      .collaborative-cursor-label:hover {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      .collaborative-selection {
        transition: all 0.15s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null; // Este componente apenas gerencia elementos DOM
};

export default CollaborativeCursors; 