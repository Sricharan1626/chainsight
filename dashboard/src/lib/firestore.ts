import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PendingRequest {
  id?: string;
  companyName: string;
  industry: string;
  monthlyBatches: number;
  contactEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: Timestamp;
}

export interface Company {
  id?: string;
  name: string;
  stages: string[];
  industry?: string;
  website?: string;
  timezone?: string;
  ownerEmail?: string;
  createdAt?: Timestamp;
}

export interface AppUser {
  id?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  companyId: string;
  firebaseUid: string;
  createdAt?: Timestamp;
}

export interface CompanyRole {
  id?: string;
  email: string;
  roleName: string;
  access: string[];
  assignedStage: string;
  companyId: string;
  createdAt?: Timestamp;
}

export interface Order {
  id?: string;
  description: string;
  quantity: number;
  expectedIntervalMinutes: number;
  status: string;
  companyId: string;
  createdAt?: Timestamp;
}

export interface Batch {
  id?: string;
  batchNumber: string;
  currentStage: string;
  status: 'pending' | 'in-progress' | 'complete';
  algorandTxId?: string;
  orderId: string;
  companyId: string;
  stageStartedAt?: Timestamp;
  stageDurations?: Record<string, number>; // stage name -> days taken
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RiskEvent {
  id?: string;
  riskType: string;
  confidenceScore: number;
  stage: string;
  algorandTxId?: string;
  batchId: string;
  batchNumber?: string;
  companyId: string;
  createdAt?: Timestamp;
}

export interface BatchEntry {
  id?: string;
  batchId: string;
  batchNumber?: string;
  orderId: string;
  companyId: string;
  stage: string;
  entryType: string;
  notes: string;
  stageData?: Record<string, string | number | boolean>;
  algorandTxId?: string;
  quantity?: number;
  temperature?: number;
  location?: string;
  submittedBy: string;
  submittedByEmail: string;
  roleName: string;
  createdAt?: Timestamp;
}

// ──────────────────────────────────────────────
// Generic helpers
// ──────────────────────────────────────────────

function docToObj<T>(docSnap: DocumentData & { id: string }): T {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return { ...data, id: docSnap.id } as T;
}

// ──────────────────────────────────────────────
// Pending Requests
// ──────────────────────────────────────────────

const requestsCol = () => collection(db, 'pending_requests');

export async function createRequest(data: Omit<PendingRequest, 'id' | 'status' | 'createdAt'>) {
  return addDoc(requestsCol(), { ...data, status: 'PENDING', createdAt: serverTimestamp() });
}

export async function getRequests(statusFilter?: string) {
  const constraints: QueryConstraint[] = [];
  if (statusFilter) constraints.push(where('status', '==', statusFilter));
  const snap = await getDocs(query(requestsCol(), ...constraints));
  return snap.docs.map((d) => docToObj<PendingRequest>(d));
}

export async function updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  return updateDoc(doc(db, 'pending_requests', id), { status });
}

// ──────────────────────────────────────────────
// Companies
// ──────────────────────────────────────────────

const companiesCol = () => collection(db, 'companies');

export async function createCompany(data: Omit<Company, 'id' | 'createdAt'>) {
  return addDoc(companiesCol(), { ...data, createdAt: serverTimestamp() });
}

export async function getCompany(id: string) {
  const snap = await getDoc(doc(db, 'companies', id));
  return snap.exists() ? docToObj<Company>(snap) : null;
}

export async function updateCompany(id: string, data: Partial<Company>) {
  return updateDoc(doc(db, 'companies', id), data);
}

export async function getCompaniesByOwnerEmail(email: string) {
  const snap = await getDocs(query(companiesCol(), where('ownerEmail', '==', email)));
  return snap.empty ? null : docToObj<Company>(snap.docs[0]);
}

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

const usersCol = () => collection(db, 'users');

export async function createAppUser(data: Omit<AppUser, 'id' | 'createdAt'>) {
  return addDoc(usersCol(), { ...data, createdAt: serverTimestamp() });
}

export async function getAppUserByUid(uid: string) {
  const snap = await getDocs(query(usersCol(), where('firebaseUid', '==', uid)));
  return snap.empty ? null : docToObj<AppUser>(snap.docs[0]);
}

export async function getAppUserByEmail(email: string) {
  const snap = await getDocs(query(usersCol(), where('email', '==', email)));
  return snap.empty ? null : docToObj<AppUser>(snap.docs[0]);
}

export async function updateAppUser(id: string, data: Partial<AppUser>) {
  return updateDoc(doc(db, 'users', id), data);
}

