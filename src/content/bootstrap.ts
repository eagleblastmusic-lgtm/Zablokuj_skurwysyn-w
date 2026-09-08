import { startProbe } from '../bootstrap';
import { DiagnosticCollector } from '../diagnostics/DiagnosticCollector';
import { DiagnosticExporter } from '../diagnostics/DiagnosticExporter';
import { SpaNavigationObserver } from '../facebook/SpaNavigationObserver';
import { DebugOverlay } from '../ui/DebugOverlay';
import { MutationPipeline } from './observer';

const probeInfo = startProbe();
const diagnostics = new DiagnosticCollector(probeInfo.version);
const exporter = new DiagnosticExporter();
const overlay = new DebugOverlay({
  onExport: () => exporter.download(diagnostics.report())
});
overlay.mount();

const mutationPipeline = new MutationPipeline(undefined, undefined, undefined, {
  onObservation: (observation) => {
    diagnostics.recordObservation(observation);
    overlay.renderObservation(observation);
  },
  onLifecycleEvent: (event) => diagnostics.recordLifecycle(event)
});

const spaNavigationObserver = new SpaNavigationObserver((event) => {
  diagnostics.setPageContext(event.currentContext);
  mutationPipeline.stop();
  mutationPipeline.start();
});

diagnostics.setPageContext(spaNavigationObserver.currentContext());
mutationPipeline.start();
spaNavigationObserver.start();

window.addEventListener(
  'pagehide',
  () => {
    spaNavigationObserver.stop();
    mutationPipeline.stop();
    overlay.destroy();
  },
  { once: true }
);
