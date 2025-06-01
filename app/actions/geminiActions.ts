"use server";

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import {
  GEMINI_MODEL_NAME,
  CODE_REVIEW_SYSTEM_INSTRUCTION,
} from "@/lib/constants";
import type { ActionResponse } from "@/types/index";

export interface GeminiReviewData {
  feedback: string;
  tokensUsed: number;
}

export async function getGeminiReviewAction(
  code: string,
): Promise<ActionResponse<GeminiReviewData>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "Gemini API key (GEMINI_API_KEY) is not defined on the server.",
    );
    return {
      success: false,
      error: "Gemini API key is not configured on the server.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models;

    const prompt = `Review the following code:\n\n\`\`\`\n${code}\n\`\`\``;

    const response: GenerateContentResponse = await model.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: CODE_REVIEW_SYSTEM_INSTRUCTION,
        temperature: 0.3,
        topK: 32,
        topP: 0.9,
      },
    });

    // Ensure feedback is always a string, even if response.text is undefined
    const feedback = response.text || "";
    let tokensUsed = 0;
    if (response.usageMetadata) {
      tokensUsed =
        (response.usageMetadata.promptTokenCount || 0) +
        (response.usageMetadata.candidatesTokenCount || 0);
    }

    return { success: true, data: { feedback, tokensUsed } };
  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = "Failed to get review from Gemini. Unknown error";
    
    // Type guard to check if error is an Error object with a message property
    if (error instanceof Error) {
      errorMessage = `Failed to get review from Gemini. ${error.message}`;
      
      if (
        error.message.includes("API key not valid") ||
        error.message.includes("API key is invalid")
      ) {
        errorMessage =
          "Invalid Gemini API Key on server. Please check server configuration.";
      } else if (error.message.includes("Quota exceeded")) {
        errorMessage =
          "Gemini API quota exceeded. Please check your quota or try again later.";
      }
    }
    return { success: false, error: errorMessage };
  }
}
