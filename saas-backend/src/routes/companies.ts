import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

// POST /api/companies - Create a new company (public for initialization)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, adminEmail, adminFirebaseUid } = req.body;

    if (!name || !adminEmail || !adminFirebaseUid) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({ data: { name } });
      await tx.user.create({
        data: { email: adminEmail, firebaseUid: adminFirebaseUid, role: 'Admin', companyId: newCompany.id },
      });
      return newCompany;
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/companies/:companyId/stages — save custom stages (Admin only)
router.put('/:companyId/stages', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { stages } = req.body;

    if (req.user?.companyId !== companyId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!stages || !Array.isArray(stages)) {
      res.status(400).json({ error: 'stages must be an array' });
      return;
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { stages },
    });

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/companies/:companyId/users — list users (Admin only)
router.get('/:companyId/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    if (req.user?.companyId !== companyId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/companies/:companyId/users - Add a user to a company (Admin only)
router.post('/:companyId/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { email, firebaseUid, role } = req.body;

    if (req.user?.companyId !== companyId) {
      res.status(403).json({ error: 'Forbidden: You can only add users to your own company' });
      return;
    }

    if (!email || !firebaseUid) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const newUser = await prisma.user.create({
      data: { email, firebaseUid, role: role || 'Employee', companyId },
    });

    console.log(`[EMAIL STUB] Invite sent to ${email} for company ${companyId}`);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
