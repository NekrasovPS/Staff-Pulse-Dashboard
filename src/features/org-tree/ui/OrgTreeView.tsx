import React from 'react';
import styled from 'styled-components';
import { useOrgTree } from '@/entities/org/api/useOrgTree';
import { TreeNodeItem } from './TreeNodeItem';

const TreeCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #0f172a;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  font-size: 15px;
  color: ${({ $isError }) => ($isError ? '#dc2626' : '#64748b')};
  font-weight: 500;
`;

export const OrgTreeView: React.FC = () => {
  const { tree, isLoading, isError, error } = useOrgTree();

  if (isLoading) {
    return (
      <TreeCard>
        <StatusMessage>⏳ Загрузка организационной структуры...</StatusMessage>
      </TreeCard>
    );
  }

  if (isError) {
    return (
      <TreeCard>
        <StatusMessage $isError>
          ⚠️ Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестный сбой'}
        </StatusMessage>
      </TreeCard>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <TreeCard>
        <StatusMessage>📭 Организационная структура пуста.</StatusMessage>
      </TreeCard>
    );
  }

  return (
    <TreeCard>
      <Title>Организационное дерево</Title>
      {tree.map((rootNode) => (
        <TreeNodeItem key={rootNode.id} node={rootNode} defaultExpandedLevel={1} />
      ))}
    </TreeCard>
  );
};