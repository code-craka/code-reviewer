// Simulates API calls to other AI models

export interface MockReviewResponse {
  feedback: string;
  tokensUsed: number;
}

export const getMockReview = (modelName: string, code: string): Promise<MockReviewResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let reviewText = `This is a *simulated* review from ${modelName}.\n`;
      reviewText += `Analyzing the provided code (length: ${code.length} characters):\n\n`;

      if (code.trim().length === 0) {
        reviewText += "- The code is empty. Nothing to review.\n";
      } else {
        const commonSuggestions = [
          "Consider adding more comments for complex logic sections.",
          "Variable names could be more descriptive (e.g., 'temp' vs 'temporaryStorageValue').",
          "Ensure proper error handling is implemented for all external calls.",
          "Look for opportunities to refactor repeated code blocks into reusable functions.",
          "Check for potential off-by-one errors in loops or array accesses.",
          "Ensure all dependencies are up-to-date and secure."
        ];
        
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            reviewText += `- ${commonSuggestions[Math.floor(Math.random() * commonSuggestions.length)]}\n`;
        }

        if (code.includes("TODO")) {
          reviewText += "- Found 'TODO' comments. Ensure these are addressed before production.\n";
        }
        if (code.toLowerCase().includes("password") && !code.toLowerCase().includes("hashedpassword")) {
            reviewText += "- Warning: Detected plain text 'password'. Ensure sensitive data is handled securely.\n"
        }
      }
      
      reviewText += `\nThis simulated review highlights common areas. For a real review, use the actual ${modelName} service.`;
      
      const baseTokens = 50;
      const codeLengthFactor = Math.floor(code.length / 10);
      const responseLengthFactor = Math.floor(reviewText.length / 5);
      const tokensUsed = baseTokens + codeLengthFactor + responseLengthFactor + Math.floor(Math.random() * 50);

      resolve({ feedback: reviewText, tokensUsed });
    }, 1000 + Math.random() * 1500); // Simulate network delay
  });
};
