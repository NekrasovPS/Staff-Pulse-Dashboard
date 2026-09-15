import { describe, it, expect } from "vitest";
import { TreeNode } from "../model/types";
import { aggregateOrgTree } from "./aggregateTree";

describe("aggregateOrgTree algorithm", () => {
  it("корректно агрегирует суммарные показатели и взвешенную эффективность снизу вверх", () => {
    // Создаем тестовое дерево: Дивизион -> Отдел -> 2 Команды
    const mockTree: TreeNode[] = [
      {
        id: "div-1",
        name: "Дивизион Инноваций",
        parentId: null,
        level: 0,
        headcount: 10,
        budget: 10_000_000,
        performance: 80,
        updatedAt: "2026-09-15T10:00:00.000Z",
        children: [
          {
            id: "dept-1",
            name: "Отдел AI",
            parentId: "div-1",
            level: 1,
            headcount: 20,
            budget: 5_000_000,
            performance: 90,
            updatedAt: "2026-09-15T10:00:00.000Z",
            children: [
              {
                id: "team-1",
                name: "Команда Core",
                parentId: "dept-1",
                level: 2,
                headcount: 10,
                budget: 2_000_000,
                performance: 100,
                updatedAt: "2026-09-15T10:00:00.000Z",
                children: [],
              },
              {
                id: "team-2",
                name: "Команда Research",
                parentId: "dept-1",
                level: 2,
                headcount: 10,
                budget: 3_000_000,
                performance: 60,
                updatedAt: "2026-09-15T10:00:00.000Z",
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const { aggregatedMap } = aggregateOrgTree(mockTree);

    // 1. Проверка листовых узлов (Команды)
    const team1 = aggregatedMap.get("team-1")!;
    expect(team1.totalHeadcount).toBe(10);
    expect(team1.totalBudget).toBe(2_000_000);
    expect(team1.weightedPerformance).toBe(100);

    const team2 = aggregatedMap.get("team-2")!;
    expect(team2.totalHeadcount).toBe(10);
    expect(team2.totalBudget).toBe(3_000_000);
    expect(team2.weightedPerformance).toBe(60);

    // 2. Проверка узла 1-го уровня (Отдел):
    // Штат = 20 (свой) + 10 (team1) + 10 (team2) = 40 чел.
    // Бюджет = 5млн + 2млн + 3млн = 10_000_000 руб.
    // Взвешенная эффективность = (20*90 + 10*100 + 10*60) / 40 = (1800 + 1000 + 600) / 40 = 3400 / 40 = 85.0%
    const dept1 = aggregatedMap.get("dept-1")!;
    expect(dept1.totalHeadcount).toBe(40);
    expect(dept1.totalBudget).toBe(10_000_000);
    expect(dept1.weightedPerformance).toBe(85);

    // 3. Проверка корневого узла (Дивизион):
    // Штат = 10 (свой) + 40 (дети) = 50 чел.
    // Бюджет = 10млн + 10млн = 20_000_000 руб.
    // Взвешенная эффективность = (10*80 + 3400) / 50 = (800 + 3400) / 50 = 4200 / 50 = 84.0%
    const div1 = aggregatedMap.get("div-1")!;
    expect(div1.totalHeadcount).toBe(50);
    expect(div1.totalBudget).toBe(20_000_000);
    expect(div1.weightedPerformance).toBe(84);
  });
});
