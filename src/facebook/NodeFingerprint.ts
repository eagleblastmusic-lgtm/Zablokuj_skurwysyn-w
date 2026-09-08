export interface StructuralFeatureVector {
  readonly tagName: string;
  readonly role: string | null;
  readonly hasAriaPosInSet: boolean;
  readonly childElementCount: number;
  readonly buttonCount: number;
  readonly linkCount: number;
  readonly mediaCount: number;
  readonly nestedArticleCount: number;
  readonly textLengthBucket: number;
  readonly textHash: string;
}

export interface NodeFingerprintResult {
  readonly id: string;
  readonly features: StructuralFeatureVector;
}

export class NodeFingerprint {
  fingerprint(node: HTMLElement): NodeFingerprintResult {
    const normalizedText = (node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 4096);
    const features: StructuralFeatureVector = {
      tagName: node.tagName,
      role: node.getAttribute('role'),
      hasAriaPosInSet: node.hasAttribute('aria-posinset'),
      childElementCount: node.childElementCount,
      buttonCount: node.querySelectorAll('[role="button"], button').length,
      linkCount: node.querySelectorAll('a').length,
      mediaCount: node.querySelectorAll('img, video, canvas').length,
      nestedArticleCount: node.querySelectorAll('[role="article"]').length,
      textLengthBucket: Math.min(63, Math.floor(normalizedText.length / 64)),
      textHash: this.hash(normalizedText)
    };

    return {
      id: this.hash(JSON.stringify(features)),
      features
    };
  }

  private hash(value: string): string {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}
