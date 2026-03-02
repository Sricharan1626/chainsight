import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In a real app, you would connect to the Node.js API/DB here.
    console.log("Received onboarding data:", body);
    
    if (!body.companyName || !body.stages || body.stages.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Company onboarded successfully with custom supply chain stages.",
      data: body 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
