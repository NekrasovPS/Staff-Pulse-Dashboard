import React from "react";
import styled from "styled-components";
import { useOrgTree } from "@/entities/org/api/useOrgTree";
import { TreeNodeItem } from "./TreeNodeItem";

const TreeCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  min-height: 500px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  font-size: 15px;
  color: ${({ $isError }) => ($isError ? "#dc2626" : "#64748b")};
  font-weight: 500;
`;

export const OrgTreeView: React.FC = () => {
  const { tree, isLoading, isError, error } = useOrgTree();

  if (isLoading) {
    return (
      <TreeCard>
        <StatusMessage>⏳ Загрузка организационного дерева...</StatusMessage>
      </TreeCard>
    );
  }

  if (isError) {
    return (
      <TreeCard>
        <StatusMessage $isError>
          ⚠️ Ошибка:{" "}
          {error instanceof Error ? error.message : "Неизвестный сбой"}
        </StatusMessage>
      </TreeCard>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <TreeCard>
        <StatusMessage>📭 Дерево подразделений пусто.</StatusMessage>
      </TreeCard>
    );
  }

  return (
    <TreeCard>
      <HeaderRow>
        <Title>Иерархия подразделений</Title>
      </HeaderRow>
      {tree.map((rootNode) => (
        <TreeNodeItem
          key={rootNode.id}
          node={rootNode}
          defaultExpandedLevel={1}
        />
      ))}
    </TreeCard>
  );
};
