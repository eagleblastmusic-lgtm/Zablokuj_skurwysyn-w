export interface ProbeBootstrapInfo {
  readonly name: string;
  readonly version: string;
  readonly stage: 'M0';
  readonly target: 'facebook-dom-probe';
}

export const probeBootstrapInfo: ProbeBootstrapInfo = {
  name: 'Zablokuj_skurwysyn-w',
  version: '0.0.1',
  stage: 'M0',
  target: 'facebook-dom-probe'
};

export function startProbe(): ProbeBootstrapInfo {
  return probeBootstrapInfo;
}
