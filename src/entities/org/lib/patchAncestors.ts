import { AggregatedOrgNode } from "../model/aggregatedTypes";
import { NodePatchPayload } from "../model/patchTypes";

/**
 * Инкрементальный пересчет дерева за O(H), где H - глубина дерева.
 * Вычисляет дельты показателей и поднимает их вверх по цепочке parentId,
 * не пересчитывая всё дерево заново (требование ТЗ).
 */
export const patchNodeAndAncestors = (
  currentMap: Map<string, AggregatedOrgNode>,
  patch: NodePatchPayload,
): {
  updatedMap: Map<string, AggregatedOrgNode>;
  updatedList: AggregatedOrgNode[];
} => {
  const newMap = new Map<string, AggregatedOrgNode>(currentMap);
  const targetNode = newMap.get(patch.id);

  if (!targetNode) {
    return {
      updatedMap: currentMap,
      updatedList: Array.from(currentMap.values()),
    };
  }

  // 1. Вычисляем дельты собственных показателей
  const oldHeadcount = targetNode.ownHeadcount;
  const newHeadcount = patch.headcount ?? oldHeadcount;
  const deltaHeadcount = newHeadcount - oldHeadcount;

  const oldBudget = targetNode.ownBudget;
  const newBudget = patch.budget ?? oldBudget;
  const deltaBudget = newBudget - oldBudget;

  const oldPerformance = targetNode.ownPerformance;
  const newPerformance = patch.performance ?? oldPerformance;

  // Дельта взвешенного произведения: (P_new * H_new) - (P_old * H_old)
  const oldPerfProduct = oldPerformance * oldHeadcount;
  const newPerfProduct = newPerformance * newHeadcount;
  const deltaPerfProduct = newPerfProduct - oldPerfProduct;

  // 2. Обновляем целевой узел
  const updatedTarget: AggregatedOrgNode = {
    ...targetNode,
    ownHeadcount: newHeadcount,
    totalHeadcount: targetNode.totalHeadcount + deltaHeadcount,
    ownBudget: newBudget,
    totalBudget: targetNode.totalBudget + deltaBudget,
    ownPerformance: newPerformance,
    updatedAt: patch.updatedAt,
  };

  // Если у узла нет дочерних, взвешенная эффективность равна собственной
  if (!targetNode.hasChildren) {
    updatedTarget.weightedPerformance = newPerformance;
  } else {
    // Если есть дочерние, пересчитываем взвешенную через дельту
    const previousSubtreeProduct =
      targetNode.weightedPerformance * targetNode.totalHeadcount;
    const newSubtreeProduct = previousSubtreeProduct + deltaPerfProduct;
    updatedTarget.weightedPerformance =
      updatedTarget.totalHeadcount > 0
        ? Math.round((newSubtreeProduct / updatedTarget.totalHeadcount) * 10) /
          10
        : newPerformance;
  }

  newMap.set(targetNode.id, updatedTarget);

  // 3. Поднимаемся по цепочке предков вверх до корня: O(H)
  let currentParentId = targetNode.parentId;

  while (currentParentId) {
    const parentNode = newMap.get(currentParentId);
    if (!parentNode) break;

    const updatedParentHeadcount = parentNode.totalHeadcount + deltaHeadcount;
    const updatedParentBudget = parentNode.totalBudget + deltaBudget;

    const previousParentPerfProduct =
      parentNode.weightedPerformance * parentNode.totalHeadcount;
    const newParentPerfProduct = previousParentPerfProduct + deltaPerfProduct;

    const updatedParentWeightedPerf =
      updatedParentHeadcount > 0
        ? Math.round((newParentPerfProduct / updatedParentHeadcount) * 10) / 10
        : parentNode.ownPerformance;

    const updatedParent: AggregatedOrgNode = {
      ...parentNode,
      totalHeadcount: updatedParentHeadcount,
      totalBudget: updatedParentBudget,
      weightedPerformance: updatedParentWeightedPerf,
      updatedAt: patch.updatedAt,
    };

    newMap.set(parentNode.id, updatedParent);
    currentParentId = parentNode.parentId;
  }

  return {
    updatedMap: newMap,
    updatedList: Array.from(newMap.values()),
  };
};
