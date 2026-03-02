import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface ComplianceCheck {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details: string;
  affectedBatches?: string[];
}

interface ComplianceReport {
  overallScore: number;
  overallStatus: 'compliant' | 'needs_attention' | 'non_compliant';
  checks: ComplianceCheck[];
  missingData: { batchNumber: string; stage: string; missingFields: string[] }[];
  recommendations: string[];
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, batches, batchEntries, risks } = await request.json();
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    
    // Fallback if the variable name is different in page.tsx vs old code
    const entries = batchEntries || [];

    // Ensure batches and risks are arrays, even if empty or undefined from request
    const processedBatches = batches || [];
    const processedRisks = risks || [];

    const checks: ComplianceCheck[] = [];
    const missingData: ComplianceReport['missingData'] = [];
    const recommendations: string[] = [];
    let passCount = 0;
    let totalChecks = 0;

    // ─── Check 1: Blockchain traceability ───
    totalChecks++;
    const onChainBatches = processedBatches.filter((b: any) => b.algorandTxId);
    const traceabilityPct = processedBatches.length > 0 ? Math.round((onChainBatches.length / processedBatches.length) * 100) : 0;
    if (traceabilityPct >= 80) {
      passCount++;
      checks.push({
        category: 'Blockchain Traceability',
        status: 'pass',
        description: 'Majority of batches are recorded on Algorand blockchain',
        details: `${traceabilityPct}% of batches (${onChainBatches.length}/${processedBatches.length}) have blockchain verification.`
      });
    } else if (traceabilityPct >= 40) {
      checks.push({
        category: 'Blockchain Traceability',
        status: 'warning',
        description: 'Some batches lack blockchain verification',
        details: `Only ${traceabilityPct}% of batches are on-chain. Aim for 80%+.`,
        affectedBatches: processedBatches.filter((b: any) => !b.algorandTxId).map((b: any) => b.batchNumber)
      });
      recommendations.push('Record all completed batches on the Algorand blockchain to improve traceability.');
    } else {
      checks.push({
        category: 'Blockchain Traceability',
        status: 'fail',
        description: 'Insufficient blockchain traceability',
        details: `Only ${traceabilityPct}% of batches are on-chain. This does not meet compliance standards.`,
        affectedBatches: processedBatches.filter((b: any) => !b.algorandTxId).map((b: any) => b.batchNumber)
      });
      recommendations.push('URGENT: Record all batches on blockchain immediately to meet traceability requirements.');
    }

    // ─── Check 2: Temperature monitoring ───
    totalChecks++;
    const tempEntries = entries.filter((e: any) => e.stageData?.temperature !== undefined);
    const batchesWithTemp = new Set(tempEntries.map((e: any) => e.batchId));
    const tempCoveragePct = processedBatches.length > 0 ? Math.round((batchesWithTemp.size / processedBatches.length) * 100) : 0;
    const highTemps = tempEntries.filter((e: any) => Number(e.stageData.temperature) > 8);

    if (tempCoveragePct >= 70 && highTemps.length === 0) {
      passCount++;
      checks.push({
        category: 'Cold Chain Compliance',
        status: 'pass',
        description: 'Temperature monitoring is adequate and within safe range',
        details: `${tempCoveragePct}% of batches have temperature logs. All readings within safe range.`
      });
    } else if (highTemps.length > 0) {
      checks.push({
        category: 'Cold Chain Compliance',
        status: 'fail',
        description: 'Temperature violations detected',
        details: `${highTemps.length} readings exceed safe threshold (8°C). Max recorded: ${Math.max(...highTemps.map((e: any) => Number(e.stageData.temperature)))}°C.`,
        affectedBatches: Array.from(new Set(highTemps.map((e: any) => String(e.batchNumber || e.batchId.slice(0, 8)))))
      });
      recommendations.push('Investigate cold chain breaches immediately. Review cold storage equipment.');
    } else {
      checks.push({
        category: 'Cold Chain Compliance',
        status: 'warning',
        description: 'Insufficient temperature monitoring coverage',
        details: `Only ${tempCoveragePct}% of batches have temperature logs. Aim for 70%+.`
      });
      recommendations.push('Ensure temperature readings are logged at every relevant stage.');
    }

    // ─── Check 3: Complete stage documentation ───
    totalChecks++;
    const completedBatches = processedBatches.filter((b: any) => b.status === 'complete');
    const batchesWithFullDocs: string[] = [];
    const batchesWithMissingDocs: string[] = [];

    for (const batch of completedBatches) {
      const batchEntries = entries.filter((e: any) => e.batchId === batch.id);
      if (batchEntries.length >= 2) {
        batchesWithFullDocs.push(batch.batchNumber);
      } else {
        batchesWithMissingDocs.push(batch.batchNumber);
      }
    }

    if (completedBatches.length > 0) {
      const docPct = Math.round((batchesWithFullDocs.length / completedBatches.length) * 100);
      if (docPct >= 80) {
        passCount++;
        checks.push({
          category: 'Stage Documentation',
          status: 'pass',
          description: 'Completed batches have adequate stage-by-stage documentation',
          details: `${docPct}% of completed batches have full documentation with at least 2 stage entries.`
        });
      } else {
        checks.push({
          category: 'Stage Documentation',
          status: docPct >= 50 ? 'warning' : 'fail',
          description: 'Some batches lack complete documentation',
          details: `Only ${docPct}% of completed batches have full stage entries.`,
          affectedBatches: batchesWithMissingDocs
        });
        recommendations.push('Ensure every stage submits data before advancing batches through the pipeline.');
      }
    } else {
      checks.push({
        category: 'Stage Documentation',
        status: 'warning',
        description: 'No completed batches to evaluate documentation against',
        details: 'Complete some batches to assess documentation compliance.'
      });
    }

    // ─── Check 4: Quality inspections ───
    totalChecks++;
    const qaEntries = entries.filter((e: any) => e.stageData?.inspectionResult || e.stageData?.batchQuality);
    const passedQA = qaEntries.filter((e: any) =>
      ['Pass', 'Pass with Notes', 'Excellent', 'Good'].includes(e.stageData?.inspectionResult || e.stageData?.batchQuality || '')
    );
    const failedQA = qaEntries.filter((e: any) =>
      ['Fail', 'Rejected', 'Below Standard'].includes(e.stageData?.inspectionResult || e.stageData?.batchQuality || '')
    );
    const qaPassRate = qaEntries.length > 0 ? Math.round((passedQA.length / qaEntries.length) * 100) : 0;

    if (qaEntries.length > 0 && qaPassRate >= 80) {
      passCount++;
      checks.push({
        category: 'Quality Assurance',
        status: 'pass',
        description: 'Quality inspection pass rate meets standards',
        details: `${qaPassRate}% pass rate across ${qaEntries.length} inspections.`
      });
    } else if (qaEntries.length > 0) {
      checks.push({
        category: 'Quality Assurance',
        status: failedQA.length > 2 ? 'fail' : 'warning',
        description: 'Quality issues detected',
        details: `${qaPassRate}% pass rate. ${failedQA.length} inspections failed.`,
        affectedBatches: Array.from(new Set(failedQA.map((e: any) => String(e.batchNumber || e.batchId.slice(0, 8)))))
      });
      recommendations.push('Review quality control processes at stages with failed inspections.');
    } else {
      checks.push({
        category: 'Quality Assurance',
        status: 'warning',
        description: 'No quality inspection data found',
        details: 'Consider adding quality inspection stages to your pipeline.'
      });
      recommendations.push('Add quality inspection stages with pass/fail tracking to your supply chain.');
    }

    // ─── Check 5: Risk event management ───
    totalChecks++;
    const highRisks = processedRisks.filter((r: any) => r.confidenceScore > 0.7);
    const unaddressedRisks = highRisks.filter((r: any) => !r.algorandTxId);

    if (highRisks.length === 0) {
      passCount++;
      checks.push({
        category: 'Risk Management',
        status: 'pass',
        description: 'No high-risk events detected',
        details: 'Supply chain is operating within normal risk parameters.'
      });
    } else if (unaddressedRisks.length === 0) {
      passCount++;
      checks.push({
        category: 'Risk Management',
        status: 'pass',
        description: 'All high-risk events are blockchain-documented',
        details: `${highRisks.length} high-risk events detected and all recorded on Algorand for audit.`
      });
    } else {
      checks.push({
        category: 'Risk Management',
        status: 'fail',
        description: 'Unresolved high-risk events',
        details: `${unaddressedRisks.length} high-risk events without blockchain documentation.`
      });
      recommendations.push('Record all high-risk events on the Algorand blockchain for compliance audit trail.');
    }

    // ─── Check 6: Data completeness ───
    totalChecks++;
    for (const batch of processedBatches.slice(0, 10)) {
      const batchEntries = entries.filter((e: any) => e.batchId === batch.id);
      for (const entry of batchEntries) {
        const missing: string[] = [];
        if (!entry.submittedBy || entry.submittedBy === 'Unknown') missing.push('submittedBy');
        if (!entry.stageData || Object.keys(entry.stageData).length <= 1) missing.push('stage-specific data fields');
        if (!entry.notes) missing.push('notes');
        if (missing.length > 0) {
          missingData.push({
            batchNumber: batch.batchNumber,
            stage: entry.stage,
            missingFields: missing,
          });
        }
      }
    }

    if (missingData.length === 0) {
      passCount++;
      checks.push({
        category: 'Data Completeness',
        status: 'pass',
        description: 'All batch entries have complete data fields',
        details: 'Every recorded entry includes submitter info, stage data, and notes.'
      });
    } else {
      checks.push({
        category: 'Data Completeness',
        status: missingData.length > 5 ? 'fail' : 'warning',
        description: `${missingData.length} entries have incomplete data`,
        details: `Found missing fields in ${missingData.length} entries across batches.`
      });
      recommendations.push('Train team members to fill all required fields during stage data entry.');
    }

    const overallScore = Math.round((passCount / totalChecks) * 100);
    const overallStatus: ComplianceReport['overallStatus'] =
      overallScore >= 80 ? 'compliant' :
      overallScore >= 50 ? 'needs_attention' : 'non_compliant';

    if (recommendations.length === 0) {
      recommendations.push('Supply chain is in good compliance standing. Continue maintaining documentation standards.');
    }

    const report: ComplianceReport = {
      overallScore,
      overallStatus,
      checks,
      missingData: missingData.slice(0, 10),
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Compliance analysis failed', details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}
