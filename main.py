from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class BatchTimingData(BaseModel):
    batchId: str
    stage: str
    timeElapsedMinutes: float
    expectedIntervalMinutes: float
    # Add other fields as necessary

@app.post("/analyze-batch")
async def analyze_batch(data: BatchTimingData):
    # Basic placeholder logic
    # Check if the time between stages exceeds the expected interval
    
    if data.timeElapsedMinutes > data.expectedIntervalMinutes:
        risk_type = "High Latency Risk"
        # Confidence score increases with the excess time
        excess_ratio = (data.timeElapsedMinutes - data.expectedIntervalMinutes) / data.expectedIntervalMinutes
        confidence_score = min(0.5 + (excess_ratio * 0.5), 0.99)
    else:
        risk_type = "Low Risk"
        confidence_score = 0.1

    return {
        "Risk Type": risk_type,
        "Confidence Score": round(confidence_score, 2),
        "Batch ID": data.batchId
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
