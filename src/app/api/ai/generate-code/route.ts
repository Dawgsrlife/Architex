import { NextRequest, NextResponse } from "next/server";
import { generateCode } from "@/lib/integrations/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context, language } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await generateCode({ prompt, context, language });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in generate-code API:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
