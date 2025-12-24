import { Worker } from 'bullmq';
import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';

const codebuild = new CodeBuildClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const startProvisioningWorker = () => {
    console.log('[Worker] Starting Provisioning Worker (CodeBuild Mode)...');

    const worker = new Worker('provisioning-jobs', async job => {
        const { tenantId, subdomain, tier } = job.data;
        console.log(`[Worker] Processing job ${job.id}: Triggering CodeBuild for ${subdomain}...`);

        try {
            const command = new StartBuildCommand({
                projectName: process.env.CODEBUILD_PROJECT_NAME || 'b2b-demo-provisioning',
                environmentVariablesOverride: [
                    { name: 'TENANT_ID', value: String(tenantId), type: 'PLAINTEXT' },
                    { name: 'SUBDOMAIN', value: subdomain, type: 'PLAINTEXT' },
                    { name: 'TIER', value: tier, type: 'PLAINTEXT' },
                    { name: 'CPU_LIMIT', value: tier === 'macro' ? '2000m' : '500m', type: 'PLAINTEXT' }
                ]
            });

            const response = await codebuild.send(command);
            const buildId = response.build?.id;

            console.log(`[Worker] CodeBuild Triggered successfully! Build ID: ${buildId}`);
            console.log(`[Worker] Logs available at: ${response.build?.logs?.deepLink}`);

            // Note: In a real app, we might poll for completion or use EventBridge -> Webhook to update status.
            // For now, we assume trigger success = job success.
            return { buildId };

        } catch (error: any) {
            console.error(`[Worker] Job ${job.id} FAILED to trigger CodeBuild.`, error);
            throw error;
        }
    }, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: 6379
        }
    });

    worker.on('completed', job => {
        console.log(`[Worker] Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`[Worker] Job ${job?.id} has failed with ${err.message}`);
    });
};
