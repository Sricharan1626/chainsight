import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import companiesRouter from './routes/companies';
import ordersRouter from './routes/orders';
import batchesRouter from './routes/batches';
import publicRouter from './routes/public';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Public routes (no auth)
app.use('/api/public', publicRouter);

// Admin routes (SuperAdmin only)
app.use('/api/admin', adminRouter);

// Tenant routes (authenticated)
app.use('/api/companies', companiesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/batches', batchesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
