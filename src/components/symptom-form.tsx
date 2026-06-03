import { useState } from 'preact/hooks';
import { addSymptom } from '../db';

const PRESET_SYMPTOMS = [
  'headache',
  'bloating',
  'fatigue',
  'nausea',
  'brain fog',
  'joint pain',
  'skin irritation',
  'stomach pain',
  'diarrhea',
  'congestion',
];

interface SymptomFormProps {
  onSaved: () => void;
}

export function SymptomForm({ onSaved }: SymptomFormProps) {
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [severity, setSeverity] = useState(3);
  const [datetime, setDatetime] = useState(nowLocalISO());
  const [saving, setSaving] = useState(false);

  const effectiveName = name === '__custom__' ? customName.trim() : name;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!effectiveName) return;
    setSaving(true);
    try {
      await addSymptom(effectiveName, severity, new Date(datetime));
      setName('');
      setCustomName('');
      setSeverity(3);
      setDatetime(nowLocalISO());
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form class="entry-form" onSubmit={handleSubmit}>
      <h3>Log a Symptom</h3>

      <label class="form-field">
        <span>Symptom</span>
        <select
          value={name}
          onChange={(e) => setName((e.target as HTMLSelectElement).value)}
        >
          <option value="">Select a symptom...</option>
          {PRESET_SYMPTOMS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="__custom__">Other (custom)</option>
        </select>
      </label>

      {name === '__custom__' && (
        <label class="form-field">
          <span>Custom symptom name</span>
          <input
            type="text"
            value={customName}
            onInput={(e) => setCustomName((e.target as HTMLInputElement).value)}
            placeholder="e.g. itchy throat"
          />
        </label>
      )}

      <label class="form-field">
        <span>Severity: {severity}/5</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={severity}
          onInput={(e) => setSeverity(Number((e.target as HTMLInputElement).value))}
        />
        <div class="severity-labels">
          <span>Mild</span>
          <span>Severe</span>
        </div>
      </label>

      <label class="form-field">
        <span>When?</span>
        <input
          type="datetime-local"
          value={datetime}
          onInput={(e) => setDatetime((e.target as HTMLInputElement).value)}
        />
      </label>

      <button type="submit" disabled={saving || !effectiveName}>
        {saving ? 'Saving...' : 'Save Symptom'}
      </button>
    </form>
  );
}

function nowLocalISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
