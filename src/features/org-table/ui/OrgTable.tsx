import React, { useMemo, useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useOrgTree } from "@/entities/org/api/useOrgTree";
import { aggregateOrgTree } from "@/entities/org/lib/aggregateTree";
import { patchNodeAndAncestors } from "@/entities/org/lib/patchAncestors";
import {
  AggregatedOrgNode,
  SortField,
  SortDirection,
} from "@/entities/org/model/aggregatedTypes";
import { formatCurrency } from "@/shared/lib/formatters";
import { useOrgUi } from "@/features/org-view/model/OrgUiContext";
import { useDebounce } from "@/shared/lib/useDebounce";
import { parseNaturalLanguageQuery } from "@/features/org-search/lib/aiSearchParser";
import { HighlightCell } from "./HighlightCell";

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
  outline: none;

  &:focus-visible {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const ControlsBar = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SearchRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 9px 14px;
  padding-right: 36px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
  }
`;

const AiBadge = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  user-select: none;
`;

const AiFilterHint = styled.div`
  font-size: 12px;
  color: #4338ca;
  background-color: #e0e7ff;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  align-self: flex-start;
`;

const KeyboardHint = styled.span`
  font-size: 12px;
  color: #94a3b8;
  display: none;

  @media (min-width: 1024px) {
    display: inline;
  }
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
  z-index: 10;

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
  const {
    selectedNodeId,
    setSelectedNodeId,
    searchQuery,
    setSearchQuery,
    lastPatch,
  } = useOrgUi();

  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const aggregatedMapRef = useRef<Map<string, AggregatedOrgNode>>(new Map());
  const [aggregatedList, setAggregatedList] = useState<AggregatedOrgNode[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const debouncedSearch = useDebounce(searchQuery, 250);

  // Первичная агрегация данных
  useEffect(() => {
    if (tree && tree.length > 0 && aggregatedMapRef.current.size === 0) {
      const { flatAggregatedList, aggregatedMap } = aggregateOrgTree(tree);
      aggregatedMapRef.current = aggregatedMap;
      setAggregatedList(flatAggregatedList);
    }
  }, [tree]);

  // Инкрементальный пересчет при live-патче
  useEffect(() => {
    if (lastPatch && aggregatedMapRef.current.size > 0) {
      const { updatedMap, updatedList } = patchNodeAndAncestors(
        aggregatedMapRef.current,
        lastPatch,
      );
      aggregatedMapRef.current = updatedMap;
      setAggregatedList(updatedList);
    }
  }, [lastPatch]);

  // AI NLP парсинг поисковой строки
  const parsedFilter = useMemo(() => {
    return parseNaturalLanguageQuery(debouncedSearch);
  }, [debouncedSearch]);

  // Фильтрация с поддержкой AI-параметров или текстового fallback
  const filteredList = useMemo(() => {
    if (!debouncedSearch.trim()) return aggregatedList;

    if (parsedFilter.isAiParsed) {
      return aggregatedList.filter((node) => {
        if (
          parsedFilter.targetLevel !== undefined &&
          node.level !== parsedFilter.targetLevel
        ) {
          return false;
        }
        if (
          parsedFilter.maxPerformance !== undefined &&
          node.weightedPerformance > parsedFilter.maxPerformance
        ) {
          return false;
        }
        if (
          parsedFilter.minPerformance !== undefined &&
          node.weightedPerformance < parsedFilter.minPerformance
        ) {
          return false;
        }
        if (
          parsedFilter.minBudget !== undefined &&
          node.totalBudget < parsedFilter.minBudget
        ) {
          return false;
        }
        if (
          parsedFilter.maxBudget !== undefined &&
          node.totalBudget > parsedFilter.maxBudget
        ) {
          return false;
        }
        return true;
      });
    }

    // Текстовый fallback
    const textQuery = (
      parsedFilter.textFallback || debouncedSearch
    ).toLowerCase();
    return aggregatedList.filter((item) =>
      item.name.toLowerCase().includes(textQuery),
    );
  }, [aggregatedList, debouncedSearch, parsedFilter]);

  // Сортировка
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (sortedList.length === 0) return;

    const currentIndex = sortedList.findIndex(
      (item) => item.id === selectedNodeId,
    );

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const nextIndex =
          currentIndex < sortedList.length - 1 ? currentIndex + 1 : 0;
        const nextId = sortedList[nextIndex].id;
        setSelectedNodeId(nextId);
        rowRefs.current.get(nextId)?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : sortedList.length - 1;
        const prevId = sortedList[prevIndex].id;
        setSelectedNodeId(prevId);
        rowRefs.current.get(prevId)?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "Home": {
        e.preventDefault();
        const firstId = sortedList[0].id;
        setSelectedNodeId(firstId);
        rowRefs.current.get(firstId)?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "End": {
        e.preventDefault();
        const lastId = sortedList[sortedList.length - 1].id;
        setSelectedNodeId(lastId);
        rowRefs.current.get(lastId)?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "Enter": {
        if (selectedNodeId) {
          rowRefs.current
            .get(selectedNodeId)
            ?.scrollIntoView({ block: "center" });
        }
        break;
      }
    }
  };

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleHeaderDoubleClick = (field: SortField) => {
    setSortField(field);
    setSortDirection("desc"); // Двойной клик всегда гарантирует обратную сортировку по ТЗ
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <TableWrapper
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Таблица оргструктуры с поддержкой клавиатуры"
    >
      <ControlsBar>
        <SearchRow>
          <SearchInputWrapper>
            <SearchInput
              type="text"
              placeholder="Поиск или запрос: «отделы с эффективностью ниже 70»..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <AiBadge title="Поддерживает поиск на естественном языке">
              ✨
            </AiBadge>
          </SearchInputWrapper>
          <KeyboardHint>Строк: {sortedList.length}</KeyboardHint>
        </SearchRow>

        {parsedFilter.explanation && (
          <AiFilterHint>{parsedFilter.explanation}</AiFilterHint>
        )}
      </ControlsBar>

      <TableContainer>
        {sortedList.length === 0 ? (
          <EmptyNotice>
            Подразделений по заданному условию не найдено
          </EmptyNotice>
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
                    ref={(el) => {
                      if (el) rowRefs.current.set(node.id, el);
                      else rowRefs.current.delete(node.id);
                    }}
                    $isSelected={isSelected}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <TableCell>
                      <strong>{node.name}</strong>
                    </TableCell>
                    <TableCell $align="center">
                      <LevelBadge $level={node.level}>
                        {node.level === 0
                          ? "Дивизион"
                          : node.level === 1
                            ? "Отдел"
                            : "Команда"}
                      </LevelBadge>
                    </TableCell>

                    <HighlightCell value={node.totalHeadcount} align="right">
                      {node.totalHeadcount} чел.
                    </HighlightCell>

                    <HighlightCell value={node.totalBudget} align="right">
                      {formatCurrency(node.totalBudget)}
                    </HighlightCell>

                    <HighlightCell
                      value={node.weightedPerformance}
                      align="center"
                    >
                      <PerformancePill $score={node.weightedPerformance}>
                        {node.weightedPerformance}%
                      </PerformancePill>
                    </HighlightCell>
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
