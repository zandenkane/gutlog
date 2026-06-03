import type { Meal, Symptom } from './db';
import { fisherExact, oddsRatioCI } from './stats';

export interface CorrelationResult {
  food: string;
  symptom: string;
  pValue: number;
  oddsRatio: number;
  /** 95% confidence interval for the odds ratio */
  ciLower: number;
  ciUpper: number;
  /** Contingency table cells */
  a: number; // food + symptom
  b: number; // food + no symptom
  c: number; // no food + symptom
  d: number; // no food + no symptom
}

/**
 * Determine the set of calendar days covered by the data.
 * Returns a sorted array of date strings (YYYY-MM-DD).
 */
function getCalendarDays(meals: Meal[], symptoms: Symptom[]): string[] {
  const days = new Set<string>();
  for (const m of meals) {
    days.add(toDateKey(m.timestamp));
  }
  for (const s of symptoms) {
    days.add(toDateKey(s.timestamp));
  }
  return Array.from(days).sort();
}

function toDateKey(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

/**
 * Check if symptom timestamp falls within `windowHours` after meal timestamp.
 */
function isWithinWindow(mealTime: Date, symptomTime: Date, windowHours: number): boolean {
  const mt = (mealTime instanceof Date ? mealTime : new Date(mealTime)).getTime();
  const st = (symptomTime instanceof Date ? symptomTime : new Date(symptomTime)).getTime();
  const diff = st - mt;
  return diff >= 0 && diff <= windowHours * 60 * 60 * 1000;
}

/**
 * Run correlation analysis across all meals and symptoms.
 *
 * For each (food, symptom) pair, builds a 2x2 contingency table
 * across calendar days:
 *   a = days where food was eaten AND symptom occurred within window
 *   b = days where food was eaten AND symptom did NOT occur within window
 *   c = days where food was NOT eaten AND symptom occurred
 *   d = days where food was NOT eaten AND symptom did NOT occur
 *
 * Runs Fisher's exact test on each table.
 *
 * @param meals All meal entries
 * @param symptoms All symptom entries
 * @param windowHours Hours after a meal to look for symptoms (default 24)
 * @param minCooccurrences Minimum value of `a` to include a pair (default 3)
 */
export function runCorrelation(
  meals: Meal[],
  symptoms: Symptom[],
  windowHours: number = 24,
  minCooccurrences: number = 3,
): CorrelationResult[] {
  if (meals.length === 0 || symptoms.length === 0) return [];

  const allDays = getCalendarDays(meals, symptoms);
  if (allDays.length === 0) return [];

  // Build per day lookup: which foods were eaten, which symptoms occurred
  const dayFoods = new Map<string, Set<string>>();
  const dayMealTimes = new Map<string, Meal[]>();

  for (const meal of meals) {
    const day = toDateKey(meal.timestamp);
    if (!dayFoods.has(day)) dayFoods.set(day, new Set());
    for (const food of meal.foods) {
      dayFoods.get(day)!.add(food);
    }
    if (!dayMealTimes.has(day)) dayMealTimes.set(day, []);
    dayMealTimes.get(day)!.push(meal);
  }

  const daySymptoms = new Map<string, Set<string>>();
  const daySymptomEntries = new Map<string, Symptom[]>();

  for (const symptom of symptoms) {
    const day = toDateKey(symptom.timestamp);
    if (!daySymptoms.has(day)) daySymptoms.set(day, new Set());
    daySymptoms.get(day)!.add(symptom.name);
    if (!daySymptomEntries.has(day)) daySymptomEntries.set(day, []);
    daySymptomEntries.get(day)!.push(symptom);
  }

  // Collect all unique foods and symptoms
  const allFoods = new Set<string>();
  for (const foods of dayFoods.values()) {
    for (const f of foods) allFoods.add(f);
  }

  const allSymptomNames = new Set<string>();
  for (const names of daySymptoms.values()) {
    for (const n of names) allSymptomNames.add(n);
  }

  // For each (food, symptom) pair, build the contingency table
  const results: CorrelationResult[] = [];

  for (const food of allFoods) {
    for (const symptomName of allSymptomNames) {
      let a = 0, b = 0, c = 0, d = 0;

      for (const day of allDays) {
        const foodEaten = dayFoods.get(day)?.has(food) ?? false;

        // Check if symptom occurred within window of any meal containing this food
        let symptomInWindow = false;
        if (foodEaten && dayMealTimes.has(day)) {
          const mealsWithFood = dayMealTimes.get(day)!.filter(m => m.foods.includes(food));

          // Check symptoms on the same day and the next few days (within window)
          for (const meal of mealsWithFood) {
            // Check symptoms on the same day
            const symptomsToCheck = daySymptomEntries.get(day) ?? [];
            for (const s of symptomsToCheck) {
              if (s.name === symptomName && isWithinWindow(meal.timestamp, s.timestamp, windowHours)) {
                symptomInWindow = true;
                break;
              }
            }
            if (symptomInWindow) break;

            // Also check symptoms on subsequent days if window extends beyond midnight
            if (windowHours > 0) {
              const mealDate = new Date(meal.timestamp);
              const windowEndMs = mealDate.getTime() + windowHours * 60 * 60 * 1000;
              const windowEndDate = new Date(windowEndMs);
              const endDay = toDateKey(windowEndDate);

              if (endDay !== day) {
                // Check subsequent days up to window end
                const dayIdx = allDays.indexOf(day);
                for (let di = dayIdx + 1; di < allDays.length; di++) {
                  const checkDay = allDays[di];
                  if (checkDay > endDay) break;
                  const nextDaySymptoms = daySymptomEntries.get(checkDay) ?? [];
                  for (const s of nextDaySymptoms) {
                    if (s.name === symptomName && isWithinWindow(meal.timestamp, s.timestamp, windowHours)) {
                      symptomInWindow = true;
                      break;
                    }
                  }
                  if (symptomInWindow) break;
                }
              }
            }
            if (symptomInWindow) break;
          }
        }

        const symptomOccurred = !foodEaten
          ? (daySymptoms.get(day)?.has(symptomName) ?? false)
          : symptomInWindow;

        if (foodEaten && symptomOccurred) a++;
        else if (foodEaten && !symptomOccurred) b++;
        else if (!foodEaten && (daySymptoms.get(day)?.has(symptomName) ?? false)) c++;
        else d++;
      }

      if (a < minCooccurrences) continue;

      const { pValue, oddsRatio } = fisherExact(a, b, c, d);
      const ci = oddsRatioCI(a, b, c, d);
      results.push({ food, symptom: symptomName, pValue, oddsRatio, ciLower: ci.lower, ciUpper: ci.upper, a, b, c, d });
    }
  }

  results.sort((x, y) => x.pValue - y.pValue);
  return results;
}
