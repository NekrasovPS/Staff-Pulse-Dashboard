export interface ParsedFilter {
  isAiParsed: boolean;
  explanation: string | null;
  targetLevel?: number; // 0 - дивизион, 1 - отдел, 2 - команда
  minPerformance?: number;
  maxPerformance?: number;
  minBudget?: number;
  maxBudget?: number;
  textFallback?: string;
}

/**
 * Интеллектуальный NLP-парсер естественного языка на клиенте.
 * Преобразует свободный запрос в структурированный фильтр параметров.
 * При отсутствии паттернов возвращает fallback на текстовый поиск.
 */
export const parseNaturalLanguageQuery = (rawInput: string): ParsedFilter => {
  const query = rawInput.toLowerCase().trim();

  if (!query) {
    return { isAiParsed: false, explanation: null };
  }

  const result: ParsedFilter = {
    isAiParsed: false,
    explanation: null,
  };

  const explanations: string[] = [];

  // 1. Распознавание уровня иерархии
  if (query.includes("дивизион")) {
    result.targetLevel = 0;
    explanations.push("уровень: Дивизионы");
  } else if (query.includes("отдел")) {
    result.targetLevel = 1;
    explanations.push("уровень: Отделы");
  } else if (query.includes("команд")) {
    result.targetLevel = 2;
    explanations.push("уровень: Команды");
  }

  // 2. Распознавание условий по эффективности (performance)
  const perfLessMatch = query.match(
    /(?:эффективност[ьяи]|перформанс|score)\s*(?:меньше|<|до|ниже)\s*(\d+)/,
  );
  if (perfLessMatch) {
    result.maxPerformance = parseInt(perfLessMatch[1], 10);
    explanations.push(`эффективность ≤ ${result.maxPerformance}%`);
  }

  const perfMoreMatch = query.match(
    /(?:эффективност[ьяи]|перформанс|score)\s*(?:больше|>|от|выше)\s*(\d+)/,
  );
  if (perfMoreMatch) {
    result.minPerformance = parseInt(perfMoreMatch[1], 10);
    explanations.push(`эффективность ≥ ${result.minPerformance}%`);
  }

  // 3. Распознавание условий по бюджету (budget)
  const budgetMillionsMatch = query.match(
    /(?:бюджет|кост)\s*(?:больше|>|от|выше)\s*(\d+)\s*(?:млн|миллион)/,
  );
  if (budgetMillionsMatch) {
    result.minBudget = parseInt(budgetMillionsMatch[1], 10) * 1_000_000;
    explanations.push(`бюджет ≥ ${budgetMillionsMatch[1]} млн руб.`);
  }

  const budgetLessMillionsMatch = query.match(
    /(?:бюджет|кост)\s*(?:меньше|<|до|ниже)\s*(\d+)\s*(?:млн|миллион)/,
  );
  if (budgetLessMillionsMatch) {
    result.maxBudget = parseInt(budgetLessMillionsMatch[1], 10) * 1_000_000;
    explanations.push(`бюджет ≤ ${budgetLessMillionsMatch[1]} млн руб.`);
  }

  // Если найдено хотя бы одно аналитическое условие - активируем AI-режим
  if (
    result.targetLevel !== undefined ||
    result.minPerformance !== undefined ||
    result.maxPerformance !== undefined ||
    result.minBudget !== undefined ||
    result.maxBudget !== undefined
  ) {
    result.isAiParsed = true;
    result.explanation = `✨ AI-фильтр: ${explanations.join(" • ")}`;
    return result;
  }

  // Фолбэк: обычный текстовый поиск
  return {
    isAiParsed: false,
    explanation: null,
    textFallback: query,
  };
};
