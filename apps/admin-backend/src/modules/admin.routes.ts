import { Router } from 'express';

const router = Router();

router.get('/settings', (req, res) => {
    res.json({
        theme: 'dark',
        maintenanceMode: false
    });
});

router.post('/settings', (req, res) => {
    // Mock saving settings
    res.json({ status: 'updated' });
});

export default router;
