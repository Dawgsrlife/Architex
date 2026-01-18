import { NextRequest, NextResponse } from "next/server";
import { getUserRepos } from "@/lib/integrations/github";

export async function GET(request: NextRequest) {
  try {
    const repos = await getUserRepos();
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error in repos API:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
