import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { companyId, batches, orders } = await request.json();
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });


    const completed = (batches || []).filter((b: any) => b.status === 'complete');
    const active = (batches || []).filter((b: any) => b.status !== 'complete');

    // Calculate completion rate trends
    const now = Date.now() / 1000;
    const last30d = completed.filter((b: any) => b.updatedAt && (now - b.updatedAt.seconds) < 30 * 86400);
    const last60d = completed.filter((b: any) => b.updatedAt && (now - b.updatedAt.seconds) < 60 * 86400);
    const prev30d = last60d.length - last30d.length;

    // Growth rate
    const growthRate = prev30d > 0 ? ((last30d.length - prev30d) / prev30d) * 100 : 0;

    // Average cycle time
    const cycleTimes: number[] = [];
    completed.forEach((b: any) => {
      if (b.stageDurations) {
        const total = Object.values(b.stageDurations).reduce((a: number, v: any) => a + Number(v), 0);
        cycleTimes.push(total);
      }
    });
    const avgCycleTime = cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0;

    // Predict next 7/14/30 day volumes based on historical rate
    const dailyRate = last30d.length > 0 ? last30d.length / 30 : (completed.length > 0 ? completed.length / 90 : 0);

    const forecast7d = Math.round(dailyRate * 7);
    const forecast14d = Math.round(dailyRate * 14);
    const forecast30d = Math.round(dailyRate * 30);

    // Pipeline capacity analysis
    const avgBatchesPerOrder = orders.length > 0 ? batches.length / orders.length : 1;

    // Stage bottleneck prediction
    const stageLoad: Record<string, number> = {};
    active.forEach((b: any) => { stageLoad[b.currentStage] = (stageLoad[b.currentStage] || 0) + 1; });
    const bottleneck = Object.entries(stageLoad).sort((a, b) => b[1] - a[1])[0];

    // Insights
    const insights: string[] = [];
    if (growthRate > 20) insights.push(`📈 Strong growth: ${Math.round(growthRate)}% increase in batch completions`);
    else if (growthRate < -20) insights.push(`📉 Declining throughput: ${Math.round(Math.abs(growthRate))}% decrease detected`);
    else insights.push('📊 Throughput is stable compared to previous period');

    if (avgCycleTime > 0) insights.push(`⏱️ Average batch takes ${avgCycleTime.toFixed(1)} days from start to finish`);
    if (bottleneck && bottleneck[1] >= 3) insights.push(`🔴 Bottleneck at "${bottleneck[0]}" with ${bottleneck[1]} batches queued`);
    if (active.length > completed.length * 2) insights.push('⚠️ More active batches than completed — pipeline may be overloaded');
    if (dailyRate > 0) insights.push(`🏭 Processing approximately ${dailyRate.toFixed(1)} batches per day`);

    const recommendations: string[] = [];
    if (bottleneck && bottleneck[1] >= 3) {
      recommendations.push(`Add capacity at "${bottleneck[0]}" stage to reduce queue from ${bottleneck[1]} batches`);
    }
    if (avgCycleTime > 14) {
      recommendations.push('Cycle time exceeds 2 weeks. Review slowest stages for optimization opportunities.');
    }
    if (active.length > 10) {
      recommendations.push(`${active.length} active batches — consider staggering order intake to prevent backlogs.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Pipeline capacity is healthy. Maintain current operational pace.');
    }

    return NextResponse.json({
      currentState: {
        activeBatches: active.length,
        completedBatches: completed.length,
        totalOrders: orders.length,
        avgBatchesPerOrder: Math.round(avgBatchesPerOrder * 10) / 10,
      },
      forecast: {
        next7Days: forecast7d,
        next14Days: forecast14d,
        next30Days: forecast30d,
        dailyRate: Math.round(dailyRate * 100) / 100,
        growthRate: Math.round(growthRate),
        confidenceLevel: completed.length >= 10 ? 'high' : completed.length >= 3 ? 'medium' : 'low',
      },
      performance: {
        avgCycleTimeDays: Math.round(avgCycleTime * 10) / 10,
        fastestCycleDays: cycleTimes.length > 0 ? Math.min(...cycleTimes) : 0,
        slowestCycleDays: cycleTimes.length > 0 ? Math.max(...cycleTimes) : 0,
        completionsLast30d: last30d.length,
        completionsPrev30d: prev30d,
      },
      bottleneck: bottleneck ? { stage: bottleneck[0], queueSize: bottleneck[1] } : null,
      stageLoad,
      insights,
      recommendations,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Forecast analysis failed' }, { status: 500 });
  }
}
