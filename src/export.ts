import { getAllMeals, getAllSymptoms, addMeal, addSymptom } from './db';
import type { Meal, Symptom } from './db';

export interface ExportData {
  version: 1;
  exportedAt: string;
  meals: Array<{
    timestamp: string;
    description: string;
    foods: string[];
  }>;
  symptoms: Array<{
    timestamp: string;
    name: string;
    severity: number;
  }>;
}

/**
 * Export all meals and symptoms as a JSON blob.
 * Strips internal IDs so the export is portable.
 */
export async function exportAll(): Promise<ExportData> {
  const [meals, symptoms] = await Promise.all([getAllMeals(), getAllSymptoms()]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    meals: meals.map(m => ({
      timestamp: new Date(m.timestamp).toISOString(),
      description: m.description,
      foods: m.foods,
    })),
    symptoms: symptoms.map(s => ({
      timestamp: new Date(s.timestamp).toISOString(),
      name: s.name,
      severity: s.severity,
    })),
  };
}

/**
 * Download exported data as a .json file via a temporary anchor element.
 */
export async function downloadExport(): Promise<void> {
  const data = await exportAll();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gutlog-export-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate an import payload. Returns null on success or an error string.
 */
export function validateImport(data: unknown): string | null {
  if (data == null || typeof data !== 'object') {
    return 'Import data must be a JSON object.';
  }
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) {
    return 'Unsupported export version. Expected version 1.';
  }
  if (!Array.isArray(obj.meals)) {
    return 'Missing or invalid "meals" array.';
  }
  if (!Array.isArray(obj.symptoms)) {
    return 'Missing or invalid "symptoms" array.';
  }
  for (let i = 0; i < obj.meals.length; i++) {
    const m = obj.meals[i] as Record<string, unknown>;
    if (typeof m.timestamp !== 'string') return `meals[${i}].timestamp must be a string.`;
    if (typeof m.description !== 'string') return `meals[${i}].description must be a string.`;
    if (!Array.isArray(m.foods)) return `meals[${i}].foods must be an array.`;
  }
  for (let i = 0; i < obj.symptoms.length; i++) {
    const s = obj.symptoms[i] as Record<string, unknown>;
    if (typeof s.timestamp !== 'string') return `symptoms[${i}].timestamp must be a string.`;
    if (typeof s.name !== 'string') return `symptoms[${i}].name must be a string.`;
    if (typeof s.severity !== 'number') return `symptoms[${i}].severity must be a number.`;
  }
  return null;
}

/**
 * Import meals and symptoms from a validated ExportData payload.
 * Returns the count of records imported.
 */
export async function importData(data: ExportData): Promise<{ meals: number; symptoms: number }> {
  let mealCount = 0;
  let symptomCount = 0;

  for (const m of data.meals) {
    await addMeal(m.description, m.foods, new Date(m.timestamp));
    mealCount++;
  }
  for (const s of data.symptoms) {
    await addSymptom(s.name, s.severity, new Date(s.timestamp));
    symptomCount++;
  }

  return { meals: mealCount, symptoms: symptomCount };
}
