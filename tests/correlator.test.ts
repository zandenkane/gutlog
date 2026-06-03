import { describe, it, expect } from 'vitest';
import { runCorrelation } from '../src/correlator';
import type { Meal, Symptom } from '../src/db';

function makeMeal(day: string, foods: string[]): Meal {
  return {
    id: undefined,
    timestamp: new Date(`${day}T12:00:00`),
    description: foods.join(', '),
    foods,
  };
}

function makeSymptom(day: string, name: string, hour: number = 18): Symptom {
  const h = hour.toString().padStart(2, '0');
  return {
    id: undefined,
    timestamp: new Date(`${day}T${h}:00:00`),
    name,
    severity: 3,
  };
}

describe('runCorrelation', () => {
  it('returns empty for no data', () => {
    const results = runCorrelation([], [], 24);
    expect(results).toHaveLength(0);
  });

  it('returns empty when only meals exist', () => {
    const meals = [makeMeal('2025-01-01', ['cheese'])];
    const results = runCorrelation(meals, [], 24);
    expect(results).toHaveLength(0);
  });

  it('returns empty when only symptoms exist', () => {
    const symptoms = [makeSymptom('2025-01-01', 'headache')];
    const results = runCorrelation([], symptoms, 24);
    expect(results).toHaveLength(0);
  });

  it('skips pairs with fewer than minCooccurrences', () => {
    // Only 2 cooccurrences, default min is 3
    const meals = [
      makeMeal('2025-01-01', ['cheese']),
      makeMeal('2025-01-02', ['cheese']),
      makeMeal('2025-01-03', ['rice']),
    ];
    const symptoms = [
      makeSymptom('2025-01-01', 'bloating'),
      makeSymptom('2025-01-02', 'bloating'),
    ];
    const results = runCorrelation(meals, symptoms, 24, 3);
    expect(results).toHaveLength(0);
  });

  it('detects a strong food/symptom correlation', () => {
    // Cheese eaten on days 1-5, symptom only on those days
    // Rice eaten on days 6-10, no symptom
    const meals: Meal[] = [];
    const symptoms: Symptom[] = [];

    for (let i = 1; i <= 5; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['cheese']));
      symptoms.push(makeSymptom(day, 'bloating'));
    }
    for (let i = 6; i <= 10; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['rice']));
    }

    const results = runCorrelation(meals, symptoms, 24, 3);
    const cheeseResult = results.find(r => r.food === 'cheese' && r.symptom === 'bloating');
    expect(cheeseResult).toBeDefined();
    expect(cheeseResult!.pValue).toBeLessThan(0.05);
    expect(cheeseResult!.a).toBe(5);
  });

  it('respects the time window', () => {
    // Meal at noon, symptom at 10pm = 10 hours later
    // With a 6 hour window, this should NOT count as cooccurring
    const meals = [
      makeMeal('2025-01-01', ['dairy']),
      makeMeal('2025-01-02', ['dairy']),
      makeMeal('2025-01-03', ['dairy']),
      makeMeal('2025-01-04', ['dairy']),
      makeMeal('2025-01-05', ['dairy']),
    ];
    const symptoms = [
      makeSymptom('2025-01-01', 'headache', 22),
      makeSymptom('2025-01-02', 'headache', 22),
      makeSymptom('2025-01-03', 'headache', 22),
      makeSymptom('2025-01-04', 'headache', 22),
      makeSymptom('2025-01-05', 'headache', 22),
    ];

    // With 6h window: meal at 12:00, symptom at 22:00 is 10h later, outside window
    const resultsNarrow = runCorrelation(meals, symptoms, 6, 3);
    const dairyNarrow = resultsNarrow.find(r => r.food === 'dairy' && r.symptom === 'headache');
    // Should not have 5 cooccurrences (symptoms are outside the window)
    expect(dairyNarrow?.a ?? 0).toBe(0);

    // With 24h window: 10h is within window
    const resultsWide = runCorrelation(meals, symptoms, 24, 3);
    const dairyWide = resultsWide.find(r => r.food === 'dairy' && r.symptom === 'headache');
    expect(dairyWide).toBeDefined();
    expect(dairyWide!.a).toBe(5);
  });

  it('builds correct contingency table', () => {
    // 10 days total:
    // Days 1-4: eat cheese, get bloating (a=4)
    // Days 5-6: eat cheese, no bloating (b=2)
    // Days 7-8: no cheese, get bloating (c=2)
    // Days 9-10: no cheese, no bloating (d=2)
    const meals: Meal[] = [];
    const symptoms: Symptom[] = [];

    for (let i = 1; i <= 6; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['cheese']));
    }
    for (let i = 7; i <= 10; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['rice']));
    }
    for (let i = 1; i <= 4; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      symptoms.push(makeSymptom(day, 'bloating'));
    }
    for (let i = 7; i <= 8; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      symptoms.push(makeSymptom(day, 'bloating'));
    }

    const results = runCorrelation(meals, symptoms, 24, 3);
    const cheeseResult = results.find(r => r.food === 'cheese' && r.symptom === 'bloating');
    expect(cheeseResult).toBeDefined();
    expect(cheeseResult!.a).toBe(4);
    expect(cheeseResult!.b).toBe(2);
    expect(cheeseResult!.c).toBe(2);
    expect(cheeseResult!.d).toBe(2);
  });

  it('includes confidence interval bounds in results', () => {
    const meals: Meal[] = [];
    const symptoms: Symptom[] = [];

    for (let i = 1; i <= 5; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['cheese']));
      symptoms.push(makeSymptom(day, 'bloating'));
    }
    for (let i = 6; i <= 10; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['rice']));
    }

    const results = runCorrelation(meals, symptoms, 24, 3);
    const cheeseResult = results.find(r => r.food === 'cheese' && r.symptom === 'bloating');
    expect(cheeseResult).toBeDefined();
    expect(cheeseResult!.ciLower).toBeGreaterThan(0);
    expect(cheeseResult!.ciUpper).toBeGreaterThan(cheeseResult!.ciLower);
    expect(cheeseResult!.oddsRatio).toBeGreaterThanOrEqual(cheeseResult!.ciLower);
    expect(cheeseResult!.oddsRatio).toBeLessThanOrEqual(cheeseResult!.ciUpper);
  });

  it('sorts results by p value ascending', () => {
    // Create two food/symptom pairs with different strengths
    const meals: Meal[] = [];
    const symptoms: Symptom[] = [];

    for (let i = 1; i <= 10; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['cheese', 'bread']));
    }
    for (let i = 11; i <= 20; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      meals.push(makeMeal(day, ['rice']));
    }
    // Cheese cooccurs with bloating on all 10 days
    for (let i = 1; i <= 10; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      symptoms.push(makeSymptom(day, 'bloating'));
    }
    // Also some headaches scattered
    for (let i = 3; i <= 6; i++) {
      const day = `2025-01-${i.toString().padStart(2, '0')}`;
      symptoms.push(makeSymptom(day, 'headache'));
    }

    const results = runCorrelation(meals, symptoms, 24, 3);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].pValue).toBeGreaterThanOrEqual(results[i - 1].pValue);
    }
  });
});
