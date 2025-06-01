import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AIReviewResponse,
  Review,
  ReviewDepth,
  ReviewResult,
  ReviewSeverity,
  ReviewStatus,
} from "@/types/ai";
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Initialize the Gemini API
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generate a code review using Google's Gemini model
 */
export async function generateGeminiReview(
  review: Review,
  depth: ReviewDepth,
): Promise<AIReviewResponse> {
  try {
    const startTime = Date.now();

    // Get the appropriate model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create the system prompt based on review depth
    const systemPrompt = getSystemPrompt(depth);

    // Format the code for review
    const formattedCode = formatCodeForReview(review);

    // Generate a chat with system message and user message
    const result = await model.generateContent([
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "I understand. I will review the code according to your instructions. Please provide the code.",
          },
        ],
      },
      { role: "user", parts: [{ text: formattedCode }] },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse the response to extract review results
    const parsedResults = parseGeminiResponse(text, review);

    const executionTime = Date.now() - startTime;

    return {
      modelId: "gemini-pro",
      results: parsedResults.results,
      summary: parsedResults.summary,
      executionTime,
    };
  } catch (error) {
    logger.error("Error generating Gemini review", {
      error,
      reviewId: review.id,
    });
    throw new Error(`Gemini review failed: ${(error as Error).message}`);
  }
}

/**
 * Generate the system prompt based on review depth
 */
function getSystemPrompt(depth: ReviewDepth): string {
  // Base instructions
  let prompt = `You are an expert code reviewer. I will provide you with code to analyze.
  
Your task is to:
1. Identify issues, bugs, anti-patterns, and improvements
2. Categorize each issue by severity (error, warning, info)
3. Provide specific line numbers for each issue
4. Suggest specific fixes or improvements for each issue
5. Format your response consistently for each issue

For each issue, provide:
- SEVERITY: "error" for critical issues, "warning" for potential problems, "info" for suggestions
- LINE: The line number where the issue occurs
- FILE: The file name (if available)
- MESSAGE: A clear explanation of the issue
- SUGGESTION: Specific code example of how to fix the issue

At the end, provide a brief summary of the most important findings.
`;

  // Add depth-specific instructions
  switch (depth) {
    case "basic":
      prompt += `
For basic review, focus only on:
- Syntax errors and bugs
- Basic code style issues
- Simple optimizations
Limit your review to the most critical issues only.
`;
      break;
    case "standard":
      prompt += `
For standard review, analyze:
- All syntax errors and bugs
- Code style and consistency
- Performance optimizations
- Basic security concerns
- Error handling
Provide a balanced review with a reasonable number of suggestions.
`;
      break;
    case "comprehensive":
      prompt += `
For comprehensive review, provide thorough analysis of:
- All syntax errors and bugs
- Code style and consistency
- Performance optimizations
- Security vulnerabilities
- Error handling and edge cases
- Architecture and design patterns
- Code maintainability and readability
- Test coverage suggestions
- Documentation needs
Don't hold back on any issues or improvements, no matter how small.
`;
      break;
  }

  return prompt;
}

/**
 * Format the code for review
 */
function formatCodeForReview(review: Review): string {
  let formattedCode = "";

  // Add file information if available
  if (review.fileName) {
    formattedCode += `Filename: ${review.fileName}\n`;
  }

  // Add language information if available
  if (review.language) {
    formattedCode += `Language: ${review.language}\n`;
  }

  // Add the code with line numbers
  formattedCode += "\n```\n";
  const codeLines = review.code.split("\n");
  codeLines.forEach((line, index) => {
    formattedCode += `${index + 1}: ${line}\n`;
  });
  formattedCode += "```\n";

  return formattedCode;
}

/**
 * Parse the Gemini response to extract review results
 */
