import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchOrgTree } from "./orgApi";
import { buildTree } from "../lib/buildTree";
import { TreeNode } from "../model/types";

export const ORG_TREE_QUERY_KEY = ["org-tree"] as const;

export const useOrgTree = () => {
  const query = useQuery({
    queryKey: ORG_TREE_QUERY_KEY,
    queryFn: ({ signal }) => fetchOrgTree(signal),
    staleTime: 5000, // Требование ТЗ: stale time 5 секунд
  });

  const tree = useMemo<TreeNode[]>(() => {
    if (!query.data) return [];
    return buildTree(query.data);
  }, [query.data]);

  return {
    ...query,
    tree,
  };
};
