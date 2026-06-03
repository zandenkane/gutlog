import { useState, useEffect } from 'preact/hooks';
import { getAllMeals, getAllSymptoms, deleteMeal, deleteSymptom } from '../db';
import type { Meal, Symptom } from '../db';

type Entry =
  | { type: 'meal'; data: Meal }
  | { type: 'symptom'; data: Symptom };

interface HistoryProps {
  refreshKey: number;
}

export function History({ refreshKey }: HistoryProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [refreshKey]);

  async function loadEntries() {
    setLoading(true);
    const [meals, symptoms] = await Promise.all([getAllMeals(), getAllSymptoms()]);

    const combined: Entry[] = [
      ...meals.map(m => ({ type: 'meal' as const, data: m })),
      ...symptoms.map(s => ({ type: 'symptom' as const, data: s })),
    ];

    combined.sort((a, b) => {
      const ta = new Date(a.data.timestamp).getTime();
      const tb = new Date(b.data.timestamp).getTime();
      return tb - ta;
    });

    setEntries(combined);
    setLoading(false);
  }

  async function handleDelete(entry: Entry) {
    if (entry.type === 'meal' && entry.data.id != null) {
      await deleteMeal(entry.data.id);
    } else if (entry.type === 'symptom' && entry.data.id != null) {
      await deleteSymptom(entry.data.id);
    }
    await loadEntries();
  }

  function formatTime(d: Date): string {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return <div class="history-loading">Loading history...</div>;
  }

  if (entries.length === 0) {
    return (
      <div class="history-empty">
        <p>No entries yet. Start logging meals and symptoms to see them here.</p>
      </div>
    );
  }

  return (
    <div class="history">
      <h3>History</h3>
      <ul class="history-list">
        {entries.map((entry) => {
          const key = `${entry.type}-${entry.data.id}`;
          return (
            <li key={key} class={`history-item history-item-${entry.type}`}>
              <div class="history-item-header">
                <span class="history-icon">{entry.type === 'meal' ? 'M' : 'S'}</span>
                <span class="history-time">{formatTime(entry.data.timestamp)}</span>
                <button
                  class="delete-btn"
                  onClick={() => handleDelete(entry)}
                  aria-label="Delete entry"
                >
                  x
                </button>
              </div>
              <div class="history-item-body">
                {entry.type === 'meal' ? (
                  <>
                    <p class="history-desc">{(entry.data as Meal).description}</p>
                    <div class="tag-chips tag-chips-small">
                      {(entry.data as Meal).foods.map(f => (
                        <span class="chip chip-small" key={f}>{f}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p class="history-desc">
                    {(entry.data as Symptom).name}
                    {' '}
                    <span class="severity-badge">
                      severity {(entry.data as Symptom).severity}/5
                    </span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