function parseGeminiResponse(
  response: string,
  review: Review,
): { results: ReviewResult[]; summary: string } {
  const results: ReviewResult[] = [];
  let summary = "";

  try {
    // Split the response into lines
    const lines = response.split("\n");

    // Initialize variables to track the current issue being parsed
    let currentIssue: Partial<ReviewResult> = {};
    let parsingIssue = false;
    let summaryStarted = false;
    const summaryLines: string[] = [];

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Check if we've reached the summary section
      if (line.toLowerCase().includes("summary") && !parsingIssue) {
        summaryStarted = true;
        continue;
      }

      // If we're in the summary section, collect the summary lines
      if (summaryStarted) {
        summaryLines.push(line);
        continue;
      }

      // Look for the start of a new issue
      if (line.toLowerCase().startsWith("severity:")) {
        // If we were already parsing an issue, save it
        if (parsingIssue && Object.keys(currentIssue).length > 0) {
          results.push(createReviewResult(currentIssue, review));
        }

        // Start a new issue
        currentIssue = {};
        parsingIssue = true;

        // Parse severity
        const severityMatch = line.match(
          /severity:\s*"?(error|warning|info)"?/i,
        );
        if (severityMatch) {
          currentIssue.severity =
            severityMatch[1].toLowerCase() as ReviewSeverity;
        }

        continue;
      }

      // If we're parsing an issue, look for other properties
      if (parsingIssue) {
        // Parse line number
        if (line.toLowerCase().startsWith("line:")) {
          const lineMatch = line.match(/line:\s*(\d+)/i);
          if (lineMatch) {
            currentIssue.line = parseInt(lineMatch[1], 10);
          }
        }

        // Parse file name
        else if (line.toLowerCase().startsWith("file:")) {
          const fileMatch = line.match(/file:\s*(.+)/i);
          if (fileMatch) {
            currentIssue.file = fileMatch[1].trim();
          }
        }

        // Parse message
        else if (line.toLowerCase().startsWith("message:")) {
          const messageMatch = line.match(/message:\s*(.+)/i);
          if (messageMatch) {
            currentIssue.message = messageMatch[1].trim();
          }
        }

        // Parse suggestion
        else if (line.toLowerCase().startsWith("suggestion:")) {
          const suggestionMatch = line.match(/suggestion:\s*(.+)/i);
          if (suggestionMatch) {
            currentIssue.suggestion = suggestionMatch[1].trim();

            // Check if the next lines contain code examples
            let j = i + 1;
            const codeLines = [];
            while (
              j < lines.length &&
              (lines[j].trim().startsWith("```") ||
                lines[j].includes("```") ||
                (j > i + 1 && lines[j - 1].includes("```")))
            ) {
              codeLines.push(lines[j]);
              j++;
            }

            if (codeLines.length > 0) {
              currentIssue.code = codeLines.join("\n");
              i = j - 1; // Skip the lines we've already processed
            }
          }
        }
      }
    }

    // Save the last issue if we were parsing one
    if (parsingIssue && Object.keys(currentIssue).length > 0) {
      results.push(createReviewResult(currentIssue, review));
    }

    // Join the summary lines
    summary = summaryLines.join("\n").trim();

    // If no summary was found, generate a basic one
    if (!summary) {
      summary = generateFallbackSummary(results);
    }

    return { results, summary };
  } catch (error) {
    logger.error("Error parsing Gemini response", { error, response });

    // Return a fallback result
    return {
      results: [
        {
          id: uuidv4(),
          reviewId: review.id,
          modelId: "gemini-pro",
          message: "Failed to parse review results",
          context: "An error occurred while parsing the AI response",
          severity: "info" as ReviewSeverity,
          status: "open" as ReviewStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      summary:
        "Failed to parse review results. Please try again or contact support if the issue persists.",
    };
  }
}

/**
 * Create a complete review result from a partial one
 */
function createReviewResult(
  partial: Partial<ReviewResult>,
  review: Review,
): ReviewResult {
  return {
    id: uuidv4(),
    reviewId: review.id,
    modelId: "gemini-pro",
    message: partial.message || "Unspecified issue",
    context: partial.context,
    file: partial.file || review.fileName,
    line: partial.line,
    column: partial.column,
    code: partial.code,
    suggestion: partial.suggestion,
    // Ensure proper typing for enum fields
    severity: (partial.severity || "info") as ReviewSeverity,
    status: "open" as ReviewStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a fallback summary if one wasn't provided
 */
function generateFallbackSummary(results: ReviewResult[]): string {
  // Count issues by severity
  const errorCount = results.filter((r) => r.severity === "error").length;
  const warningCount = results.filter((r) => r.severity === "warning").length;
  const infoCount = results.filter((r) => r.severity === "info").length;

  // Generate summary
  return `Code review complete. Found ${errorCount} errors, ${warningCount} warnings, and ${infoCount} suggestions.`;
}
