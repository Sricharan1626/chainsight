import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

// Super-admin guard: only Role.SuperAdmin can access
const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== 'SuperAdmin') {
    res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
    return;
  }
  next();
};

router.use(authenticate);
router.use(requireSuperAdmin);

// GET /api/admin/requests — list all pending requests
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.pendingRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/requests/:id/approve — approve a request and provision company
router.post('/requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.pendingRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Request is not in PENDING state' });
      return;
    }

    // Create the company and update request status in a transaction
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: { name: request.companyName },
      });

      await tx.pendingRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      return newCompany;
    });

    // SendGrid stub — in production this would send a real invite email
    console.log(`
[EMAIL STUB] Invite sent to: ${request.contactEmail}
Subject: Welcome to ChainSight — Set up your account
Body: 
  Hello from ChainSight!
  Your company "${request.companyName}" has been approved.
  Your Company ID is: ${company.id}
  Click here to set up your Admin account: https://app.chainsight.ai/login?company=${company.id}
    `);

    res.status(201).json({
      success: true,
      companyId: company.id,
      message: `Company "${request.companyName}" provisioned. Invite email logged to console.`,
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/requests/:id/reject
router.post('/requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.pendingRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
