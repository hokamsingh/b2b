import { Queue } from 'bullmq';

// 1. Setup Queue
export const provisioningQueue = new Queue('provisioning-jobs', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379
    }
});

// 2. Trigger Function
export const triggerProvisioning = async (tenantId: number, subdomain: string) => {
    console.log(`[Master] Queuing provisioning job for ${subdomain}...`);
    await provisioningQueue.add('provision-tenant', {
        tenantId,
        subdomain,
        tier: 'micro' // Default start size
    });
};

// 3. Worker logic (would run in a separate processor file/process)
/*
import { Worker } from 'bullmq';
const worker = new Worker('provisioning-jobs', async job => {
  // Run Terraform / Helm commands here
  // exec('helm install ...')
}, { connection: ... });
*/
