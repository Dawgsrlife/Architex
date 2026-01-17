import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Workflow from "@/lib/models/Workflow";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description, projectId, nodes, edges } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Name and project ID are required" },
        { status: 400 }
      );
    }

    const workflow = await Workflow.create({
      name,
      description,
      projectId,
      nodes: nodes || [],
      edges: edges || [],
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      { error: "Failed to save workflow" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    const query = projectId ? { projectId } : {};
    const workflows = await Workflow.find(query).sort({ updatedAt: -1 });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}
