import { useState, useEffect } from 'preact/hooks';
import { getAllMeals, getAllSymptoms } from '../db';

interface SummaryStats {
  totalMeals: number;
  totalSymptoms: number;
  uniqueFoods: number;
  uniqueSymptoms: number;
  daysTracked: number;
  topFoods: Array<{ name: string; count: number }>;
  topSymptoms: Array<{ name: string; count: number }>;
}

interface SummaryProps {
  refreshKey: number;
}

export function Summary({ refreshKey }: SummaryProps) {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  async function loadStats() {
    setLoading(true);
    const [meals, symptoms] = await Promise.all([getAllMeals(), getAllSymptoms()]);

    const days = new Set<string>();
    const foodCounts = new Map<string, number>();
    const symptomCounts = new Map<string, number>();

    for (const meal of meals) {
      const day = new Date(meal.timestamp).toISOString().slice(0, 10);
      days.add(day);
      for (const food of meal.foods) {
        foodCounts.set(food, (foodCounts.get(food) ?? 0) + 1);
      }
    }
    for (const symptom of symptoms) {
      const day = new Date(symptom.timestamp).toISOString().slice(0, 10);
      days.add(day);
      symptomCounts.set(symptom.name, (symptomCounts.get(symptom.name) ?? 0) + 1);
    }

    const topFoods = Array.from(foodCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topSymptoms = Array.from(symptomCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalMeals: meals.length,
      totalSymptoms: symptoms.length,
      uniqueFoods: foodCounts.size,
      uniqueSymptoms: symptomCounts.size,
      daysTracked: days.size,
      topFoods,
      topSymptoms,
    });
    setLoading(false);
  }

  if (loading || !stats) {
    return <div class="history-loading">Loading summary...</div>;
  }

  if (stats.totalMeals === 0 && stats.totalSymptoms === 0) {
    return (
      <div class="history-empty">
        <p>No data yet. Start logging meals and symptoms to see your summary here.</p>
      </div>
    );
  }

  return (
    <div class="summary">
      <h3>Summary</h3>
      <div class="summary-grid">
        <div class="summary-stat">
          <span class="summary-value">{stats.totalMeals}</span>
          <span class="summary-label">Meals</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{stats.totalSymptoms}</span>
          <span class="summary-label">Symptoms</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{stats.uniqueFoods}</span>
          <span class="summary-label">Unique Foods</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{stats.daysTracked}</span>
          <span class="summary-label">Days Tracked</span>
        </div>
      </div>

      {stats.topFoods.length > 0 && (
        <div class="summary-section">
          <h4>Most Logged Foods</h4>
          <ul class="summary-ranking">
            {stats.topFoods.map(f => (
              <li key={f.name}>
                <span class="ranking-name">{f.name}</span>
                <span class="ranking-count">{f.count}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.topSymptoms.length > 0 && (
        <div class="summary-section">
          <h4>Most Logged Symptoms</h4>
          <ul class="summary-ranking">
            {stats.topSymptoms.map(s => (
              <li key={s.name}>
                <span class="ranking-name">{s.name}</span>
                <span class="ranking-count">{s.count}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
