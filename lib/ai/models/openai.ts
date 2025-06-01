import OpenAI from "openai";
import {
  AIReviewResponse,
  Review,
  ReviewDepth,
  ReviewResult,
  ReviewSeverity,
} from "@/types/ai";
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Generate a code review using OpenAI GPT-4 model
 */
export async function generateOpenAIReview(
  review: Review,
  depth: ReviewDepth,
): Promise<AIReviewResponse> {
  try {
    const startTime = Date.now();

    // Get the API key for the user
    const apiKey = await getUserOpenAIKey(review.userId);
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not found. Please add your API key in the settings.",
      );
    }

    // Initialize the OpenAI client
    const openai = new OpenAI({ apiKey });

    // Create the system prompt based on review depth
    const systemPrompt = getSystemPrompt(depth);

    // Format the code for review
    const formattedCode = formatCodeForReview(review);

    // Generate a chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: formattedCode },
      ],
      temperature: 0.1, // Lower temperature for more focused and deterministic reviews
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content || "";

    // Parse the response to extract review results
    const parsedResults = parseOpenAIResponse(text, review);

    const executionTime = Date.now() - startTime;

    return {
      modelId: "gpt-4",
      results: parsedResults.results,
      summary: parsedResults.summary,
      executionTime,
    };
  } catch (error) {
    logger.error("Error generating OpenAI review", {
      error,
      reviewId: review.id,
    });
    throw new Error(`OpenAI review failed: ${(error as Error).message}`);
  }
}

/**
 * Get the user's OpenAI API key from the database
 */
async function getUserOpenAIKey(userId?: string): Promise<string | null> {
  if (!userId) return null;

  try {
    // Ensure we properly await the Supabase client before using it
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("ApiKey")
      .select("key")
      .eq("userId", userId)
      .eq("provider", "openai")
      .single();

    if (error || !data) {
      logger.error("Failed to get OpenAI API key", {
        error: error?.message,
        userId,
      });
      return null;
    }

    return data.key;
  } catch (error) {
    logger.error("Error retrieving OpenAI API key", { error });
    return null;
  }
}

/**
 * Generate the system prompt based on review depth
 */
function getSystemPrompt(depth: ReviewDepth): string {
  // Base instructions
  let prompt = `You are an expert code reviewer with extensive experience in software development and best practices. 
I will provide you with code to analyze for issues, bugs, and improvements.

For each issue you identify, strictly adhere to this format:
- SEVERITY: [error|warning|info]
- LINE: [line number]
- FILE: [file name if available]
- MESSAGE: [clear explanation of the issue]
- SUGGESTION: [specific code example of how to fix the issue]

Severity definitions:
- "error": Critical issues that will cause bugs, crashes, or security vulnerabilities
- "warning": Issues that may lead to problems, maintainability issues, or inefficiencies
- "info": Suggestions for improvement that are not problematic but could enhance quality

After listing all issues, end with a "SUMMARY" section that briefly highlights the most important findings and overall code quality.
`;

  // Add depth-specific instructions
  switch (depth) {
    case "basic":
      prompt += `
For this basic review, focus only on:
- Syntax errors and obvious bugs
- Basic code style issues
- Simple optimizations
Limit your review to the most critical issues only (maximum 5 issues).
`;
      break;
    case "standard":
      prompt += `
For this standard review, analyze:
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
For this comprehensive review, provide thorough analysis of:
- All syntax errors and bugs
- Code style and consistency
- Performance optimizations and bottlenecks
- Security vulnerabilities and best practices
- Error handling and edge cases
- Architecture and design patterns
- Code maintainability and readability
- Test coverage suggestions
- Documentation needs
- Potential edge cases not handled
Don't hold back on any issues or improvements, no matter how small.
`;
      break;
  }

  prompt += `
VERY IMPORTANT: 
1. Do not include any explanation before or after the issue list and summary.
2. Start immediately with the first issue, or indicate "No issues found" if the code is perfect.
3. Use only the exact format specified above for each issue.
4. Always provide concrete, specific suggestions that show exactly how to implement your recommendations.
5. Focus on actionable, specific feedback rather than general principles.
`;

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
 * Parse the OpenAI response to extract review results
 */
function parseOpenAIResponse(
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
      if (
        line.toUpperCase().includes("SUMMARY:") ||
        line.toUpperCase() === "SUMMARY"
      ) {
        summaryStarted = true;
        continue;
      }

      // If we're in the summary section, collect the summary lines
      if (summaryStarted) {
        summaryLines.push(line);
        continue;
      }

      // Special case for "No issues found"
      if (line.toLowerCase().includes("no issues found")) {
        summary = "No issues found. The code appears to be well-written.";
        break;
      }

      // Look for the start of a new issue
      if (line.toUpperCase().startsWith("SEVERITY:")) {
        // If we were already parsing an issue, save it
        if (parsingIssue && Object.keys(currentIssue).length > 0) {
          results.push(createReviewResult(currentIssue, review));
        }

        // Start a new issue
        currentIssue = {};
        parsingIssue = true;

        // Parse severity
        const severityMatch = line.match(/SEVERITY:\s*(?:"|')?(\w+)(?:"|')?/i);
        if (severityMatch) {
          currentIssue.severity =
            severityMatch[1].toLowerCase() as ReviewSeverity;
        }

        continue;
      }

      // If we're parsing an issue, look for other properties
      if (parsingIssue) {
        // Parse line number
        if (line.toUpperCase().startsWith("LINE:")) {
          const lineMatch = line.match(/LINE:\s*(\d+)/i);
          if (lineMatch) {
            currentIssue.line = parseInt(lineMatch[1], 10);
          }
        }

        // Parse file name
        else if (line.toUpperCase().startsWith("FILE:")) {
          const fileMatch = line.match(/FILE:\s*(.+)/i);
          if (fileMatch) {
            currentIssue.file = fileMatch[1].trim();
          }
        }

        // Parse message
        else if (line.toUpperCase().startsWith("MESSAGE:")) {
          const messageMatch = line.match(/MESSAGE:\s*(.+)/i);
          if (messageMatch) {
            currentIssue.message = messageMatch[1].trim();
          }
        }

        // Parse suggestion
        else if (line.toUpperCase().startsWith("SUGGESTION:")) {
          const suggestionMatch = line.match(/SUGGESTION:\s*(.+)/i);
          if (suggestionMatch) {
            currentIssue.suggestion = suggestionMatch[1].trim();

            // Check if the next lines contain code examples
            let j = i + 1;
            const codeLines = [];
            while (
              j < lines.length &&
              (lines[j].trim().startsWith("```") ||
                lines[j].trim().startsWith("    ") ||
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
    logger.error("Error parsing OpenAI response", { error, response });

    // Return a fallback result
    return {
      results: [
        {
          id: uuidv4(),
          reviewId: review.id,
          modelId: "gpt-4",
          message: "Failed to parse review results",
          context: "An error occurred while parsing the AI response",
          severity: "info",
          status: "open",
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
    modelId: "gpt-4",
    message: partial.message || "Unspecified issue",
    context: partial.context,
    file: partial.file || review.fileName,
    line: partial.line,
    column: partial.column,
    code: partial.code,
    suggestion: partial.suggestion,
    // Ensure proper typing for enum fields
    severity: partial.severity || "info",
    status: "open",
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
