import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/integrations/solana";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, recipientAddress, memo } = body;

    if (!amount || !recipientAddress) {
      return NextResponse.json(
        { error: "Amount and recipient address are required" },
        { status: 400 }
      );
    }

    const result = await createPayment({ amount, recipientAddress, memo });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in payment API:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
