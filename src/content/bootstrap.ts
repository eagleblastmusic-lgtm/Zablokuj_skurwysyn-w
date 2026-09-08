import { startProbe } from '../bootstrap';
import { DiagnosticCollector } from '../diagnostics/DiagnosticCollector';
import { DiagnosticExporter } from '../diagnostics/DiagnosticExporter';
import { GroundTruthCollector } from '../diagnostics/GroundTruthCollector';
import { SpaNavigationObserver } from '../facebook/SpaNavigationObserver';
import { MemoryProbe } from '../performance/MemoryProbe';
import { PaintProbe } from '../performance/PaintProbe';
import { PrePaintExperiment } from '../performance/PrePaintExperiment';
import { TimingProbe } from '../performance/TimingProbe';
import { DebugOverlay } from '../ui/DebugOverlay';
import { MutationPipeline } from './observer';

const probeInfo = startProbe();
const diagnostics = new DiagnosticCollector(probeInfo.version);
const groundTruth = new GroundTruthCollector();
const exporter = new DiagnosticExporter();
const timingProbe = new TimingProbe();
const paintProbe = new PaintProbe();
const memoryProbe = new MemoryProbe();
const prePaintExperiment = new PrePaintExperiment({
  onSample: (sample) => paintProbe.record(sample)
});

const buildReport = () => {
  memoryProbe.sampleHeap();
  return diagnostics.report(groundTruth.report(), {
    performance: timingProbe.report(),
    prePaint: paintProbe.report(),
    memory: memoryProbe.report()
  });
};

const overlay = new DebugOverlay({
  onExport: () => exporter.download(buildReport()),
  onLabel: (target, decision) => groundTruth.record(target, decision),
  onPrePaintStrategyChange: (strategy) => prePaintExperiment.setStrategy(strategy),
  onLongSessionComplete: () => {
    diagnostics.markLongSessionComplete();
    memoryProbe.sampleHeap();
  }
});
overlay.mount();

const mutationPipeline = new MutationPipeline(undefined, undefined, undefined, {
  onObservation: (observation) => {
    diagnostics.recordObservation(observation);
    overlay.renderObservation(observation);
  },
  onLifecycleEvent: (event) => diagnostics.recordLifecycle(event),
  timingProbe,
  prePaintExperiment
});

const startPipeline = () => {
  mutationPipeline.start();
  memoryProbe.markObserverStarted();
};

const stopPipeline = () => {
  mutationPipeline.stop();
  memoryProbe.markObserverStopped();
};

const spaNavigationObserver = new SpaNavigationObserver((event) => {
  diagnostics.setPageContext(event.currentContext);
  stopPipeline();
  startPipeline();
});

diagnostics.setPageContext(spaNavigationObserver.currentContext());
startPipeline();
spaNavigationObserver.start();

const memorySampleTimer = window.setInterval(() => memoryProbe.sampleHeap(), 30_000);

window.addEventListener(
  'pagehide',
  () => {
    window.clearInterval(memorySampleTimer);
    spaNavigationObserver.stop();
    stopPipeline();
    overlay.destroy();
  },
  { once: true }
);
