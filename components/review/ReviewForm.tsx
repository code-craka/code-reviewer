"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewDepth } from "@/types/ai";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { createReviewAction, processReviewAction } from "@/app/reviews/actions";
import { useToast } from "@/components/ui/use-toast";
// import { Code } from '@/components/ui/code';

interface ReviewFormProps {
  projectId?: string;
}

export function ReviewForm({ projectId }: ReviewFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [fileName, setFileName] = useState("");
  const [modelId, setModelId] = useState("gemini-pro");
  const [depth, setDepth] = useState<ReviewDepth>("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setCurrentReviewId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        title: "Code required",
        description: "Please enter code to review",
        variant: "destructive",
      });
      return;
    }

    if (!language.trim()) {
      toast({
        title: "Language required",
        description: "Please select a programming language",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createReviewAction(
        code,
        language,
        fileName || null,
        modelId,
        depth,
        projectId,
      );

      if (result.error) {
        toast({
          title: "Error creating review",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Check for successful result with a review object
      if (
        "error" in result &&
        !result.error &&
        "review" in result &&
        result.review
      ) {
        toast({
          title: "Review created",
          description: "Now processing your code review",
        });

        setCurrentReviewId(result.review.id);
        setIsLoading(false);
        setIsProcessing(true);

        // Process the review
        // Process the review
        const processResult = await processReviewAction(result.review.id);

        if ("error" in processResult && processResult.error) {
          toast({
            title: "Error processing review",
            description: processResult.error,
            variant: "destructive",
          });
        } else if ("success" in processResult && processResult.success) {
          toast({
            title: "Review complete",
            description: "Your code has been reviewed",
          });
          // Redirect to the review page
          router.push(`/reviews/${result.review.id}`);
        } else {
          toast({
            title: "Error processing review",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Review complete",
          description: "Your code has been reviewed",
        });

        // Redirect to the review page
        router.push(`/reviews/${result.review.id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${(error as Error).message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Code Review</CardTitle>
        <CardDescription>
          Submit your code for an AI-powered review
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here"
              className="h-64 font-mono"
              disabled={isLoading || isProcessing}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={isLoading || isProcessing}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                  <SelectItem value="swift">Swift</SelectItem>
                  <SelectItem value="kotlin">Kotlin</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileName">File Name (Optional)</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g., main.ts"
                disabled={isLoading || isProcessing}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>AI Model</Label>
            <RadioGroup
              value={modelId}
              onValueChange={setModelId}
              className="flex flex-col space-y-2"
              disabled={isLoading || isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini-pro" id="gemini" />
                <Label htmlFor="gemini" className="cursor-pointer">
                  Gemini Pro (Google)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gpt-4" id="gpt4" />
                <Label htmlFor="gpt4" className="cursor-pointer">
                  GPT-4 Turbo (OpenAI) - API Key Required
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="claude-3-opus" id="claude" />
                <Label htmlFor="claude" className="cursor-pointer">
                  Claude 3 Opus (Anthropic) - API Key Required
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Review Depth</Label>
            <RadioGroup
              value={depth}
              onValueChange={(value) => setDepth(value as ReviewDepth)}
              className="flex flex-col space-y-2"
              disabled={isLoading || isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="cursor-pointer">
                  Basic - Quick review for syntax and obvious issues
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="cursor-pointer">
                  Standard - Comprehensive review with style and optimization
                  suggestions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comprehensive" id="comprehensive" />
                <Label htmlFor="comprehensive" className="cursor-pointer">
                  Comprehensive - In-depth analysis including architecture,
                  security, and edge cases
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || isProcessing}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              isLoading || isProcessing || !code.trim() || !language.trim()
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Review...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Review...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
