import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, IconButton, Typography } from '@mui/material';
import { X } from '@phosphor-icons/react';
import styles from './FloatingWindow.module.css';

interface FloatingWindowProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeEdge = 'right' | 'bottom' | 'corner';

export default function FloatingWindow({
  open,
  onClose,
  title,
  children,
  defaultWidth = 860,
  defaultHeight = 600,
  minWidth = 420,
  minHeight = 340,
}: FloatingWindowProps): JSX.Element | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const dragOrigin = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeOrigin = useRef<{ startX: number; startY: number; origW: number; origH: number; edge: ResizeEdge } | null>(null);

  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    setRect((prev) => {
      if (prev) return prev;
      const width = Math.min(defaultWidth, window.innerWidth - 32);
      const height = Math.min(defaultHeight, window.innerHeight - 32);
      return {
        x: Math.max(16, (window.innerWidth - width) / 2),
        y: Math.max(16, (window.innerHeight - height) / 2),
        width,
        height,
      };
    });
  }, [open, defaultWidth, defaultHeight]);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, origX: rect.x, origY: rect.y };
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragOrigin.current) return;
    const { startX, startY, origX, origY } = dragOrigin.current;
    setRect((prev) => {
      if (!prev) return prev;
      const nextX = Math.min(Math.max(origX + (e.clientX - startX), -(prev.width - 120)), window.innerWidth - 120);
      const nextY = Math.min(Math.max(origY + (e.clientY - startY), 0), window.innerHeight - 48);
      return { ...prev, x: nextX, y: nextY };
    });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    dragOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const startResize = (edge: ResizeEdge) => (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeOrigin.current = { startX: e.clientX, startY: e.clientY, origW: rect.width, origH: rect.height, edge };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!resizeOrigin.current) return;
    const { startX, startY, origW, origH, edge } = resizeOrigin.current;
    setRect((prev) => {
      if (!prev) return prev;
      const maxWidth = window.innerWidth - prev.x - 16;
      const maxHeight = window.innerHeight - prev.y - 16;
      return {
        ...prev,
        width: edge === 'bottom' ? prev.width : Math.min(maxWidth, Math.max(minWidth, origW + (e.clientX - startX))),
        height: edge === 'right' ? prev.height : Math.min(maxHeight, Math.max(minHeight, origH + (e.clientY - startY))),
      };
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    resizeOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!open || !rect) return null;

  return createPortal(
    <Box
      className={styles.window}
      style={{
        '--win-x': `${rect.x}px`,
        '--win-y': `${rect.y}px`,
        '--win-width': `${rect.width}px`,
        '--win-height': `${rect.height}px`,
      } as React.CSSProperties}
    >
      <Box
        className={styles.header}
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
      >
        <Typography variant="body2" fontWeight={700} className={styles.title} noWrap>{title}</Typography>
        <IconButton
          size="small"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          className={styles.closeButton}
          aria-label="Close"
        >
          <X size={15} weight="bold" />
        </IconButton>
      </Box>

      <Box className={styles.body}>{children}</Box>

      <Box
        className={styles.resizeRight}
        onPointerDown={startResize('right')}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />
      <Box
        className={styles.resizeBottom}
        onPointerDown={startResize('bottom')}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />
      <Box
        className={styles.resizeCorner}
        onPointerDown={startResize('corner')}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />
    </Box>,
    document.body,
  );
}
