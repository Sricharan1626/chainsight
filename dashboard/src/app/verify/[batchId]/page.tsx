import { notFound } from 'next/navigation';
import { getBatch, getCompany, getBatchEntriesByBatch, getRiskEventsByBatch } from '@/lib/firestore';
import { CertificateOfAuthenticity } from '@/components/ui/CertificateOfAuthenticity';

// This makes the route dynamic
export const dynamic = 'force-dynamic';

async function getBatchData(batchId: string) {
  try {
    // Read batch directly from Firestore
    const batch = await getBatch(batchId);
    if (!batch) return null;

    // Get company details
    const company = await getCompany(batch.companyId);
    if (!company) return null;

    // Get risk events for this batch
    const riskEvents = await getRiskEventsByBatch(batchId);

    // Get batch entries
    const entries = await getBatchEntriesByBatch(batchId);

    const stages = company.stages || [];
    const currentStageIdx = stages.indexOf(batch.currentStage);

    return {
      batchId: batch.id || batchId,
      productName: `Batch ${batch.batchNumber}`,
      origin: company.name,
      producer: company.name,
      harvestDate: batch.createdAt
        ? new Date(batch.createdAt.seconds * 1000).toISOString()
        : new Date().toISOString(),
      algorandTxId: batch.algorandTxId || '',
      status: (batch.status === 'complete' ? 'Complete' : 'In Progress') as 'Complete' | 'In Progress',
      certifier: batch.algorandTxId
        ? 'Verified on Algorand Blockchain'
        : 'Pending Blockchain Verification',
      stages: stages.map((name: string, i: number) => ({
        id: `stage-${i}`,
        name,
        status: (i < currentStageIdx
          ? 'completed'
          : i === currentStageIdx
            ? (batch.status === 'complete' ? 'completed' : 'in-progress')
            : 'pending') as 'completed' | 'in-progress' | 'pending',
        timestamp: batch.updatedAt
          ? new Date(batch.updatedAt.seconds * 1000).toISOString()
          : undefined,
        location: company.name,
        description: entries
          .filter((e) => e.stage === name)
          .map((e) => `[${e.entryType}] ${e.notes}`)
          .join(' | ') || `${name} stage`,
      })),
      aiRiskEvents: riskEvents.map((ev) => ({
        title: ev.riskType,
        description: `Stage: ${ev.stage} — Confidence: ${Math.round(ev.confidenceScore * 100)}%`,
        timestamp: ev.createdAt
          ? new Date(ev.createdAt.seconds * 1000).toISOString()
          : new Date().toISOString(),
        riskLevel: (ev.confidenceScore > 0.7
          ? 'high'
          : ev.confidenceScore > 0.4
            ? 'medium'
            : 'low') as 'high' | 'medium' | 'low',
        location: ev.stage,
      })),
    };
  } catch (err) {
    console.error('Error fetching batch data from Firestore:', err);
    return null;
  }
}

export default async function VerifyBatchPage({
  params,
}: {
  params: { batchId: string } | Promise<{ batchId: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const { batchId } = resolvedParams;

  const data = await getBatchData(batchId);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <CertificateOfAuthenticity data={data} />
      </div>
    </main>
  );
}
