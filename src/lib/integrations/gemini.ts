import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || ""
);

export interface CodeGenerationRequest {
  prompt: string;
  context?: string;
  language?: string;
}

export interface CodeGenerationResponse {
  code: string;
  explanation?: string;
}

export async function generateCode(
  request: CodeGenerationRequest
): Promise<CodeGenerationResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const fullPrompt = `
You are an expert software architect and code generator.

${request.context ? `Context: ${request.context}` : ""}

Language: ${request.language || "TypeScript"}

User Request: ${request.prompt}

Please generate clean, production-ready code with best practices. Include comments explaining key parts.
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Extract code from markdown code blocks if present
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : text;

    return {
      code,
      explanation: text.includes("```") ? text : undefined,
    };
  } catch (error) {
    console.error("Error generating code with Gemini:", error);
    throw new Error("Failed to generate code");
  }
}

export async function generateArchitecture(
  description: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
As an expert software architect, design a comprehensive architecture for:

${description}

Provide:
1. High-level system architecture
2. Key components and their responsibilities
3. Data flow
4. Technology stack recommendations
5. Scalability considerations

Format as a detailed architectural document.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating architecture with Gemini:", error);
    throw new Error("Failed to generate architecture");
  }
}

export async function improveCode(code: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Review and improve the following code. Suggest optimizations, best practices, and potential issues:

${code}

Provide the improved version with explanations for changes.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error improving code with Gemini:", error);
    throw new Error("Failed to improve code");
  }
}
