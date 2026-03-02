import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface RiskResult {
  batchId: string;
  batchNumber: string;
  currentStage: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  factors: { factor: string; impact: number; detail: string }[];
  recommendation: string;
  predictedOutcome: string;
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, batches = [], riskEvents = [], batchEntries = [] } = await request.json();
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    
    // Default stages for analysis if company not fetched
    const stages = ["Manufacturing", "Quality Assurance", "Packaging", "Shipping", "Delivered"];
    const entries = batchEntries;

    const activeBatches = batches.filter((b: any) => b.status !== 'complete');
    const results: RiskResult[] = [];

    for (const batch of activeBatches) {
      const batchEntries = entries.filter((e: any) => e.batchId === batch.id);
      const batchRisks = riskEvents.filter((r: any) => r.batchId === batch.id);
      const factors: { factor: string; impact: number; detail: string }[] = [];

      // Factor 1: Stage Delay Analysis
      const stageIdx = stages.indexOf(batch.currentStage);
      let delayScore = 0;
      if (batch.stageStartedAt) {
        const daysAtStage = Math.max(0, (Date.now() / 1000 - batch.stageStartedAt.seconds) / 86400);
        if (daysAtStage > 7) {
          delayScore = Math.min(40, daysAtStage * 4);
          factors.push({
            factor: 'Stage Delay',
            impact: delayScore,
            detail: `Batch stuck at "${batch.currentStage}" for ${Math.round(daysAtStage)} days — exceeds 7-day threshold`
          });
        } else if (daysAtStage > 3) {
          delayScore = daysAtStage * 2;
          factors.push({
            factor: 'Moderate Delay',
            impact: delayScore,
            detail: `${Math.round(daysAtStage)} days at "${batch.currentStage}" — approaching delay threshold`
          });
        }
      }

      // Factor 2: Temperature Anomalies
      let tempScore = 0;
      const tempEntries = batchEntries.filter((e: any) => e.stageData?.temperature !== undefined);
      if (tempEntries.length > 0) {
        const temps = tempEntries.map((e: any) => Number(e.stageData.temperature));
        const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const variance = maxTemp - minTemp;

        if (variance > 15) {
          tempScore = 30;
          factors.push({
            factor: 'Temperature Spike',
            impact: tempScore,
            detail: `Temperature variance of ${variance.toFixed(1)}°C detected (range: ${minTemp}°C to ${maxTemp}°C)`
          });
        } else if (variance > 8) {
          tempScore = 15;
          factors.push({
            factor: 'Temperature Fluctuation',
            impact: tempScore,
            detail: `Temperature fluctuation of ${variance.toFixed(1)}°C across stages`
          });
        }

        // Cold chain breach check
        if (maxTemp > 8) {
          tempScore += 20;
          factors.push({
            factor: 'Cold Chain Risk',
            impact: 20,
            detail: `Temperature reached ${maxTemp}°C — potential cold chain breach (threshold: 8°C)`
          });
        }
      }

      // Factor 3: Quality Issues in entries
      let qualityScore = 0;
      const qualityEntries = batchEntries.filter((e: any) =>
        e.stageData?.batchQuality === 'Below Standard' ||
        e.stageData?.batchQuality === 'Rejected' ||
        e.stageData?.inspectionResult === 'Fail' ||
        e.stageData?.inspectionResult === 'Needs Re-inspection' ||
        e.stageData?.condition === 'Significant Damage' ||
        e.stageData?.condition === 'Rejected'
      );
      if (qualityEntries.length > 0) {
        qualityScore = Math.min(35, qualityEntries.length * 20);
        factors.push({
          factor: 'Quality Alert',
          impact: qualityScore,
          detail: `${qualityEntries.length} quality issue(s) flagged in stage data`
        });
      }

      // Factor 4: Defect count
      let defectScore = 0;
      const defectEntries = batchEntries.filter((e: any) => e.stageData?.defectCount && Number(e.stageData.defectCount) > 0);
      if (defectEntries.length > 0) {
        const totalDefects = defectEntries.reduce((sum: number, e: any) => sum + Number(e.stageData.defectCount), 0);
        defectScore = Math.min(25, totalDefects * 5);
        factors.push({
          factor: 'Defect Detection',
          impact: defectScore,
          detail: `${totalDefects} defect(s) found across ${defectEntries.length} inspection(s)`
        });
      }

      // Factor 5: Historical risk events
      let historyScore = 0;
      if (batchRisks.length > 0) {
        const highConfCount = batchRisks.filter((r: any) => r.confidenceScore > 0.7).length;
        historyScore = Math.min(20, highConfCount * 10);
        if (historyScore > 0) {
          factors.push({
            factor: 'Risk History',
            impact: historyScore,
            detail: `${highConfCount} previous high-confidence risk event(s) recorded`
          });
        }
      }

      // Factor 6: Progress stalls — batch hasn't advanced through stages
      let progressScore = 0;
      if (stageIdx >= 0 && stages.length > 0) {
        const progressPct = stageIdx / stages.length;
        if (progressPct < 0.3 && batch.createdAt) {
          const daysSinceCreated = (Date.now() / 1000 - batch.createdAt.seconds) / 86400;
          if (daysSinceCreated > 10) {
            progressScore = 15;
            factors.push({
              factor: 'Slow Pipeline',
              impact: progressScore,
              detail: `Only ${Math.round(progressPct * 100)}% progress after ${Math.round(daysSinceCreated)} days`
            });
          }
        }
      }

      // Factor 7: Advanced Deep Data Scanning
      let anomalyScore = 0;
      const riskKeywords = ['damage', 'fail', 'spill', 'tampering', 'reject', 'delay', 'issue', 'broken', 'breach'];
      
      batchEntries.forEach((entry: any) => {
        if (entry.stageData) {
          Object.entries(entry.stageData).forEach(([key, value]) => {
            const strVal = String(value).toLowerCase();
            
            // Check for negative numbers where unexpected
            if (typeof value === 'number' && value < 0 && key.toLowerCase() !== 'temperature') {
               anomalyScore += 15;
               factors.push({
                 factor: 'Data Anomaly',
                 impact: 15,
                 detail: `Unexpected negative value (${value}) found in field '${key}' at stage ${entry.stage}`
               });
            }

            // Check for risk keywords in text
            if (typeof value === 'string') {
               const foundWords = riskKeywords.filter(word => strVal.includes(word));
               if (foundWords.length > 0) {
                 const penalty = 10 * foundWords.length;
                 anomalyScore += penalty;
                 factors.push({
                   factor: 'Semantic Risk Flag',
                   impact: penalty,
                   detail: `Risk keywords (${foundWords.join(', ')}) detected in '${key}' at stage ${entry.stage}`
                 });
               }
            }
          });
        }
      });
      
      anomalyScore = Math.min(40, anomalyScore);

      // Compute overall risk score
      const totalRisk = Math.min(100, delayScore + tempScore + qualityScore + defectScore + historyScore + progressScore + anomalyScore);

      // If no risk factors found, give a clean bill
      if (factors.length === 0) {
        factors.push({
          factor: 'Normal Operations',
          impact: 0,
          detail: 'No anomalies detected — batch is progressing normally'
        });
      }

      const riskLevel: RiskResult['riskLevel'] =
        totalRisk >= 70 ? 'critical' :
        totalRisk >= 45 ? 'high' :
        totalRisk >= 20 ? 'medium' : 'low';

      const recommendations: Record<string, string> = {
        critical: 'URGENT: Halt batch processing. Immediate inspection required. Consider blockchain audit of all stage data.',
        high: 'Schedule priority inspection within 24 hours. Review stage data and temperature logs.',
        medium: 'Monitor closely. Review flagged factors and verify data accuracy at next stage.',
        low: 'No action required. Continue standard processing.'
      };

      const predictions: Record<string, string> = {
        critical: 'High probability of batch failure or regulatory non-compliance if unaddressed.',
        high: 'Likely to encounter delays or quality issues at downstream stages.',
        medium: 'May require additional QA attention but likely recoverable.',
        low: 'Expected to complete supply chain journey without issues.'
      };

      results.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        currentStage: batch.currentStage,
        riskScore: Math.round(totalRisk),
        riskLevel,
        factors: factors.sort((a: any, b: any) => b.impact - a.impact),
        recommendation: recommendations[riskLevel],
        predictedOutcome: predictions[riskLevel],
      });
    }

    // Sort by risk score descending
    results.sort((a: any, b: any) => b.riskScore - a.riskScore);

    const summary = {
      totalAnalyzed: results.length,
      critical: results.filter((r: any) => r.riskLevel === 'critical').length,
      high: results.filter((r: any) => r.riskLevel === 'high').length,
      medium: results.filter((r: any) => r.riskLevel === 'medium').length,
      low: results.filter((r: any) => r.riskLevel === 'low').length,
      avgRiskScore: results.length > 0 ? Math.round(results.reduce((s: number, r: any) => s + r.riskScore, 0) / results.length) : 0,
    };

    return NextResponse.json({ results, summary, analyzedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Risk analysis error:', error);
    return NextResponse.json({ error: 'Risk analysis failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
