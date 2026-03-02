import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Expects `req.user` to be populated by the `authenticate` middleware.
 */
const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated properly' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole 
      });
    }

    next();
  };
};

/**
 * Convenience middleware for specific roles
 */
const requireAdmin = requireRole(['Admin']);
const requireManagerOrAdmin = requireRole(['Admin', 'Manager']);
const requireEmployee = requireRole(['Admin', 'Manager', 'Employee']);

module.exports = {
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  requireEmployee
};
