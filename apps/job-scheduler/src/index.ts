import { startScheduler } from './modules/scheduler.service';
import { SHARED_CONSTANT } from '@b2b-demo/shared';

console.log(`[Job Scheduler] Starting... Shared: ${SHARED_CONSTANT}`);
startScheduler();