export async function getUsersByCompany(companyId: string) {
  const snap = await getDocs(query(usersCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<AppUser>(d));
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

const ordersCol = () => collection(db, 'orders');

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>) {
  return addDoc(ordersCol(), { ...data, createdAt: serverTimestamp() });
}

export async function getOrdersByCompany(companyId: string) {
  const snap = await getDocs(query(ordersCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<Order>(d));
}

export async function getOrder(id: string) {
  const snap = await getDoc(doc(db, 'orders', id));
  return snap.exists() ? docToObj<Order>(snap) : null;
}

// ──────────────────────────────────────────────
// Batches
// ──────────────────────────────────────────────

const batchesCol = () => collection(db, 'batches');

export async function createBatch(data: Omit<Batch, 'id' | 'createdAt' | 'updatedAt' | 'stageStartedAt'>) {
  return addDoc(batchesCol(), { ...data, stageStartedAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function getBatchesByOrder(orderId: string) {
  const snap = await getDocs(query(batchesCol(), where('orderId', '==', orderId)));
  return snap.docs.map((d) => docToObj<Batch>(d));
}

export async function getBatchesByCompany(companyId: string) {
  const snap = await getDocs(query(batchesCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<Batch>(d));
}

export async function getBatch(id: string) {
  const snap = await getDoc(doc(db, 'batches', id));
  return snap.exists() ? docToObj<Batch>(snap) : null;
}

export async function updateBatch(id: string, data: Partial<Batch> & { resetStageTimer?: boolean }) {
  const { resetStageTimer, ...rest } = data;
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) clean[k] = v;
  }
  // When advancing stages, reset the stage timer
  if (resetStageTimer) {
    clean.stageStartedAt = serverTimestamp();
  }
  return updateDoc(doc(db, 'batches', id), clean);
}

// ──────────────────────────────────────────────
// Risk Events
// ──────────────────────────────────────────────

const riskEventsCol = () => collection(db, 'risk_events');

export async function createRiskEvent(data: Omit<RiskEvent, 'id' | 'createdAt'>) {
  return addDoc(riskEventsCol(), { ...data, createdAt: serverTimestamp() });
}

export async function getRiskEventsByCompany(companyId: string) {
  const snap = await getDocs(query(riskEventsCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<RiskEvent>(d));
}

export async function getRiskEventsByBatch(batchId: string) {
  const snap = await getDocs(query(riskEventsCol(), where('batchId', '==', batchId)));
  return snap.docs.map((d) => docToObj<RiskEvent>(d));
}

// ──────────────────────────────────────────────
// Real-time listeners (for dashboard)
// ──────────────────────────────────────────────

export function onBatchesSnapshot(companyId: string, callback: (batches: Batch[]) => void) {
  const q = query(batchesCol(), where('companyId', '==', companyId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj<Batch>(d)));
  });
}

export function onRiskEventsSnapshot(companyId: string, callback: (events: RiskEvent[]) => void) {
  const q = query(riskEventsCol(), where('companyId', '==', companyId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToObj<RiskEvent>(d)));
  });
}

// ──────────────────────────────────────────────
// Company Roles
// ──────────────────────────────────────────────

const companyRolesCol = () => collection(db, 'company_roles');

export async function createCompanyRole(data: Omit<CompanyRole, 'id' | 'createdAt'>) {
  return addDoc(companyRolesCol(), { ...data, createdAt: serverTimestamp() });
}

export async function getRolesByCompany(companyId: string) {
  const snap = await getDocs(query(companyRolesCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<CompanyRole>(d));
}

export async function getRoleByEmail(email: string) {
  const snap = await getDocs(query(companyRolesCol(), where('email', '==', email)));
  return snap.empty ? null : docToObj<CompanyRole>(snap.docs[0]);
}

export async function deleteCompanyRole(id: string) {
  return deleteDoc(doc(db, 'company_roles', id));
}

// ──────────────────────────────────────────────
// Batch Entries (role-based data writing)
// ──────────────────────────────────────────────

const batchEntriesCol = () => collection(db, 'batch_entries');

export async function createBatchEntry(data: Omit<BatchEntry, 'id' | 'createdAt'>) {
  // Firestore rejects undefined values — strip them out
  const clean: Record<string, unknown> = { createdAt: serverTimestamp() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  return addDoc(batchEntriesCol(), clean);
}

export async function getBatchEntriesByBatch(batchId: string) {
  const snap = await getDocs(query(batchEntriesCol(), where('batchId', '==', batchId)));
  return snap.docs.map((d) => docToObj<BatchEntry>(d));
}

export async function getBatchEntriesByCompany(companyId: string) {
  const snap = await getDocs(query(batchEntriesCol(), where('companyId', '==', companyId)));
  return snap.docs.map((d) => docToObj<BatchEntry>(d));
}

export async function updateBatchEntry(id: string, data: Partial<BatchEntry>) {
  return updateDoc(doc(db, 'batch_entries', id), data);
}
