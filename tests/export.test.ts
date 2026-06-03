import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, addMeal, addSymptom } from '../src/db';
import { exportAll, validateImport, importData, type ExportData } from '../src/export';

beforeEach(async () => {
  await db.meals.clear();
  await db.symptoms.clear();
  await db.settings.clear();
});

describe('exportAll', () => {
  it('exports empty data when no records exist', async () => {
    const data = await exportAll();
    expect(data.version).toBe(1);
    expect(data.meals).toHaveLength(0);
    expect(data.symptoms).toHaveLength(0);
    expect(data.exportedAt).toBeTruthy();
  });

  it('exports meals and symptoms', async () => {
    await addMeal('chicken and rice', ['chicken', 'rice'], new Date('2025-03-10T12:00:00'));
    await addSymptom('bloating', 3, new Date('2025-03-10T18:00:00'));
    const data = await exportAll();
    expect(data.meals).toHaveLength(1);
    expect(data.symptoms).toHaveLength(1);
    expect(data.meals[0].description).toBe('chicken and rice');
    expect(data.meals[0].foods).toContain('chicken');
    expect(data.symptoms[0].name).toBe('bloating');
    expect(data.symptoms[0].severity).toBe(3);
  });

  it('strips internal IDs from exported records', async () => {
    await addMeal('pasta', ['pasta'], new Date('2025-03-10T12:00:00'));
    const data = await exportAll();
    const raw = data.meals[0] as Record<string, unknown>;
    expect(raw.id).toBeUndefined();
  });
});

describe('validateImport', () => {
  it('returns null for valid data', () => {
    const valid: ExportData = {
      version: 1,
      exportedAt: '2025-03-10T00:00:00.000Z',
      meals: [{ timestamp: '2025-03-10T12:00:00.000Z', description: 'eggs', foods: ['eggs'] }],
      symptoms: [{ timestamp: '2025-03-10T18:00:00.000Z', name: 'headache', severity: 2 }],
    };
    expect(validateImport(valid)).toBeNull();
  });

  it('rejects null input', () => {
    expect(validateImport(null)).toBe('Import data must be a JSON object.');
  });

  it('rejects wrong version', () => {
    expect(validateImport({ version: 99, meals: [], symptoms: [] })).toBe('Unsupported export version. Expected version 1.');
  });

  it('rejects missing meals array', () => {
    expect(validateImport({ version: 1, symptoms: [] })).toBe('Missing or invalid "meals" array.');
  });

  it('rejects missing symptoms array', () => {
    expect(validateImport({ version: 1, meals: [] })).toBe('Missing or invalid "symptoms" array.');
  });

  it('rejects meal with invalid timestamp', () => {
    const bad = { version: 1, meals: [{ timestamp: 123, description: 'x', foods: [] }], symptoms: [] };
    expect(validateImport(bad)).toBe('meals[0].timestamp must be a string.');
  });

  it('rejects symptom with invalid severity', () => {
    const bad = {
      version: 1,
      meals: [],
      symptoms: [{ timestamp: '2025-01-01', name: 'headache', severity: 'high' }],
    };
    expect(validateImport(bad)).toBe('symptoms[0].severity must be a number.');
  });
});

describe('importData', () => {
  it('imports meals and symptoms into the database', async () => {
    const data: ExportData = {
      version: 1,
      exportedAt: '2025-03-10T00:00:00.000Z',
      meals: [
        { timestamp: '2025-03-10T12:00:00.000Z', description: 'pizza', foods: ['pizza', 'cheese'] },
        { timestamp: '2025-03-11T12:00:00.000Z', description: 'salad', foods: ['lettuce'] },
      ],
      symptoms: [
        { timestamp: '2025-03-10T18:00:00.000Z', name: 'bloating', severity: 4 },
      ],
    };
    const result = await importData(data);
    expect(result.meals).toBe(2);
    expect(result.symptoms).toBe(1);

    const meals = await db.meals.toArray();
    expect(meals).toHaveLength(2);
    const symptoms = await db.symptoms.toArray();
    expect(symptoms).toHaveLength(1);
  });

  it('imports into an already populated database without overwriting', async () => {
    await addMeal('existing meal', ['rice']);
    const data: ExportData = {
      version: 1,
      exportedAt: '2025-03-10T00:00:00.000Z',
      meals: [{ timestamp: '2025-03-10T12:00:00.000Z', description: 'new meal', foods: ['pasta'] }],
      symptoms: [],
    };
    await importData(data);
    const meals = await db.meals.toArray();
    expect(meals).toHaveLength(2);
  });
});
