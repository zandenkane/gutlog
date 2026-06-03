import { useState } from 'preact/hooks';
import { getAllMeals, getAllSymptoms } from '../db';
import { runCorrelation, type CorrelationResult } from '../correlator';
import { significanceLabel } from '../stats';

const TIME_WINDOWS = [
  { label: '3 hours', hours: 3 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '72 hours', hours: 72 },
];

export function Analysis() {
  const [results, setResults] = useState<CorrelationResult[] | null>(null);
  const [windowHours, setWindowHours] = useState(24);
  const [running, setRunning] = useState(false);
  const [mealCount, setMealCount] = useState(0);
  const [symptomCount, setSymptomCount] = useState(0);

  async function handleRun() {
    setRunning(true);
    try {
      const [meals, symptoms] = await Promise.all([getAllMeals(), getAllSymptoms()]);
      setMealCount(meals.length);
      setSymptomCount(symptoms.length);
      const correlations = runCorrelation(meals, symptoms, windowHours);
      setResults(correlations);
    } finally {
      setRunning(false);
    }
  }

  function pValueColor(p: number): string {
    if (p < 0.01) return 'pvalue-red';
    if (p < 0.05) return 'pvalue-yellow';
    return 'pvalue-green';
  }

  function formatP(p: number): string {
    if (p < 0.001) return '<0.001';
    return p.toFixed(3);
  }

  function formatOddsRatio(or: number): string {
    if (or === Infinity) return 'Inf';
    return or.toFixed(2);
  }

  function formatCI(lower: number, upper: number): string {
    const lo = lower < 0.01 ? '<0.01' : lower.toFixed(2);
    const hi = upper === Infinity ? 'Inf' : upper.toFixed(2);
    return `${lo} to ${hi}`;
  }

  return (
    <div class="analysis">
      <h3>Analysis</h3>

      <div class="analysis-controls">
        <label class="form-field">
          <span>Time window</span>
          <select
            value={windowHours}
            onChange={(e) => setWindowHours(Number((e.target as HTMLSelectElement).value))}
          >
            {TIME_WINDOWS.map(w => (
              <option key={w.hours} value={w.hours}>{w.label}</option>
            ))}
          </select>
        </label>

        <button onClick={handleRun} disabled={running}>
          {running ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {results === null && !running && (
        <div class="analysis-empty">
          <p>
            Press "Run Analysis" to scan your meal and symptom data for correlations.
          </p>
          <p>
            For meaningful results, log at least 10 meals and 5 symptoms across several days.
            The engine needs enough data to distinguish real patterns from coincidence.
          </p>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div class="analysis-empty">
          <p>
            No significant correlations found with the current data
            ({mealCount} meals, {symptomCount} symptoms).
          </p>
          <p>
            This could mean your foods are not triggering symptoms, or there is not
            enough data yet. Keep logging and try again in a few days.
          </p>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div class="analysis-results">
          <p class="analysis-summary">
            Found {results.length} food/symptom correlation{results.length !== 1 ? 's' : ''} across {mealCount} meals and {symptomCount} symptoms.
          </p>
          <div class="results-table-wrapper">
            <table class="results-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Symptom</th>
                  <th>p value</th>
                  <th>Strength</th>
                  <th>Odds Ratio</th>
                  <th>95% CI</th>
                  <th>Both</th>
                  <th>Food Only</th>
                  <th>Symptom Only</th>
                  <th>Neither</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>{r.food}</td>
                    <td>{r.symptom}</td>
                    <td class={pValueColor(r.pValue)}>{formatP(r.pValue)}</td>
                    <td>{significanceLabel(r.pValue)}</td>
                    <td>{formatOddsRatio(r.oddsRatio)}</td>
                    <td>{formatCI(r.ciLower, r.ciUpper)}</td>
                    <td>{r.a}</td>
                    <td>{r.b}</td>
                    <td>{r.c}</td>
                    <td>{r.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
