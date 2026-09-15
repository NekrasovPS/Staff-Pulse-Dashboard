import { OrgNodeDto, TreeNode } from "../model/types";

/**
 * Преобразует плоский массив узлов в иерархическое дерево.
 * Временная сложность: O(N), пространственная сложность: O(N).
 */
export const buildTree = (flatNodes: OrgNodeDto[]): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 1-й проход: инициализируем мапу узлов с пустыми массивами children
  for (const node of flatNodes) {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      level: 0,
    });
  }

  // 2-й проход: связываем дочерние элементы с родителями и вычисляем уровень вложенности
  for (const node of flatNodes) {
    const current = nodeMap.get(node.id);
    if (!current) continue;

    if (node.parentId === null) {
      current.level = 0;
      roots.push(current);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        current.level = parent.level + 1;
        parent.children.push(current);
      } else {
        // Защита от битых связей: сирота поднимается в корень
        current.level = 0;
        roots.push(current);
      }
    }
  }

  // Обновляем корректные уровни вложенности рекурсивным проходом
  const applyLevels = (nodes: TreeNode[], level: number) => {
    for (const n of nodes) {
      n.level = level;
      if (n.children.length > 0) {
        applyLevels(n.children, level + 1);
      }
    }
  };

  applyLevels(roots, 0);

  return roots;
};
