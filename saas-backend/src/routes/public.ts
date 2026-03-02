import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/public/request-access — no auth required
router.post('/request-access', async (req: Request, res: Response) => {
  try {
    const { companyName, industry, monthlyBatches, contactEmail } = req.body;

    if (!companyName || !industry || !monthlyBatches || !contactEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const request = await prisma.pendingRequest.create({
      data: {
        companyName,
        industry,
        monthlyBatches: Number(monthlyBatches),
        contactEmail,
      },
    });

    console.log(`[Request Access] New request from ${companyName} (${contactEmail})`);
    res.status(201).json({ success: true, id: request.id });
  } catch (error) {
    console.error('Error saving request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/batches/:id — no auth, for consumer-facing verify page
router.get('/batches/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        order: true,
        company: { select: { name: true, stages: true } },
        riskEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    res.json(batch);
  } catch (error) {
    console.error('Error fetching public batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
