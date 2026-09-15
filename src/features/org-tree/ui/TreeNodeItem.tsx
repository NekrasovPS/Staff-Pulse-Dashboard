import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { TreeNode } from "@/entities/org/model/types";
import { useOrgUi } from "@/features/org-view/model/OrgUiContext";

interface TreeNodeItemProps {
  node: TreeNode;
  defaultExpandedLevel?: number;
}

const NodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  user-select: none;
`;

const NodeRow = styled.div<{ $level: number; $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  padding-left: ${({ $level }) => `${$level * 22 + 12}px`};
  border-radius: 6px;
  transition: all 0.15s ease;
  cursor: pointer;
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#e0e7ff" : "transparent"};
  border-left: 3px solid
    ${({ $isSelected }) => ($isSelected ? "#4f46e5" : "transparent")};

  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#c7d2fe" : "#f1f5f9"};
  }
`;

const ToggleButton = styled.button<{ $isOpen: boolean; $hasChildren: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  color: #64748b;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(90deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
  visibility: ${({ $hasChildren }) => ($hasChildren ? "visible" : "hidden")};

  &:hover {
    color: #1e293b;
  }
`;

const NodeName = styled.span`
  font-weight: 500;
  font-size: 14px;
  color: #1e293b;
  flex: 1;
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
  const { selectedNodeId, setSelectedNodeId } = useOrgUi();
  const [isOpen, setIsOpen] = useState<boolean>(
    node.level <= defaultExpandedLevel,
  );

  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  // Автоматическое раскрытие ветви, если внутри находится выбранный узел
  useEffect(() => {
    const isDescendantSelected = (n: TreeNode, targetId: string): boolean => {
      return n.children.some(
        (c) => c.id === targetId || isDescendantSelected(c, targetId),
      );
    };

    if (selectedNodeId && isDescendantSelected(node, selectedNodeId)) {
      setIsOpen(true);
    }
  }, [selectedNodeId, node]);

  const handleRowClick = () => {
    setSelectedNodeId(node.id);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <NodeWrapper>
      <NodeRow
        $level={node.level}
        $isSelected={isSelected}
        onClick={handleRowClick}
      >
        <ToggleButton
          type="button"
          $isOpen={isOpen}
          $hasChildren={hasChildren}
          onClick={handleToggleClick}
          aria-label={isOpen ? "Свернуть ветку" : "Развернуть ветку"}
        >
          ▶
        </ToggleButton>
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
