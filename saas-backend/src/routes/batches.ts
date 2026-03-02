import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
const { recordRiskEvent } = require('../../../supply_chain_recorder');

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// PUT /api/batches/:id/status - Update batch status and check risk
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, timeElapsedMinutes, expectedIntervalMinutes } = req.body;

    if (!stage || timeElapsedMinutes === undefined || expectedIntervalMinutes === undefined) {
       res.status(400).json({ error: 'Missing required fields' });
       return;
    }

    const companyId = req.user!.companyId;

    // Verify batch belongs to company
    const batch = await prisma.batch.findFirst({
      where: { id, companyId },
    });

    if (!batch) {
       res.status(404).json({ error: 'Batch not found' });
       return;
    }

    // Update the batch's current stage
    await prisma.batch.update({
      where: { id },
      data: { currentStage: stage, status: 'in-progress' },
    });

    // Call FastAPI service to analyze risk
    let riskResponse;
    try {
      riskResponse = await fetch('http://localhost:8000/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: id, stage, timeElapsedMinutes, expectedIntervalMinutes }),
      });
      if (!riskResponse.ok) throw new Error('FastAPI error');
    } catch (apiError) {
      console.warn('FastAPI unavailable, using low-risk fallback:', apiError);
      // Graceful fallback — don't fail the request if AI service is down
      res.json({ message: 'Batch stage updated. Risk analyzer unavailable.', risk: { 'Risk Type': 'Low Risk', 'Confidence Score': 0.1 } });
      return;
    }

    const riskData = await riskResponse.json();
    
    // If high-confidence risk, trigger Algorand and record to DB
    if (riskData['Risk Type'] === 'High Latency Risk' && riskData['Confidence Score'] > 0.7) {
      try {
        console.log('High risk detected, triggering Algorand transaction...');
        
        const algorandPayload = {
          "Batch ID": id,
          "Risk Type": riskData['Risk Type'],
          "Confidence Score": riskData['Confidence Score'],
          "Stage": stage,
          "Timestamp": new Date().toISOString()
        };

        const txId = await recordRiskEvent(algorandPayload);
        
        // Persist risk event and TxID to DB
        await prisma.$transaction([
          prisma.batch.update({
            where: { id },
            data: { algorandTxId: txId },
          }),
          prisma.riskEvent.create({
            data: {
              riskType: riskData['Risk Type'],
              confidenceScore: riskData['Confidence Score'],
              stage,
              algorandTxId: txId,
              batchId: id,
              companyId,
            },
          }),
        ]);
        
        res.json({ 
          message: 'Batch updated. High risk detected and recorded on Algorand.',
          risk: riskData,
          algorandTxId: txId
        });
        return;
      } catch (algoError) {
        console.error('Error recording to Algorand:', algoError);
        // Still save the risk event without a TxID
        await prisma.riskEvent.create({
          data: {
            riskType: riskData['Risk Type'],
            confidenceScore: riskData['Confidence Score'],
            stage,
            algorandTxId: null,
            batchId: id,
            companyId,
          },
        });
        res.status(500).json({ error: 'Risk detected but failed to log to Algorand' });
        return;
      }
    }

    // Low/medium risk — still save the event
    await prisma.riskEvent.create({
      data: {
        riskType: riskData['Risk Type'],
        confidenceScore: riskData['Confidence Score'],
        stage,
        algorandTxId: null,
        batchId: id,
        companyId,
      },
    });

    res.json({ message: 'Batch updated successfully.', risk: riskData });
  } catch (error) {
    console.error('Error updating batch status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/batches/risks — list all risk events for company
router.get('/risks', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const events = await prisma.riskEvent.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { batch: { select: { batchNumber: true, currentStage: true } } },
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching risk events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/batches — create a batch for an order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderId, batchNumber } = req.body;
    const companyId = req.user!.companyId;

    if (!batchNumber) {
      res.status(400).json({ error: 'batchNumber required' });
      return;
    }

    const batch = await prisma.batch.create({
      data: { batchNumber, companyId, orderId: orderId || null },
    });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/batches/:id/complete — mark batch complete
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const batch = await prisma.batch.updateMany({
      where: { id, companyId },
      data: { status: 'complete' },
    });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
