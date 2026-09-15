import React, { useState } from "react";
import styled from "styled-components";
import { TreeNode } from "@/entities/org/model/types";

interface TreeNodeItemProps {
  node: TreeNode;
  defaultExpandedLevel?: number;
}

const NodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  user-select: none;
`;

const NodeRow = styled.div<{ $level: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  padding-left: ${({ $level }) => `${$level * 24 + 12}px`};
  border-radius: 6px;
  transition: background-color 0.15s ease;
  cursor: pointer;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const ToggleIcon = styled.span<{ $isOpen: boolean; $hasChildren: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  color: #64748b;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(90deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
  visibility: ${({ $hasChildren }) => ($hasChildren ? "visible" : "hidden")};
`;

const NodeName = styled.span`
  font-weight: 500;
  font-size: 14px;
  color: #1e293b;
`;

const HeadcountBadge = styled.span`
  font-size: 12px;
  color: #64748b;
  background-color: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
`;

const PerformanceIndicator = styled.div<{ $score: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $score }) => {
    if ($score >= 75) return "#16a34a";
    if ($score >= 50) return "#d97706";
    return "#dc2626";
  }};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ $score }) => {
      if ($score >= 75) return "#16a34a";
      if ($score >= 50) return "#d97706";
      return "#dc2626";
    }};
  }
`;

const ChildrenContainer = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? "flex" : "none")};
  flex-direction: column;
`;

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  defaultExpandedLevel = 1,
}) => {
  // Уровень 0 (корни) и уровень 1 (дочерние узлы дивизионов) раскрыты по умолчанию
  const [isOpen, setIsOpen] = useState<boolean>(
    node.level <= defaultExpandedLevel,
  );

  const hasChildren = node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <NodeWrapper>
      <NodeRow $level={node.level} onClick={handleToggle}>
        <ToggleIcon $isOpen={isOpen} $hasChildren={hasChildren}>
          ▶
        </ToggleIcon>
        <NodeName>{node.name}</NodeName>
        <HeadcountBadge>{node.headcount} чел.</HeadcountBadge>
        <PerformanceIndicator $score={node.performance}>
          {node.performance}%
        </PerformanceIndicator>
      </NodeRow>

      {hasChildren && (
        <ChildrenContainer $isOpen={isOpen}>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              defaultExpandedLevel={defaultExpandedLevel}
            />
          ))}
        </ChildrenContainer>
      )}
    </NodeWrapper>
  );
};
