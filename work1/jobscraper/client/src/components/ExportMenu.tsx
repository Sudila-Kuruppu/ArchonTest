import { triggerCsvDownload, triggerExcelDownload } from '../api/export';

export function ExportMenu() {
  return (
    <div className="export-menu">
      <span className="export-label">Export:</span>
      <button onClick={triggerCsvDownload} className="btn btn-outline btn-sm">CSV</button>
      <button onClick={triggerExcelDownload} className="btn btn-outline btn-sm">Excel</button>
    </div>
  );
}
