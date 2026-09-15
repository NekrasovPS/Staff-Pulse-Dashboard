import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ConnectionStatus } from '../api/useOrgWebSocket';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
`;

const Badge = styled.div<{ $status: ConnectionStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;

  ${({ $status }) => {
    switch ($status) {
      case 'connected':
        return css`
          background-color: #f0fdf4;
          color: #166534;
          border-color: #bbf7d0;
        `;
      case 'reconnecting':
        return css`
          background-color: #fefce8;
          color: #854d0e;
          border-color: #fef08a;
        `;
      default:
        return css`
          background-color: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        `;
    }
  }}
`;

const StatusDot = styled.span<{ $status: ConnectionStatus }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'connected':
        return '#22c55e';
      case 'reconnecting':
        return '#eab308';
      default:
        return '#ef4444';
    }
  }};

  ${({ $status }) =>
    $status === 'reconnecting' &&
    css`
      animation: ${pulse} 1.2s infinite ease-in-out;
    `}
`;

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Live Соединение';
      case 'reconnecting':
        return 'Восстановление...';
      default:
        return 'Офлайн';
    }
  };

  return (
    <Badge $status={status}>
      <StatusDot $status={status} />
      {getStatusLabel()}
    </Badge>
  );
};