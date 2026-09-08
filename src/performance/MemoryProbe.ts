export interface MemoryReport {
  readonly heapSamplingAvailable: boolean;
  readonly heapSamples: number;
  readonly initialUsedJsHeapBytes: number | null;
  readonly latestUsedJsHeapBytes: number | null;
  readonly heapDeltaBytes: number | null;
  readonly observerActive: boolean;
  readonly observerStarts: number;
  readonly observerStops: number;
  readonly cleanupBalanced: boolean;
}

interface ChromePerformanceMemory {
  readonly usedJSHeapSize?: number;
}

export class MemoryProbe {
  private readonly heapSamples: number[] = [];
  private observerActive = false;
  private observerStarts = 0;
  private observerStops = 0;

  markObserverStarted(): void {
    if (!this.observerActive) {
      this.observerActive = true;
      this.observerStarts += 1;
    }
    this.sampleHeap();
  }

  markObserverStopped(): void {
    if (this.observerActive) {
      this.observerActive = false;
      this.observerStops += 1;
    }
    this.sampleHeap();
  }

  sampleHeap(): void {
    const memory = (performance as Performance & { memory?: ChromePerformanceMemory }).memory;
    const used = memory?.usedJSHeapSize;
    if (typeof used === 'number' && Number.isFinite(used) && used >= 0) this.heapSamples.push(used);
  }

  report(): MemoryReport {
    const initial = this.heapSamples[0] ?? null;
    const latest = this.heapSamples.at(-1) ?? null;

    return {
      heapSamplingAvailable: this.heapSamples.length > 0,
      heapSamples: this.heapSamples.length,
      initialUsedJsHeapBytes: initial,
      latestUsedJsHeapBytes: latest,
      heapDeltaBytes: initial === null || latest === null ? null : latest - initial,
      observerActive: this.observerActive,
      observerStarts: this.observerStarts,
      observerStops: this.observerStops,
      cleanupBalanced: this.observerActive ? this.observerStarts === this.observerStops + 1 : this.observerStarts === this.observerStops
    };
  }
}
