# 🧬 Модель Данных и Алгоритмический Контракт[cite: 1]

## 1. Схема DTO (Контракт API бэкенда)[cite: 1]

Ответ эндпоинта `GET /api/org-tree` представляет собой плоский массив узлов[cite: 1]. Ответ строго валидируется на клиенте библиотекой Zod[cite: 1]:

```typescript
export interface OrgNodeDto {
  id: string;              // Уникальный идентификатор (например: "div-1-dept-2-team-1")
  name: string;            // Название подразделения
  parentId: string | null; // Ссылка на вышестоящий узел (null для корней)
  headcount: number;       // Собственная численность сотрудников подразделения
  budget: number;          // Собственный бюджет узла в рублях
  performance: number;     // Собственная эффективность от 0 до 100
  updatedAt: string;       // ISO timestamp последнего изменения
}
```

---

## 2. Иерархическая Модель Дерева (`TreeNode`)[cite: 1]

На клиенте плоский массив трансформируется в связное дерево:

```typescript
export interface TreeNode extends OrgNodeDto {
  children: TreeNode[]; // Дочерние узлы (подразделения)
  level: number;        // Уровень вложенности: 0 (Дивизион), 1 (Отдел), 2 (Команда)
}
```

---

## 3. Математика Агрегации Показателей[cite: 1]

Для аналитической таблицы каждый узел обогащается суммарными показателями своего поддерева (включая свои метрики и данные всех потомков)[cite: 1]:

```typescript
export interface AggregatedOrgNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  ownHeadcount: number;
  totalHeadcount: number;       // Суммарный штат (свой + все потомки)
  ownBudget: number;
  totalBudget: number;          // Суммарный бюджет (свой + все потомки)
  ownPerformance: number;
  weightedPerformance: number;  // Взвешенная эффективность поддерева
  updatedAt: string;
  hasChildren: boolean;
}
```

### Формулы расчета:

1. **Суммарная численность сотрудников:**
   $$\text{totalHeadcount} = \text{ownHeadcount} + \sum_{child \in \text{children}} child.\text{totalHeadcount}$$[cite: 1]

2. **Суммарный бюджет подразделения:**
   $$\text{totalBudget} = \text{ownBudget} + \sum_{child \in \text{children}} child.\text{totalBudget}$$[cite: 1]

3. **Взвешенная средняя эффективность (Weighted Performance):**
   Эффективность взвешивается по численности сотрудников каждого узла в поддереве[cite: 1]:
   $$\text{weightedPerformance} = \frac{\sum_{i \in \text{subtree}} (\text{performance}_i \times \text{headcount}_i)}{\sum_{i \in \text{subtree}} \text{headcount}_i}$$[cite: 1]
   *Округление производится до одного знака после запятой.*

---

## 4. Контракт WebSocket Патча и Инкрементальный Алгоритм[cite: 1]

Сервер вещает события мутации метрик узлов в реальном времени[cite: 1]:

```typescript
export interface WebSocketMessage {
  type: 'NODE_PATCH';
  payload: {
    id: string;             // ID измененного узла
    headcount?: number;     // Новое значение сотрудников (опционально)
    budget?: number;        // Новое значение бюджета (опционально)
    performance?: number;   // Новое значение эффективности (опционально)
    updatedAt: string;      // ISO timestamp
  };
}
```

### Алгоритм инкрементального пересчета (`patchNodeAndAncestors`)[cite: 1]:
Вместо полного обхода дерева алгоритм работает за время $O(H)$, где $H \le 3$:
1. Вычисляется дельта бюджета: $\Delta Budget = Budget_{new} - Budget_{old}$.
2. Вычисляется дельта взвешенного произведения эффективности:  
   $$\Delta Prod = (Perf_{new} \times Headcount_{new}) - (Perf_{old} \times Headcount_{old})$$
3. Обновляется сам целевой узел.
4. В цикле `while (currentParentId)` алгоритм поднимается строго вверх по цепочке предков до корня, прибавляя $\Delta Budget$, $\Delta Headcount$ и $\Delta Prod$ к родительским суммам без затрагивания параллельных веток дерева[cite: 1].