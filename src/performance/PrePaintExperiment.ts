export type PrePaintStrategy = 'NO_GUARD' | 'SCOPED_GUARD' | 'TEMPORARY_PLACEHOLDER';

export interface PrePaintSample {
  readonly strategy: PrePaintStrategy;
  readonly insertionToDetectionMs: number | null;
  readonly insertionToDecisionMs: number;
  readonly decisionToNextFrameMs: number;
}

export interface PrePaintOptions {
  readonly onSample?: (sample: PrePaintSample) => void;
  readonly now?: () => number;
  readonly scheduleFrame?: (callback: FrameRequestCallback) => number;
}

interface GuardState {
  readonly insertedAt: number;
  detectedAt: number | null;
  readonly originalVisibility: string;
  readonly originalDisplay: string;
  readonly placeholder: HTMLDivElement | null;
}

const TARGET_SELECTOR = '[aria-posinset], [role="article"]';

export class PrePaintExperiment {
  private readonly states = new WeakMap<HTMLElement, GuardState>();
  private readonly activeGuards = new Set<HTMLElement>();
  private strategy: PrePaintStrategy = 'NO_GUARD';

  constructor(private readonly options: PrePaintOptions = {}) {}

  setStrategy(strategy: PrePaintStrategy): void {
    this.releaseAll();
    this.strategy = strategy;
  }

  currentStrategy(): PrePaintStrategy {
    return this.strategy;
  }

  prepareAddedSubtree(root: HTMLElement): void {
    const targets = new Set<HTMLElement>();
    if (root.matches(TARGET_SELECTOR)) targets.add(root);
    for (const target of root.querySelectorAll<HTMLElement>(TARGET_SELECTOR)) targets.add(target);

    for (const target of targets) this.prepare(target);
  }

  markDetected(node: HTMLElement): void {
    const state = this.states.get(node);
    if (state !== undefined && state.detectedAt === null) state.detectedAt = this.now();
  }

  decisionReady(node: HTMLElement): void {
    const state = this.states.get(node);
    if (state === undefined) return;

    const strategyAtDecision = this.strategy;
    const decisionAt = this.now();
    this.release(node, state);

    this.scheduleFrame(() => {
      const frameAt = this.now();
      this.options.onSample?.({
        strategy: strategyAtDecision,
        insertionToDetectionMs: state.detectedAt === null ? null : Math.max(0, state.detectedAt - state.insertedAt),
        insertionToDecisionMs: Math.max(0, decisionAt - state.insertedAt),
        decisionToNextFrameMs: Math.max(0, frameAt - decisionAt)
      });
    });
  }

  releaseRemovedSubtree(root: HTMLElement): void {
    const elements: HTMLElement[] = [root, ...root.querySelectorAll<HTMLElement>(TARGET_SELECTOR)];
    for (const element of elements) {
      const state = this.states.get(element);
      if (state !== undefined) this.release(element, state);
    }
  }

  releaseAll(): void {
    for (const node of [...this.activeGuards]) {
      const state = this.states.get(node);
      if (state !== undefined) this.release(node, state);
      else this.activeGuards.delete(node);
    }
  }

  activeGuardCount(): number {
    return this.activeGuards.size;
  }

  private prepare(node: HTMLElement): void {
    if (this.states.has(node)) return;

    const originalVisibility = node.style.visibility;
    const originalDisplay = node.style.display;
    let placeholder: HTMLDivElement | null = null;

    if (this.strategy === 'SCOPED_GUARD') {
      node.style.setProperty('visibility', 'hidden', 'important');
    } else if (this.strategy === 'TEMPORARY_PLACEHOLDER') {
      placeholder = document.createElement('div');
      placeholder.dataset.m0PrepaintPlaceholder = 'true';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.minHeight = '64px';
      placeholder.style.borderRadius = '8px';
      placeholder.style.background = 'rgba(127, 127, 127, 0.12)';
      node.before(placeholder);
      node.style.setProperty('display', 'none', 'important');
    }

    this.states.set(node, {
      insertedAt: this.now(),
      detectedAt: null,
      originalVisibility,
      originalDisplay,
      placeholder
    });
    this.activeGuards.add(node);
  }

  private release(node: HTMLElement, state: GuardState): void {
    if (state.originalVisibility === '') node.style.removeProperty('visibility');
    else node.style.visibility = state.originalVisibility;

    if (state.originalDisplay === '') node.style.removeProperty('display');
    else node.style.display = state.originalDisplay;

    state.placeholder?.remove();
    this.states.delete(node);
    this.activeGuards.delete(node);
  }

  private now(): number {
    return this.options.now?.() ?? performance.now();
  }

  private scheduleFrame(callback: FrameRequestCallback): number {
    return this.options.scheduleFrame?.(callback) ?? requestAnimationFrame(callback);
  }
}
