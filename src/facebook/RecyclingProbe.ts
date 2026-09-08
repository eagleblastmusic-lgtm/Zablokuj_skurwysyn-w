import type { NodeFingerprintResult } from './NodeFingerprint';

export type NodeLifecycleEventType =
  | 'node-created'
  | 'node-removed'
  | 'node-reused'
  | 'fingerprint-changed'
  | 'node-returned';

export interface NodeLifecycleEvent {
  readonly type: NodeLifecycleEventType;
  readonly fingerprintId: string;
  readonly previousFingerprintId?: string;
  readonly generation: number;
  readonly timestamp: number;
}

interface NodeState {
  fingerprintId: string;
  present: boolean;
  generation: number;
}

export class RecyclingProbe {
  private readonly states = new WeakMap<HTMLElement, NodeState>();

  observe(node: HTMLElement, fingerprint: NodeFingerprintResult, timestamp = performance.now()): NodeLifecycleEvent[] {
    const previous = this.states.get(node);

    if (previous === undefined) {
      this.states.set(node, {
        fingerprintId: fingerprint.id,
        present: true,
        generation: 0
      });

      return [
        {
          type: 'node-created',
          fingerprintId: fingerprint.id,
          generation: 0,
          timestamp
        }
      ];
    }

    const events: NodeLifecycleEvent[] = [];

    if (!previous.present) {
      previous.present = true;
      events.push({
        type: 'node-returned',
        fingerprintId: fingerprint.id,
        previousFingerprintId: previous.fingerprintId,
        generation: previous.generation,
        timestamp
      });
    }

    if (previous.fingerprintId !== fingerprint.id) {
      const previousFingerprintId = previous.fingerprintId;
      previous.fingerprintId = fingerprint.id;
      previous.generation += 1;

      events.push(
        {
          type: 'fingerprint-changed',
          fingerprintId: fingerprint.id,
          previousFingerprintId,
          generation: previous.generation,
          timestamp
        },
        {
          type: 'node-reused',
          fingerprintId: fingerprint.id,
          previousFingerprintId,
          generation: previous.generation,
          timestamp
        }
      );
    }

    return events;
  }

  markRemoved(node: HTMLElement, timestamp = performance.now()): NodeLifecycleEvent | null {
    const state = this.states.get(node);
    if (state === undefined || !state.present) return null;

    state.present = false;
    return {
      type: 'node-removed',
      fingerprintId: state.fingerprintId,
      generation: state.generation,
      timestamp
    };
  }
}
