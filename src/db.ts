import Dexie, { type EntityTable } from 'dexie';

export interface Meal {
  id?: number;
  timestamp: Date;
  description: string;
  foods: string[];
}

export interface Symptom {
  id?: number;
  timestamp: Date;
  name: string;
  severity: number;
}

export interface Setting {
  key: string;
  value: string;
}

const db = new Dexie('gutlogDB') as Dexie & {
  meals: EntityTable<Meal, 'id'>;
  symptoms: EntityTable<Symptom, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

db.version(1).stores({
  meals: '++id, timestamp',
  symptoms: '++id, timestamp',
  settings: 'key',
});

export { db };

export async function addMeal(description: string, foods: string[], timestamp?: Date): Promise<number> {
  const id = await db.meals.add({
    timestamp: timestamp ?? new Date(),
    description,
    foods,
  });
  return id as number;
}

export async function addSymptom(name: string, severity: number, timestamp?: Date): Promise<number> {
  const id = await db.symptoms.add({
    timestamp: timestamp ?? new Date(),
    name,
    severity,
  });
  return id as number;
}

export async function getAllMeals(): Promise<Meal[]> {
  return db.meals.orderBy('timestamp').reverse().toArray();
}

export async function getAllSymptoms(): Promise<Symptom[]> {
  return db.symptoms.orderBy('timestamp').reverse().toArray();
}

export async function deleteMeal(id: number): Promise<void> {
  await db.meals.delete(id);
}

export async function deleteSymptom(id: number): Promise<void> {
  await db.symptoms.delete(id);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getSetting(key: string): Promise<string | undefined> {
  const record = await db.settings.get(key);
  return record?.value;
}
