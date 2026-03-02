import { NextResponse, NextRequest } from 'next/server';
import { recordBatchOnChain, getExplorerUrl, type BatchPayload } from '@/lib/algorand';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchId, batchNumber, companyName, currentStage, status, entries, entryId } = body;

    if (!batchId || typeof batchId !== 'string') {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    // Build the payload from client-supplied data
    const payload: BatchPayload = {
      batchId,
      batchNumber: batchNumber || 'Unknown',
      companyName: companyName || 'Unknown',
      currentStage: currentStage || 'Complete',
      status: status || 'complete',
      entries: entries || [],
      recordedAt: new Date().toISOString(),
    };

    // Record on Algorand Testnet
    const txId = await recordBatchOnChain(payload);

    let firestoreUpdated = false;

    // Save TxID back to the batch document
    try {
      const batchRef = doc(db, 'batches', batchId);
      await updateDoc(batchRef, {
        algorandTxId: txId,
        updatedAt: serverTimestamp(),
      });
      firestoreUpdated = true;
    } catch (firestoreErr) {
      console.warn('Batch Firestore update failed:', firestoreErr);
    }

    // Also update the batch_entry with the txId (if entryId provided)
    if (entryId && typeof entryId === 'string') {
      try {
        const entryRef = doc(db, 'batch_entries', entryId);
        await updateDoc(entryRef, {
          algorandTxId: txId,
        });
      } catch (entryErr) {
        console.warn('BatchEntry Firestore update failed:', entryErr);
      }
    }

    return NextResponse.json({
      txId,
      explorerUrl: getExplorerUrl(txId),
      firestoreUpdated,
    });
  } catch (error) {
    console.error('Algorand record error:', error);
    const message = error instanceof Error ? error.message : 'Failed to record on Algorand';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
