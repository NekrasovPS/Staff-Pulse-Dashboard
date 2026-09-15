import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useOrgTree } from "@/entities/org/api/useOrgTree";
import { aggregateOrgTree } from "@/entities/org/lib/aggregateTree";
import {
  AggregatedOrgNode,
  SortField,
  SortDirection,
} from "@/entities/org/model/aggregatedTypes";
import { formatCurrency } from "@/shared/lib/formatters";
import { useOrgUi } from "@/features/org-view/model/OrgUiContext";
import { useDebounce } from "@/shared/lib/useDebounce";

const TableWrapper = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
`;

const ControlsBar = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 360px;
  padding: 8px 14px;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
  }
`;

const CounterText = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
`;

const TableHeaderCell = styled.th<{ $align?: "left" | "right" | "center" }>`
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 16px;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  user-select: none;
  cursor: pointer;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const TableRow = styled.tr<{ $isSelected: boolean }>`
  cursor: pointer;
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#e0e7ff" : "transparent"};
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#c7d2fe" : "#f8fafc"};
  }

  &:not(:last-child) td {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const TableCell = styled.td<{ $align?: "left" | "right" | "center" }>`
  padding: 12px 16px;
  color: #1e293b;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
`;

const LevelBadge = styled.span<{ $level: number }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background-color: ${({ $level }) => {
    switch ($level) {
      case 0:
        return "#dbeafe";
      case 1:
        return "#fef3c7";
      default:
        return "#f3e8ff";
    }
  }};
  color: ${({ $level }) => {
    switch ($level) {
      case 0:
        return "#1e40af";
      case 1:
        return "#92400e";
      default:
        return "#6b21a8";
    }
  }};
`;

const PerformancePill = styled.span<{ $score: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 13px;
  background-color: ${({ $score }) => {
    if ($score >= 75) return "#dcfce7";
    if ($score >= 50) return "#fef3c7";
    return "#fee2e2";
  }};
  color: ${({ $score }) => {
    if ($score >= 75) return "#15803d";
    if ($score >= 50) return "#b45309";
    return "#b91c1c";
  }};
`;

const EmptyNotice = styled.div`
  padding: 48px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
`;

export const OrgTable: React.FC = () => {
  const { tree } = useOrgTree();
  const { selectedNodeId, setSelectedNodeId, searchQuery, setSearchQuery } =
    useOrgUi();

  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Дебаунс фильтра 250 мс согласно ТЗ
  const debouncedSearch = useDebounce(searchQuery, 250);

  // 1. Агрегация данных: запускается один раз при изменении дерева и мемоизируется
  const { flatAggregatedList } = useMemo(() => {
    if (!tree || tree.length === 0) {
      return { flatAggregatedList: [], aggregatedMap: new Map() };
    }
    return aggregateOrgTree(tree);
  }, [tree]);

  // 2. Обработка клика по заголовку столбца (одинарный - сортировка, двойной - инверсия)
  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleHeaderDoubleClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  // 3. Фильтрация по поисковому запросу
  const filteredList = useMemo(() => {
    if (!debouncedSearch.trim()) return flatAggregatedList;
    const query = debouncedSearch.toLowerCase().trim();
    return flatAggregatedList.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [flatAggregatedList, debouncedSearch]);

  // 4. Сортировка данных
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      let result = 0;
      if (sortField === "name") {
        result = a.name.localeCompare(b.name, "ru");
      } else {
        result = a[sortField] - b[sortField];
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredList, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const formatLevelName = (level: number) => {
    switch (level) {
      case 0:
        return "Дивизион";
      case 1:
        return "Отдел";
      default:
        return "Команда";
    }
  };

  return (
    <TableWrapper>
      <ControlsBar>
        <SearchInput
          type="text"
          placeholder="Фильтр по названию подразделения..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <CounterText>Строк: {sortedList.length}</CounterText>
      </ControlsBar>

      <TableContainer>
        {sortedList.length === 0 ? (
          <EmptyNotice>Подразделений по запросу не найдено</EmptyNotice>
        ) : (
          <StyledTable>
            <thead>
              <tr>
                <TableHeaderCell
                  onClick={() => handleHeaderClick("name")}
                  onDoubleClick={() => handleHeaderDoubleClick("name")}
                >
                  Подразделение{renderSortIndicator("name")}
                </TableHeaderCell>
                <TableHeaderCell
                  $align="center"
                  onClick={() => handleHeaderClick("level")}
                  onDoubleClick={() => handleHeaderDoubleClick("level")}
                >
                  Уровень{renderSortIndicator("level")}
                </TableHeaderCell>
                <TableHeaderCell
                  $align="right"
                  onClick={() => handleHeaderClick("totalHeadcount")}
                  onDoubleClick={() =>
                    handleHeaderDoubleClick("totalHeadcount")
                  }
                >
                  Всего сотрудников{renderSortIndicator("totalHeadcount")}
                </TableHeaderCell>
                <TableHeaderCell
                  $align="right"
                  onClick={() => handleHeaderClick("totalBudget")}
                  onDoubleClick={() => handleHeaderDoubleClick("totalBudget")}
                >
                  Бюджет суммарный{renderSortIndicator("totalBudget")}
                </TableHeaderCell>
                <TableHeaderCell
                  $align="center"
                  onClick={() => handleHeaderClick("weightedPerformance")}
                  onDoubleClick={() =>
                    handleHeaderDoubleClick("weightedPerformance")
                  }
                >
                  Средняя эффективность
                  {renderSortIndicator("weightedPerformance")}
                </TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((node: AggregatedOrgNode) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <TableRow
                    key={node.id}
                    $isSelected={isSelected}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <TableCell>
                      <strong>{node.name}</strong>
                    </TableCell>
                    <TableCell $align="center">
                      <LevelBadge $level={node.level}>
                        {formatLevelName(node.level)}
                      </LevelBadge>
                    </TableCell>
                    <TableCell $align="right">
                      {node.totalHeadcount} чел.
                    </TableCell>
                    <TableCell $align="right">
                      {formatCurrency(node.totalBudget)}
                    </TableCell>
                    <TableCell $align="center">
                      <PerformancePill $score={node.weightedPerformance}>
                        {node.weightedPerformance}%
                      </PerformancePill>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </StyledTable>
        )}
      </TableContainer>
    </TableWrapper>
  );
};
