// __tests__/lib/ai/review-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewService } from "@/lib/ai/review-service";
import { generateReview } from "@/lib/ai/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Mock the dependencies
vi.mock("@/lib/ai/models", () => ({
  generateReview: vi.fn(),
}));

vi.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: vi.fn(),
}));

describe("ReviewService", () => {
  let reviewService: ReviewService;
  let mockSupabase: unknown;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      data: null,
      error: null,
    };

    // Mock the createClientComponentClient function
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase);

    // Create a new instance of ReviewService
    reviewService = new ReviewService();
  });

  describe("getAvailableModels", () => {
    it("should return all models when no user API keys are provided", async () => {
      // Setup
      mockSupabase.data = [];

      // Execute
      const result = await reviewService.getAvailableModels();

      // Verify
      expect(result).toHaveLength(3); // All 3 models
      expect(mockSupabase.from).toHaveBeenCalledWith("user_api_keys");
    });

    it("should filter models based on user API keys", async () => {
      // Setup
      mockSupabase.data = [{ provider: "openai", key: "test-key" }];

      // Execute
      const result = await reviewService.getAvailableModels();

      // Verify
      expect(result.some((model) => model.provider === "openai")).toBeTruthy();
      expect(result.some((model) => model.provider === "gemini")).toBeTruthy(); // Always available
      expect(
        result.some(
          (model) => model.provider === "anthropic" && !model.apiKeyRequired,
        ),
      ).toBeFalsy();
    });
  });

  describe("createReview", () => {
    it("should create a review successfully", async () => {
      // Setup
      const mockReview = {
        id: "test-id",
        code: "const test = 1;",
        language: "typescript",
        fileName: "test.ts",
        modelId: "gemini-pro",
        depth: "standard",
        userId: "test-user-id",
        projectId: "test-project-id",
      };

      // Mock the Supabase response
      mockSupabase.data = { id: "test-id" };

      // Execute
      const result = await reviewService.createReview({
        projectId: mockReview.projectId,
        code: mockReview.code,
        language: mockReview.language,
        fileName: mockReview.fileName,
        modelId: mockReview.modelId,
        depth: mockReview.depth as any,
        userId: mockReview.userId,
      });

      // Verify
      expect(result).toEqual({ id: "test-id" });
      expect(mockSupabase.from).toHaveBeenCalledWith("reviews");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});
