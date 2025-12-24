import express from 'express';
import cors from 'cors';
import { SHARED_CONSTANT } from '@b2b-demo/shared';
// We need to fix imports since we moved files
import userRoutes from './modules/user.routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);

app.get('/api/user/config', (req, res) => {
    // In real app, fetch from DB or Admin Service
    res.json({ theme: 'light', tenant: 'Tenant A' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-backend', shared: SHARED_CONSTANT });
});

app.listen(PORT, () => {
    console.log(`User Backend running on port ${PORT}`);
});
