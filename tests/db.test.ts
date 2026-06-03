import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  addMeal,
  addSymptom,
  getAllMeals,
  getAllSymptoms,
  deleteMeal,
  deleteSymptom,
  setSetting,
  getSetting,
} from '../src/db';
beforeEach(async () => {
  await db.meals.clear();
  await db.symptoms.clear();
  await db.settings.clear();
});

describe('db schema', () => {
  it('has meals, symptoms, and settings tables', () => {
    expect(db.meals).toBeDefined();
    expect(db.symptoms).toBeDefined();
    expect(db.settings).toBeDefined();
  });
});

describe('meal operations', () => {
  it('adds and retrieves a meal', async () => {
    const id = await addMeal('chicken sandwich', ['chicken', 'bread', 'gluten']);
    expect(id).toBeGreaterThan(0);

    const meals = await getAllMeals();
    expect(meals.length).toBe(1);
    expect(meals[0].description).toBe('chicken sandwich');
    expect(meals[0].foods).toContain('chicken');
    expect(meals[0].foods).toContain('bread');
  });

  it('uses current timestamp when none provided', async () => {
    const before = Date.now();
    await addMeal('salad', ['lettuce']);
    const meals = await getAllMeals();
    const ts = new Date(meals[0].timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(Date.now());
  });

  it('uses custom timestamp when provided', async () => {
    const custom = new Date('2025-06-15T10:30:00');
    await addMeal('oatmeal', ['cereal'], custom);
    const meals = await getAllMeals();
    expect(new Date(meals[0].timestamp).toISOString()).toBe(custom.toISOString());
  });

  it('deletes a meal', async () => {
    const id = await addMeal('pizza', ['pizza', 'cheese']);
    await deleteMeal(id);
    const meals = await getAllMeals();
    expect(meals.length).toBe(0);
  });

  it('returns meals in reverse chronological order', async () => {
    await addMeal('early', ['rice'], new Date('2025-01-01'));
    await addMeal('late', ['pasta'], new Date('2025-06-01'));
    const meals = await getAllMeals();
    expect(meals[0].description).toBe('late');
    expect(meals[1].description).toBe('early');
  });
});

describe('symptom operations', () => {
  it('adds and retrieves a symptom', async () => {
    const id = await addSymptom('headache', 4);
    expect(id).toBeGreaterThan(0);

    const symptoms = await getAllSymptoms();
    expect(symptoms.length).toBe(1);
    expect(symptoms[0].name).toBe('headache');
    expect(symptoms[0].severity).toBe(4);
  });

  it('deletes a symptom', async () => {
    const id = await addSymptom('bloating', 2);
    await deleteSymptom(id);
    const symptoms = await getAllSymptoms();
    expect(symptoms.length).toBe(0);
  });
});

describe('settings operations', () => {
  it('sets and gets a setting', async () => {
    await setSetting('timeWindow', '48');
    const value = await getSetting('timeWindow');
    expect(value).toBe('48');
  });

  it('returns undefined for missing setting', async () => {
    const value = await getSetting('nonexistent');
    expect(value).toBeUndefined();
  });

  it('overwrites existing setting', async () => {
    await setSetting('theme', 'light');
    await setSetting('theme', 'dark');
    const value = await getSetting('theme');
    expect(value).toBe('dark');
  });
});
