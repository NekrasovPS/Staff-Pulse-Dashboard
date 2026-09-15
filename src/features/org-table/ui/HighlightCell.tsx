import React, { useRef, useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

const cellFadeOut = keyframes`
  0% {
    background-color: rgba(254, 240, 138, 0.85); /* Мягкий янтарно-желтый акцент */
  }
  100% {
    background-color: transparent;
  }
`;

const StyledTd = styled.td<{ $isFlashing: boolean; $align?: 'left' | 'right' | 'center' }>`
  padding: 12px 16px;
  color: #1e293b;
  text-align: ${({ $align }) => $align || 'left'};
  white-space: nowrap;

  ${({ $isFlashing }) =>
    $isFlashing &&
    css`
      animation: ${cellFadeOut} 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

interface HighlightCellProps {
  value: string | number;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

/**
 * Ячейка таблицы, отслеживающая изменение переданного значения.
 * При изменении числа мгновенно запускает fade-out анимацию на 1.5 секунды.
 */
export const HighlightCell: React.FC<HighlightCellProps> = ({
  value,
  children,
  align,
}) => {
  const isFirstRender = useRef(true);
  const prevValueRef = useRef(value);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    // Пропускаем первичный рендер, чтобы таблица не вспыхивала при загрузке
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = value;
      return;
    }

    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setIsFlashing(false);

      // requestAnimationFrame гарантирует перезапуск CSS-анимации без задержек
      const animFrame = requestAnimationFrame(() => {
        setIsFlashing(true);
      });

      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 1500);

      return () => {
        cancelAnimationFrame(animFrame);
        clearTimeout(timer);
      };
    }
  }, [value]);

  return (
    <StyledTd $isFlashing={isFlashing} $align={align}>
      {children}
    </StyledTd>
  );
};