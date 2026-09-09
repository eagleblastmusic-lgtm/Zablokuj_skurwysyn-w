import type { PipelineObservation } from '../content/observer';
import type { GroundTruthTarget, HumanDecision } from '../diagnostics/DiagnosticSchema';
import type { PrePaintStrategy } from '../performance/PrePaintExperiment';

export interface DebugOverlayOptions {
  readonly onExport: () => void;
  readonly onLabel?: (target: GroundTruthTarget, decision: HumanDecision) => void;
  readonly onPrePaintStrategyChange?: (strategy: PrePaintStrategy) => void;
  readonly onLongSessionComplete?: () => void;
}

export class DebugOverlay {
  private readonly host: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly launcher: HTMLButtonElement;
  private readonly list: HTMLDivElement;
  private enabled = true;

  constructor(private readonly options: DebugOverlayOptions) {
    this.host = document.createElement('div');
    this.host.dataset.m0ProbeHost = 'true';
    const shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .panel, .launcher { position: fixed; z-index: 2147483647; font: 12px/1.4 system-ui, sans-serif; color: #f5f5f5; }
      .panel { top: 12px; right: 12px; width: 380px; max-height: 62vh; overflow: auto; background: rgba(18,18,20,.96); border: 1px solid #555; border-radius: 10px; padding: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.35); }
      .launcher { top: 12px; right: 12px; border: 1px solid #777; border-radius: 999px; background: #202124; color: #fff; padding: 6px 10px; cursor: pointer; }
      .header, .label-actions, .experiment-actions { display: flex; align-items: center; gap: 6px; }
      .header { justify-content: space-between; margin-bottom: 8px; }
      .title { font-weight: 700; }
      .actions { display: flex; gap: 6px; }
      .experiment-actions { flex-wrap: wrap; padding: 6px 0 8px; border-bottom: 1px solid #444; }
      button { font: inherit; color: #fff; background: #303134; border: 1px solid #666; border-radius: 6px; padding: 4px 7px; cursor: pointer; }
      .label-actions { margin-top: 6px; flex-wrap: wrap; }
      .item { margin: 6px 0; border-left: 4px solid #777; background: #242528; border-radius: 5px; padding: 6px 8px; overflow-wrap: anywhere; }
      .accepted { border-left-color: #34a853; }
      .uncertain { border-left-color: #fbbc04; }
      .nested { border-left-color: #ea4335; }
      .meta { color: #c4c7c5; }
    `;

    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    this.panel.setAttribute('role', 'status');
    this.panel.setAttribute('aria-label', 'M0 probe debug panel');

    const header = document.createElement('div');
    header.className = 'header';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = 'M0 Debug Mode';
    const actions = document.createElement('div');
    actions.className = 'actions';

    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.textContent = 'Export report';
    exportButton.addEventListener('click', () => this.options.onExport());

    const disableButton = document.createElement('button');
    disableButton.type = 'button';
    disableButton.textContent = 'Disable';
    disableButton.addEventListener('click', () => this.setEnabled(false));

    actions.append(exportButton, disableButton);
    header.append(title, actions);

    const experimentActions = document.createElement('div');
    experimentActions.className = 'experiment-actions';
    this.addStrategyButton(experimentActions, 'A · no guard', 'NO_GUARD');
    this.addStrategyButton(experimentActions, 'B · scoped guard', 'SCOPED_GUARD');
    this.addStrategyButton(experimentActions, 'C · placeholder', 'TEMPORARY_PLACEHOLDER');

    if (this.options.onLongSessionComplete !== undefined) {
      const longSessionButton = document.createElement('button');
      longSessionButton.type = 'button';
      longSessionButton.textContent = 'Long session done';
      longSessionButton.addEventListener('click', () => {
        this.options.onLongSessionComplete?.();
        longSessionButton.disabled = true;
        longSessionButton.textContent = 'Long session marked';
      });
      experimentActions.append(longSessionButton);
    }

    this.list = document.createElement('div');
    this.panel.append(header, experimentActions, this.list);

    this.launcher = document.createElement('button');
    this.launcher.type = 'button';
    this.launcher.className = 'launcher';
    this.launcher.textContent = 'M0 Probe';
    this.launcher.hidden = true;
    this.launcher.addEventListener('click', () => this.setEnabled(true));

    shadow.append(style, this.panel, this.launcher);
  }

  mount(): void {
    if (!this.host.isConnected) document.documentElement.append(this.host);
  }

  destroy(): void {
    this.host.remove();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.panel.hidden = !enabled;
    this.launcher.hidden = enabled;
  }

  renderObservation(observation: PipelineObservation): void {
    if (!this.enabled) return;

    const item = document.createElement('div');
    item.className = `item ${this.classFor(observation.detection.classification)}`;

    const summary = document.createElement('div');
    summary.textContent = `${observation.detection.classification} · confidence ${observation.detection.confidence.toFixed(2)}`;

    const signalNames = Object.entries(observation.detection.candidate.signals)
      .filter(([, active]) => active)
      .map(([name]) => name)
      .join(', ');

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `fp ${observation.fingerprint.id} · batch ${observation.batchLatencyMs.toFixed(2)} ms · ${signalNames || 'no positive signals'}`;

    item.append(summary, meta, this.createLocateButton(observation.detection.candidate.node));

    if (this.options.onLabel !== undefined) {
      const target: GroundTruthTarget = {
        detectorDecision: observation.detection.classification,
        detectorConfidence: observation.detection.confidence,
        structuralFeatures: { ...observation.fingerprint.features }
      };
      item.append(this.createLabelActions(target));
    }

    this.list.prepend(item);
    while (this.list.childElementCount > 20) this.list.lastElementChild?.remove();
  }

  private addStrategyButton(container: HTMLElement, label: string, strategy: PrePaintStrategy): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => this.options.onPrePaintStrategyChange?.(strategy));
    container.append(button);
  }

  private createLocateButton(node: HTMLElement): HTMLButtonElement {
    const reference = new WeakRef(node);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Locate';
    button.addEventListener('click', () => {
      const target = reference.deref();
      if (target === undefined || !target.isConnected) {
        button.disabled = true;
        button.textContent = 'Gone';
        return;
      }

      const outline = target.style.getPropertyValue('outline');
      const outlinePriority = target.style.getPropertyPriority('outline');
      const outlineOffset = target.style.getPropertyValue('outline-offset');
      const outlineOffsetPriority = target.style.getPropertyPriority('outline-offset');

      target.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      target.style.setProperty('outline', '4px solid #00e676', 'important');
      target.style.setProperty('outline-offset', '3px', 'important');

      window.setTimeout(() => {
        const current = reference.deref();
        if (current === undefined) return;
        this.restoreStyle(current, 'outline', outline, outlinePriority);
        this.restoreStyle(current, 'outline-offset', outlineOffset, outlineOffsetPriority);
      }, 1_500);
    });
    return button;
  }

  private restoreStyle(element: HTMLElement, property: string, value: string, priority: string): void {
    if (value === '') element.style.removeProperty(property);
    else element.style.setProperty(property, value, priority);
  }

  private createLabelActions(target: GroundTruthTarget): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'label-actions';
    const decisions: Array<[string, HumanDecision]> = [
      ['THIS IS A POST', 'THIS_IS_A_POST'],
      ['NOT A POST', 'NOT_A_POST'],
      ['NESTED', 'NESTED']
    ];

    for (const [label, decision] of decisions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        this.options.onLabel?.(target, decision);
        container.replaceChildren(document.createTextNode(`Labeled: ${label}`));
      }, { once: true });
      container.append(button);
    }

    return container;
  }

  private classFor(classification: PipelineObservation['detection']['classification']): string {
    if (classification === 'TOP_LEVEL_FEED_UNIT') return 'accepted';
    if (classification === 'NESTED_CONTENT') return 'nested';
    return 'uncertain';
  }
}
