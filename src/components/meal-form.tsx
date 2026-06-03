import { useState } from 'preact/hooks';
import { parseFoods } from '../food-parser';
import { addMeal } from '../db';

interface MealFormProps {
  onSaved: () => void;
}

export function MealForm({ onSaved }: MealFormProps) {
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState(nowLocalISO());
  const [saving, setSaving] = useState(false);

  const parsed = parseFoods(description);
  const allTags = [...parsed.tags, ...parsed.categories.filter(c => !parsed.tags.includes(c))];

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await addMeal(description.trim(), allTags, new Date(datetime));
      setDescription('');
      setDatetime(nowLocalISO());
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form class="entry-form" onSubmit={handleSubmit}>
      <h3>Log a Meal</h3>

      <label class="form-field">
        <span>What did you eat?</span>
        <textarea
          value={description}
          onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          placeholder="e.g. chicken sandwich with cheese, side salad, coffee"
          rows={3}
        />
      </label>

      {allTags.length > 0 && (
        <div class="tag-chips">
          {allTags.map(tag => (
            <span class="chip" key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <label class="form-field">
        <span>When?</span>
        <input
          type="datetime-local"
          value={datetime}
          onInput={(e) => setDatetime((e.target as HTMLInputElement).value)}
        />
      </label>

      <button type="submit" disabled={saving || !description.trim()}>
        {saving ? 'Saving...' : 'Save Meal'}
      </button>
    </form>
  );
}

function nowLocalISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
