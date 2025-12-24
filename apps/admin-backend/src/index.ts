import express from 'express';
import cors from 'cors';
import { SHARED_CONSTANT } from '@b2b-demo/shared';
import adminRoutes from './modules/admin.routes';
// import { initMasterRoutes } from './master/master.routes'; // We will create this

const app = express();
const PORT = process.env.PORT || 4000;
const IS_MASTER = process.env.IS_MASTER === 'true';

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);

import { createTenant } from './master/tenant.service';
import { startAnalyticsConsumer } from './master/analytics.consumer';

// Placeholder Router for Tenants
import { Router } from 'express';
const tenantRouter = Router();
tenantRouter.post('/', async (req, res) => {
    try {
        const tenant = await createTenant(req.body.name, req.body.subdomain);
        res.json(tenant);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

if (IS_MASTER) {
    console.log('[System] Running in MASTER mode');
    app.use('/tenants', tenantRouter);

    // Start Analytics Consumer
    startAnalyticsConsumer().catch(err => console.error('Failed to start Analytics Consumer', err));

    // Start Provisioning Worker
    const { startProvisioningWorker } = require('./master/provisioning.worker');
    startProvisioningWorker();
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'admin-backend', isMaster: IS_MASTER, shared: SHARED_CONSTANT });
});

app.listen(PORT, () => {
    console.log(`Admin Backend running on port ${PORT}`);
});
