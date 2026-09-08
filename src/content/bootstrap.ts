import { startProbe } from '../bootstrap';
import { SpaNavigationObserver } from '../facebook/SpaNavigationObserver';
import { MutationPipeline } from './observer';

void startProbe();

const mutationPipeline = new MutationPipeline();
const spaNavigationObserver = new SpaNavigationObserver(() => {
  mutationPipeline.stop();
  mutationPipeline.start();
});

mutationPipeline.start();
spaNavigationObserver.start();

window.addEventListener(
  'pagehide',
  () => {
    spaNavigationObserver.stop();
    mutationPipeline.stop();
  },
  { once: true }
);
