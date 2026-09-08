import { startProbe } from '../bootstrap';
import { MutationPipeline } from './observer';

void startProbe();

const mutationPipeline = new MutationPipeline();
mutationPipeline.start();
