import type { Request, Response, NextFunction } from 'express';
const { PrismaClient } = require('@prisma/client');
import type { User, Role } from '@prisma/client';
const { adminAuth } = require('../config/firebase-admin');

const prisma = new PrismaClient();

// Extending Express Request to include our authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1] || '';
    let firebaseUid: string;

    // Use mock tokens in development when Firebase is not configured
    if (process.env.USE_MOCK_AUTH === 'true') {
      if (token === 'mock-admin-token') firebaseUid = 'mock-admin-uid-123';
      else if (token === 'mock-manager-token') firebaseUid = 'mock-manager-uid-123';
      else if (token === 'mock-employee-token') firebaseUid = 'mock-employee-uid-123';
      else firebaseUid = token;
    } else {
      // Real Firebase Admin SDK token verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      firebaseUid = decodedToken.uid;
    }

    // Tenant isolation: Load user from DB. The `companyId` is stored on the user.
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found in database' });
    }

    // Inject user (including tenant companyId and role) into request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { authenticate };
