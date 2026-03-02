import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireEmployee } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/orders - Create an Order
router.post('/', requireEmployee, async (req: Request, res: Response) => {
  try {
    const { description, quantity, expectedIntervalMinutes } = req.body;

    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const companyId = req.user!.companyId;

    const newOrder = await prisma.order.create({
      data: {
        description,
        amount: 0,
        quantity: quantity || 1,
        expectedIntervalMinutes: expectedIntervalMinutes || 120,
        companyId,
      },
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders - List Orders with batch counts
router.get('/', requireEmployee, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const orders = await prisma.order.findMany({
      where: { companyId },
      include: {
        batches: {
          select: { id: true, status: true, currentStage: true, batchNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get specific order with batches
router.get('/:id', requireEmployee, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, companyId },
      include: {
        batches: {
          include: {
            riskEvents: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/batches — create a batch under an order
router.post('/:id/batches', requireEmployee, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { id: orderId } = req.params;
    const { batchNumber } = req.body;

    const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const batch = await prisma.batch.create({
      data: {
        batchNumber: batchNumber || `B-${Date.now()}`,
        companyId,
        orderId,
      },
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
