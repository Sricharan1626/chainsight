import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface StageScore {
  stage: string;
  trustScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: { onTimeDelivery: number; qualityScore: number; dataCompleteness: number; riskFrequency: number; blockchainVerification: number };
  batchesProcessed: number;
  avgDaysAtStage: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}

function getGrade(score: number): StageScore['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, batches, riskEvents, batchEntries } = await request.json();
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

    const entries = batchEntries as any[];
    const risks = riskEvents as any[];

    const allStages = new Set<string>();
    const completed = batches.filter((b: any) => b.status === 'complete');
    completed.forEach((b: any) => { if (b.stageDurations) Object.keys(b.stageDurations).forEach(s => allStages.add(s)); });
    entries.forEach((e: any) => { if (e.stage) allStages.add(e.stage); });

    const stageScores: StageScore[] = [];

    for (const stage of allStages) {
      const se = entries.filter((e: any) => e.stage === stage);
      const sr = risks.filter((r: any) => r.stage === stage);
      const insights: string[] = [];

      // On-time delivery
      const durations: number[] = [];
      completed.forEach((b: any) => { if (b.stageDurations?.[stage] !== undefined) durations.push(b.stageDurations[stage]); });
      const avgDays = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const onTimeScore = durations.length > 0 ? Math.max(0, Math.min(100, 100 - (avgDays - 1) * 15)) : 50;
      if (avgDays > 5) insights.push(`Avg ${avgDays.toFixed(1)} days — above threshold`);

      // Quality
      const qe = se.filter((e: any) => e.stageData?.inspectionResult || e.stageData?.batchQuality);
      let qualityScore = 75;
      if (qe.length > 0) {
        const good = qe.filter((e: any) => ['Pass', 'Pass with Notes', 'Excellent', 'Good', 'Acceptable'].includes(e.stageData?.inspectionResult || e.stageData?.batchQuality || ''));
        qualityScore = Math.round((good.length / qe.length) * 100);
        if (qualityScore < 60) insights.push(`Quality pass rate only ${qualityScore}%`);
      }

      // Data completeness
      let dataScore = 50;
      if (se.length > 0) {
        const complete = se.filter((e: any) => e.stageData && Object.keys(e.stageData).length >= 3 && e.submittedBy && e.submittedBy !== 'Unknown');
        dataScore = Math.round((complete.length / se.length) * 100);
      }

      // Risk frequency
      const riskScore = sr.length === 0 ? 100 : Math.max(0, 100 - sr.length * 15 - sr.filter((r: any) => r.confidenceScore > 0.7).length * 20);
      if (sr.length > 3) insights.push(`${sr.length} risk events — highest in pipeline`);

      // Blockchain verification
      const onChain = se.filter((e: any) => e.algorandTxId);
      const bcScore = se.length > 0 ? Math.round((onChain.length / se.length) * 100) : 0;

      const trustScore = Math.round(onTimeScore * 0.25 + qualityScore * 0.25 + dataScore * 0.2 + riskScore * 0.15 + bcScore * 0.15);

      let trend: StageScore['trend'] = 'stable';
      if (se.length >= 4) {
        const mid = Math.floor(se.length / 2);
        const f = se.slice(0, mid).filter((e: any) => e.stageData && Object.keys(e.stageData).length >= 3).length / mid;
        const s = se.slice(mid).filter((e: any) => e.stageData && Object.keys(e.stageData).length >= 3).length / (se.length - mid);
        if (s > f + 0.15) trend = 'improving';
        else if (s < f - 0.15) trend = 'declining';
      }

      if (insights.length === 0) insights.push('Operating normally');

      stageScores.push({ stage, trustScore, grade: getGrade(trustScore), metrics: { onTimeDelivery: Math.round(onTimeScore), qualityScore: Math.round(qualityScore), dataCompleteness: Math.round(dataScore), riskFrequency: Math.round(riskScore), blockchainVerification: Math.round(bcScore) }, batchesProcessed: se.length, avgDaysAtStage: Math.round(avgDays * 10) / 10, trend, insights });
    }

    stageScores.sort((a, b) => b.trustScore - a.trustScore);
    const overallScore = stageScores.length > 0 ? Math.round(stageScores.reduce((s, r) => s + r.trustScore, 0) / stageScores.length) : 0;

    return NextResponse.json({
      overallScore, overallGrade: getGrade(overallScore), stageScores,
      weakestLink: stageScores.length > 0 ? { stage: stageScores[stageScores.length - 1].stage, score: stageScores[stageScores.length - 1].trustScore } : null,
      strongestLink: stageScores.length > 0 ? { stage: stageScores[0].stage, score: stageScores[0].trustScore } : null,
      totalStagesAnalyzed: stageScores.length, analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('TrustScore error:', error);
    return NextResponse.json({ error: 'Trust scoring failed' }, { status: 500 });
  }
}
