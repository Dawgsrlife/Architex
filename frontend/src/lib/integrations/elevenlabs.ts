import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export async function textToSpeech(
  request: TextToSpeechRequest
): Promise<Buffer> {
  try {
    const voiceId = request.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice (Rachel)

    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: request.text,
      ...(request.modelId && { modelId: request.modelId }),
    });

    // Convert audio to buffer
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Calculate total length
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return Buffer.from(result);
  } catch (error) {
    console.error("Error converting text to speech:", error);
    throw new Error("Failed to convert text to speech");
  }
}

export async function getVoices() {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.voices.map((voice) => ({
      id: voice.voiceId,
      name: voice.name,
      category: voice.category,
      description: voice.description,
    }));
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw new Error("Failed to fetch available voices");
  }
}

export async function speechToArchitecture(audioBuffer: Buffer): Promise<string> {
  // Note: ElevenLabs doesn't provide speech-to-text
  // This would typically use another service like Google Speech-to-Text or OpenAI Whisper
  // For now, we'll return a placeholder
  console.warn("Speech-to-text not implemented. Consider using Google Speech-to-Text API.");
  
  return "Speech-to-text conversion requires additional setup with a service like Google Speech-to-Text or OpenAI Whisper.";
}
