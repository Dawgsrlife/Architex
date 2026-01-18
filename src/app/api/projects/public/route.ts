import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock public projects for now - backend dev will hook this up
    const mockProjects = [
      {
        _id: "p1",
        name: "E-commerce Microservices",
        description: "Scalable architecture with Docker, Kubernetes, and event-driven design",
        repository: "https://github.com/architex/ecommerce-demo",
        deploymentUrl: "https://ecommerce-demo.vercel.app",
        createdAt: new Date().toISOString(),
        userId: "user1"
      },
      {
        _id: "p2", 
        name: "Real-time Analytics Pipeline",
        description: "Kafka, Spark Streaming, and Elasticsearch for real-time data processing",
        repository: "https://github.com/architex/analytics-pipeline",
        deploymentUrl: "https://analytics-demo.vercel.app",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        userId: "user2"
      },
      {
        _id: "p3",
        name: "AI Chat Application",
        description: "Next.js frontend with FastAPI backend and OpenAI integration",
        repository: "https://github.com/architex/ai-chat",
        deploymentUrl: "https://ai-chat-demo.vercel.app",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        userId: "user3"
      }
    ];
      
    return NextResponse.json(mockProjects);
  } catch (error: any) {
    console.error("Error fetching public projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch public projects" },
      { status: 500 }
    );
  }
}
