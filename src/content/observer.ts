import type { FeedUnitDetection } from '../facebook/DetectionTypes';
import { FacebookDOMAdapter } from '../facebook/FacebookDOMAdapter';
import { NodeFingerprint, type NodeFingerprintResult } from '../facebook/NodeFingerprint';
import { RecyclingProbe, type NodeLifecycleEvent } from '../facebook/RecyclingProbe';

const STRUCTURAL_ANCHOR_SELECTOR = '[aria-posinset], [role="article"]';

export interface PipelineObservation {
  readonly detection: FeedUnitDetection;
  readonly fingerprint: NodeFingerprintResult;
  readonly lifecycleEvents: readonly NodeLifecycleEvent[];
  readonly batchLatencyMs: number;
}

export interface MutationPipelineOptions {
  readonly onObservation?: (observation: PipelineObservation) => void;
  readonly onLifecycleEvent?: (event: NodeLifecycleEvent) => void;
  readonly scheduleFrame?: (callback: FrameRequestCallback) => number;
  readonly now?: () => number;
}

export class MutationPipeline {
  private observer: MutationObserver | null = null;
  private readonly pendingRoots = new Set<HTMLElement>();
  private readonly processedFingerprints = new WeakMap<HTMLElement, string>();
  private frameScheduled = false;
  private batchQueuedAt: number | null = null;

  constructor(
    private readonly adapter = new FacebookDOMAdapter(),
    private readonly fingerprinter = new NodeFingerprint(),
    private readonly recyclingProbe = new RecyclingProbe(),
    private readonly options: MutationPipelineOptions = {}
  ) {}

  start(root: Node = document.documentElement ?? document): void {
    this.stop();
    this.observer = new MutationObserver((records) => this.handleMutations(records));
    this.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['role', 'aria-posinset', 'href']
    });

    if (document.documentElement !== null) {
      this.queueRoot(document.documentElement);
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.pendingRoots.clear();
    this.frameScheduled = false;
    this.batchQueuedAt = null;
  }

  private handleMutations(records: readonly MutationRecord[]): void {
    for (const record of records) {
      if (record.type === 'childList') {
        for (const removed of record.removedNodes) {
          if (removed instanceof HTMLElement) {
            this.markRemovedTree(removed);
          }
        }

        for (const added of record.addedNodes) {
          if (added instanceof HTMLElement) {
            this.queueRoot(added);
          } else if (record.target instanceof HTMLElement) {
            this.queueRoot(record.target);
          }
        }
      } else if (record.type === 'characterData') {
        const parent = record.target.parentElement;
        if (parent !== null) this.queueRoot(parent);
      } else if (record.target instanceof HTMLElement) {
        this.queueRoot(record.target);
      }
    }
  }

  private queueRoot(node: HTMLElement): void {
    const normalized = node.closest<HTMLElement>(STRUCTURAL_ANCHOR_SELECTOR) ?? node;

    for (const existing of [...this.pendingRoots]) {
      if (existing.contains(normalized)) return;
      if (normalized.contains(existing)) this.pendingRoots.delete(existing);
    }

    this.pendingRoots.add(normalized);
    if (this.batchQueuedAt === null) this.batchQueuedAt = this.now();
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.frameScheduled) return;
    this.frameScheduled = true;
    this.scheduleFrame(() => this.flush());
  }

  private flush(): void {
    const startedAt = this.batchQueuedAt ?? this.now();
    const roots = [...this.pendingRoots];
    this.pendingRoots.clear();
    this.frameScheduled = false;
    this.batchQueuedAt = null;

    for (const root of roots) {
      for (const detection of this.adapter.scan(root)) {
        const node = detection.candidate.node;
        const fingerprint = this.fingerprinter.fingerprint(node);
        const lifecycleEvents = this.recyclingProbe.observe(node, fingerprint, this.now());

        for (const event of lifecycleEvents) {
          this.options.onLifecycleEvent?.(event);
        }

        const previousFingerprint = this.processedFingerprints.get(node);
        if (previousFingerprint === fingerprint.id && lifecycleEvents.length === 0) continue;

        this.processedFingerprints.set(node, fingerprint.id);
        this.options.onObservation?.({
          detection,
          fingerprint,
          lifecycleEvents,
          batchLatencyMs: Math.max(0, this.now() - startedAt)
        });
      }
    }
  }

  private markRemovedTree(root: HTMLElement): void {
    const elements: HTMLElement[] = [root, ...root.querySelectorAll<HTMLElement>('*')];

    for (const element of elements) {
      const event = this.recyclingProbe.markRemoved(element, this.now());
      if (event !== null) this.options.onLifecycleEvent?.(event);
    }
  }

  private scheduleFrame(callback: FrameRequestCallback): number {
    return this.options.scheduleFrame?.(callback) ?? requestAnimationFrame(callback);
  }

  private now(): number {
    return this.options.now?.() ?? performance.now();
  }
}
