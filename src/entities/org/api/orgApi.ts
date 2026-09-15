import { OrgTreeResponseSchema, OrgNodeDto } from "../model/types";

export const fetchOrgTree = async (
  signal?: AbortSignal,
): Promise<OrgNodeDto[]> => {
  const response = await fetch("/api/org-tree", {
    credentials: "same-origin",
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Ошибка загрузки: ${response.status} ${response.statusText}`,
    );
  }

  const rawData = await response.json();

  // Валидация схемы через Zod. Бросает исключение при несоответствии контракта
  const parseResult = OrgTreeResponseSchema.safeParse(rawData);

  if (!parseResult.success) {
    console.error(
      "Ошибка валидации контракта API:",
      parseResult.error.format(),
    );
    throw new Error(
      "Данные сервера не соответствуют ожидаемой схеме OrgTreeResponseSchema",
    );
  }

  return parseResult.data;
};
