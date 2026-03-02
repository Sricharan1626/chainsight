import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


export async function POST(request: NextRequest) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const { companyId, question, batches, orders, riskEvents, batchEntries } = await request.json();
    if (!companyId || !question) {
      return NextResponse.json({ error: 'companyId and question are required' }, { status: 400 });
    }

    // Default to empty array if undefined
    const safeBatches = batches || [];
    const safeOrders = orders || [];
    const risks = riskEvents || [];
    const entries = batchEntries || [];

    // Pre-process summaries to keep the payload size manageable
    const activeBatches = safeBatches.filter((b: any) => b.status !== 'complete');
    const completedBatches = safeBatches.filter((b: any) => b.status === 'complete');
    const highRisks = risks.filter((r: any) => r.confidenceScore > 0.7);

    // Construct the context payload
    const context = {
      summary: {
        totalBatches: safeBatches.length,
        activeBatches: activeBatches.length,
        completedBatches: completedBatches.length,
        totalOrders: safeOrders.length,
        totalRiskEvents: risks.length,
        highRiskEvents: highRisks.length,
        batchesOnBlockchain: safeBatches.filter((b: any) => b.algorandTxId).length,
      },
      data: {
        activeBatches: activeBatches.map((b: any) => ({
          batchNumber: b.batchNumber || b.id,
          stage: b.currentStage,
          status: b.status,
          startedAt: b.createdAt ? new Date(b.createdAt.seconds * 1000).toISOString() : null,
        })),
        recentRiskEvents: highRisks.slice(0, 10).map((r: any) => ({
          type: r.riskType,
          stage: r.stage,
          confidence: r.confidenceScore,
        })),
        stages: [...new Set(safeBatches.map((b: any) => b.currentStage))],
      }
    };

    const systemPrompt = `You are "ChainChat AI", an expert supply chain assistant for Algorand-powered pipelines.
Your goal is to answer questions based strictly on the provided JSON context data.

Supply Chain Context Data:
${JSON.stringify(context, null, 2)}

User Question: "${question}"

You must respond ONLY with a valid JSON object matching exactly this schema, without any markdown formatting wrappers like \`\`\`json:
{
  "answer": "A friendly, conversational answer summarizing the findings. Use markdown for bolding/bullet points if helpful.",
  "data": "An array of objects or a single object containing the numerical/structured data referenced in your answer. E.g. [{ name: 'A', value: 1 }]. Return null if no chart data makes sense.",
  "chartType": "If you provided 'data', specify how to render it. Must be one of: 'bar', 'list', 'number', 'table', 'timeline'. Return null if no data.",
  "suggestions": ["An array of 2-3 short, relevant follow-up questions the user could ask next."]
}

Guidelines:
- If the user asks for a chart or statistics, extract it into the 'data' array and pick an appropriate 'chartType'.
- "table" is good for lists of features with multiple columns (like risks or active batches).
- "number" is good for single/multi KPIs.
- Ensure your 'answer' sounds professional, helpful, and concise.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(systemPrompt);
    const textResponse = result.response.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResponse);
      throw new Error("Gemini returned invalid JSON");
    }

    return NextResponse.json({ ...parsedResponse, processedAt: new Date().toISOString() });
  } catch (error) {
    console.error('ChainChat Gemini error:', error);
    
    // Graceful fallback if the API Key is invalid or not enabled
    if (error instanceof Error && error.message.includes('GoogleGenerativeAI')) {
      return NextResponse.json({
        answer: "⚠️ **Gemini AI Connection Error**\nI'm having trouble connecting to Google's AI servers. It looks like the `GEMINI_API_KEY` provided might be inactive, restricted, or missing the Generative Language API permissions in Google Cloud.",
        suggestions: ["Check Google Cloud Console", "Generate a new API Key"],
        chartType: "list",
        data: []
      });
    }

    return NextResponse.json({ 
      error: 'Query processing failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
