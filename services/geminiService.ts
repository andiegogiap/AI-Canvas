import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from '@google/genai';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set. Gemini node will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface GlobalInstructions {
  ai: string;
  system: string;
}

export const callGeminiAPI = async (prompt: string, systemContext?: string, params?: string, globalInstructions?: GlobalInstructions): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
  }

  const modelConfig: any = {};
  
  if (params) {
    try {
      const parsedParams = JSON.parse(params);
      Object.assign(modelConfig, parsedParams);
    } catch (e) {
      console.error("Failed to parse parameters JSON:", e);
      throw new Error("Invalid format in Parameters node. Must be a valid JSON object.");
    }
  }

  // If a systemInstruction is NOT provided via the params node, construct one.
  // Priority: Node Context > Global Instructions
  if (!modelConfig.systemInstruction) {
    const globalSystemInstruction = [globalInstructions?.ai, globalInstructions?.system].filter(Boolean).join('\n\n');
    
    let finalSystemInstruction = '';
    // Combine global and node-specific contexts for a richer prompt
    if (globalSystemInstruction && systemContext) {
        finalSystemInstruction = `${globalSystemInstruction}\n\n---\n\n${systemContext}`;
    } else {
        finalSystemInstruction = globalSystemInstruction || systemContext || '';
    }

    if (finalSystemInstruction) {
        modelConfig.systemInstruction = finalSystemInstruction;
    }
  }

  try {
    const request: any = {
      model: "gemini-2.5-flash",
      contents: prompt,
    };

    if (Object.keys(modelConfig).length > 0) {
      request.config = modelConfig;
    }

    const response: GenerateContentResponse = await ai.models.generateContent(request);
    
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        return `Error calling Gemini API: ${error.message}`;
    }
    return "An unknown error occurred during the API call.";
  }
};

export const generateImageAPI = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
  }

  try {
    const response: GenerateImagesResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Imagen API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Error generating image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during the image generation call.");
  }
};
