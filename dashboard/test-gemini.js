// test-gemini.js

async function testGemini() {
  const companyId = 'test-company';
  const question = 'Give me a 1 sentence full summary of my operations pipeline.';
  
  // Create some mock dummy data for the context
  const body = {
    companyId,
    question,
    batches: [
      { id: '1', batchNumber: 'B-001', status: 'active', currentStage: 'Shipping', algorandTxId: 'TX123' },
      { id: '2', batchNumber: 'B-002', status: 'complete', currentStage: 'Delivered', algorandTxId: null }
    ],
    orders: [{ id: 'o1' }],
    riskEvents: [{ id: 'r1', confidenceScore: 0.8, riskType: 'Delay', stage: 'Shipping', algorandTxId: 'TX999' }],
    batchEntries: []
  };

  try {
    const res = await fetch('http://localhost:3000/api/agents/chain-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testGemini();
