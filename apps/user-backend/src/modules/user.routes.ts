import { Router } from 'express';

const router = Router();

router.get('/products', (req, res) => {
    res.json({
        products: [
            { id: 1, name: 'Widget A', price: 100 },
            { id: 2, name: 'Widget B', price: 200 },
        ]
    });
});

export default router;
