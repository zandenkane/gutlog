import { useState } from 'preact/hooks';
import { MealForm } from './components/meal-form';
import { SymptomForm } from './components/symptom-form';
import { History } from './components/history';
import { Analysis } from './components/analysis';
import { Summary } from './components/summary';
import { DataManager } from './components/data-manager';

type Tab = 'log' | 'history' | 'analysis' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('log');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div class="app">
      <header class="app-header">
        <h1>gutlog</h1>
        <p class="app-tagline">Track meals, log symptoms, find correlations.</p>
      </header>

      <nav class="tab-nav" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'log'}
          class={tab === 'log' ? 'tab active' : 'tab'}
          onClick={() => setTab('log')}
        >
          Log
        </button>
        <button
          role="tab"
          aria-selected={tab === 'history'}
          class={tab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setTab('history')}
        >
          History
        </button>
        <button
          role="tab"
          aria-selected={tab === 'analysis'}
          class={tab === 'analysis' ? 'tab active' : 'tab'}
          onClick={() => setTab('analysis')}
        >
          Analysis
        </button>
        <button
          role="tab"
          aria-selected={tab === 'settings'}
          class={tab === 'settings' ? 'tab active' : 'tab'}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main class="tab-content">
        {tab === 'log' && (
          <div class="log-tab">
            <Summary refreshKey={refreshKey} />
            <MealForm onSaved={handleSaved} />
            <SymptomForm onSaved={handleSaved} />
          </div>
        )}
        {tab === 'history' && <History refreshKey={refreshKey} />}
        {tab === 'analysis' && <Analysis />}
        {tab === 'settings' && (
          <div class="settings-tab">
            <DataManager onImported={handleSaved} />
          </div>
        )}
      </main>
    </div>
  );
}
