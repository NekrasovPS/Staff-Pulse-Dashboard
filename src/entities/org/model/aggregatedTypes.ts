import { TreeNode } from "./types";

export interface AggregatedOrgNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  ownHeadcount: number;
  totalHeadcount: number;
  ownBudget: number;
  totalBudget: number;
  ownPerformance: number;
  weightedPerformance: number;
  updatedAt: string;
  hasChildren: boolean;
}

export interface TreeAggregationResult {
  flatAggregatedList: AggregatedOrgNode[];
  aggregatedMap: Map<string, AggregatedOrgNode>;
}

export type SortField =
  | "name"
  | "level"
  | "totalHeadcount"
  | "totalBudget"
  | "weightedPerformance";
export type SortDirection = "asc" | "desc";
