import type { M0DiagnosticReport } from './DiagnosticSchema';

export class DiagnosticExporter {
  serialize(report: M0DiagnosticReport): string {
    return JSON.stringify(report, null, 2);
  }

  download(report: M0DiagnosticReport, filename = 'm0-diagnostic-report.json'): void {
    const blob = new Blob([this.serialize(report)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.documentElement.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
