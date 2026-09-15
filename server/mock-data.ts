export interface FlatNodeRaw {
  id: string;
  name: string;
  parentId: string | null;
  headcount: number;
  budget: number;
  performance: number;
  updatedAt: string;
}

const divisions = [
  "Финтех",
  "Маркетплейс",
  "Облачные Сервисы",
  "AI Лаборатория",
];
const departmentsPerDiv = 3;
const teamsPerDept = 3;

export const generateOrgTree = (): FlatNodeRaw[] => {
  const nodes: FlatNodeRaw[] = [];
  const now = new Date().toISOString();

  divisions.forEach((divName, divIdx) => {
    const divId = `div-${divIdx + 1}`;
    nodes.push({
      id: divId,
      name: `Дивизион ${divName}`,
      parentId: null,
      headcount: 15,
      budget: 50_000_000 + divIdx * 10_000_000,
      performance: 82 + (divIdx % 10),
      updatedAt: now,
    });

    for (let deptIdx = 1; deptIdx <= departmentsPerDiv; deptIdx++) {
      const deptId = `${divId}-dept-${deptIdx}`;
      nodes.push({
        id: deptId,
        name: `Отдел разработки #${deptIdx} (${divName})`,
        parentId: divId,
        headcount: 20 + deptIdx * 2,
        budget: 12_000_000 + deptIdx * 1_500_000,
        performance: 65 + ((deptIdx * 7) % 30),
        updatedAt: now,
      });

      for (let teamIdx = 1; teamIdx <= teamsPerDept; teamIdx++) {
        const teamId = `${deptId}-team-${teamIdx}`;
        nodes.push({
          id: teamId,
          name: `Команда ${teamIdx} (${divName} / О${deptIdx})`,
          parentId: deptId,
          headcount: 5 + teamIdx,
          budget: 3_000_000 + teamIdx * 500_000,
          performance: 40 + ((teamIdx * 17) % 55),
          updatedAt: now,
        });
      }
    }
  });

  return nodes; // Генерирует ровно 4 + (4 * 3) + (4 * 3 * 3) = 4 + 12 + 36 = 52 узла (> 40 узлов, 3 уровня)
};
