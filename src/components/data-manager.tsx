import { useState, useRef } from 'preact/hooks';
import { downloadExport, validateImport, importData } from '../export';
import type { ExportData } from '../export';

interface DataManagerProps {
  onImported: () => void;
}

export function DataManager({ onImported }: DataManagerProps) {
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setStatus('');
    try {
      await downloadExport();
      setStatus('Export downloaded.');
    } catch (err) {
      setStatus('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus('Select a file first.');
      return;
    }
    setImporting(true);
    setStatus('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const error = validateImport(parsed);
      if (error) {
        setStatus('Invalid file: ' + error);
        return;
      }
      const result = await importData(parsed as ExportData);
      setStatus(`Imported ${result.meals} meals and ${result.symptoms} symptoms.`);
      onImported();
    } catch (err) {
      setStatus('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div class="entry-form data-manager">
      <h3>Data</h3>

      <div class="data-actions">
        <button
          type="button"
          class="data-btn"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export JSON'}
        </button>

        <div class="import-group">
          <input
            type="file"
            accept=".json"
            ref={fileRef}
            class="file-input"
          />
          <button
            type="button"
            class="data-btn"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import JSON'}
          </button>
        </div>
      </div>

      {status && <p class="data-status">{status}</p>}
    </div>
  );
}
