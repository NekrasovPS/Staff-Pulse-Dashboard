import { TreeNode } from "../model/types";
import {
  AggregatedOrgNode,
  TreeAggregationResult,
} from "../model/aggregatedTypes";

interface SubtreeTotals {
  totalHeadcount: number;
  totalBudget: number;
  totalPerformanceProduct: number;
}

/**
 * Алгоритм агрегации показателей оргструктуры.
 * Выполняет обход в глубину (Post-order Traversal) за O(N), вычисляя
 * суммарные бюджеты, штат и взвешенную среднюю эффективность.
 */
export const aggregateOrgTree = (roots: TreeNode[]): TreeAggregationResult => {
  const flatAggregatedList: AggregatedOrgNode[] = [];
  const aggregatedMap = new Map<string, AggregatedOrgNode>();

  const processNode = (node: TreeNode): SubtreeTotals => {
    let subtreeHeadcount = node.headcount;
    let subtreeBudget = node.budget;
    let subtreePerfProduct = node.performance * node.headcount;

    for (const child of node.children) {
      const childTotals = processNode(child);
      subtreeHeadcount += childTotals.totalHeadcount;
      subtreeBudget += childTotals.totalBudget;
      subtreePerfProduct += childTotals.totalPerformanceProduct;
    }

    const weightedPerf =
      subtreeHeadcount > 0
        ? Math.round((subtreePerfProduct / subtreeHeadcount) * 10) / 10
        : node.performance;

    const aggregatedNode: AggregatedOrgNode = {
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      level: node.level,
      ownHeadcount: node.headcount,
      totalHeadcount: subtreeHeadcount,
      ownBudget: node.budget,
      totalBudget: subtreeBudget,
      ownPerformance: node.performance,
      weightedPerformance: weightedPerf,
      updatedAt: node.updatedAt,
      hasChildren: node.children.length > 0,
    };

    aggregatedMap.set(node.id, aggregatedNode);
    flatAggregatedList.push(aggregatedNode);

    return {
      totalHeadcount: subtreeHeadcount,
      totalBudget: subtreeBudget,
      totalPerformanceProduct: subtreePerfProduct,
    };
  };

  for (const root of roots) {
    processNode(root);
  }

  return {
    flatAggregatedList,
    aggregatedMap,
  };
};
