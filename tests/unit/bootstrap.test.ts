import { describe, expect, it } from 'vitest';
import { probeBootstrapInfo, startProbe } from '../../src/bootstrap';

describe('probe bootstrap', () => {
  it('exposes stable M0 bootstrap metadata', () => {
    expect(startProbe()).toEqual(probeBootstrapInfo);
    expect(probeBootstrapInfo.stage).toBe('M0');
    expect(probeBootstrapInfo.target).toBe('facebook-dom-probe');
  });
});
