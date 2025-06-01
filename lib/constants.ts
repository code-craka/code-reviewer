import { AIModel, AIModelOption } from "@/types/index"; // Adjust path if types move

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const AI_MODELS_OPTIONS: AIModelOption[] = [
  { id: AIModel.GEMINI, name: "Gemini", isSimulated: false },
  { id: AIModel.CHATGPT, name: "ChatGPT (Simulated)", isSimulated: true },
  { id: AIModel.CLAUDE, name: "Claude (Simulated)", isSimulated: true },
  { id: AIModel.DEEPSEEK, name: "DeepSeek (Simulated)", isSimulated: true },
];

export const CODE_REVIEW_SYSTEM_INSTRUCTION = `You are an expert code reviewer. Analyze the provided code snippet and provide constructive feedback. 
Focus on:
1.  Potential bugs and errors.
2.  Adherence to best practices.
3.  Code readability and maintainability.
4.  Performance optimizations.
5.  Security vulnerabilities.
Format your review clearly, using bullet points or numbered lists for specific suggestions. 
If the code is good, acknowledge its strengths before suggesting improvements.
If no specific issues are found, state that the code appears to be well-written for its purpose.`;

// Used if a user signs up via email/password and we want a default avatar
// Or, if OAuth provider doesn't return one, and username is available.
export const MOCK_AVATAR_URL_BASE =
  "https://avatar.iran.liara.run/username?username=";
