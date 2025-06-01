"use client";

import React, { useState } from "react";
import {
  Review,
  ReviewResult,
  ReviewSeverity,
  ReviewStatus,
  ReviewVisualizationOptions,
} from "@/types/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  AlertTriangleIcon,
  InfoIcon,
  XCircleIcon,
  CheckCircleIcon,
  EyeOffIcon,
} from "lucide-react";
import { updateReviewResultStatusAction } from "@/app/reviews/actions";
import { cn } from "@/lib/utils";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface ReviewResultsProps {
  review: Review;
  options?: ReviewVisualizationOptions;
}

export function ReviewResults({ review, options }: ReviewResultsProps) {
  const { toast } = useToast();
  const [visualizationOptions, setVisualizationOptions] =
    useState<ReviewVisualizationOptions>(
      options || {
        groupBy: "severity",
        sortBy: "severity",
        sortDirection: "desc",
        showDiff: true,
        showContext: true,
        compactView: false,
      },
    );

  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set(),
  );

  // Default to empty array if results is undefined
  const results = review.results || [];

  // Handle no results case
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Results</CardTitle>
          <CardDescription>No results found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {review.summary || "No issues were found in the code."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group results based on visualization options
  const groupedResults = groupResults(results, visualizationOptions);

  // Handle toggle for expanding/collapsing result details
  const toggleResultExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  // Handle toggling all results expanded/collapsed
  const toggleAllResults = (expand: boolean) => {
    if (expand) {
      const allIds = results.map((result) => result.id);
      setExpandedResults(new Set(allIds));
    } else {
      setExpandedResults(new Set());
    }
  };

  // Handle updating result status
  const handleUpdateStatus = async (resultId: string, status: ReviewStatus) => {
    try {
      const result = await updateReviewResultStatusAction(resultId, status);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status updated",
        description: `Result marked as ${status}`,
      });

      // Update the local state to reflect the change
      // This is a temporary solution until we implement real-time updates
      const updatedResults = results.map((r) =>
        r.id === resultId ? { ...r, status } : r,
      );

      // Update the review object with the updated results
      // This is not ideal but works for now
      review.results = updatedResults as ReviewResult[];
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update status: ${(error as Error).message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Update visualization options
  const updateOptions = (newOptions: Partial<ReviewVisualizationOptions>) => {
    setVisualizationOptions((prev) => ({
      ...prev,
      ...newOptions,
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Review Results</CardTitle>
            <CardDescription>
              {review.modelId} | {results.length} issues found
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllResults(true)}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllResults(false)}
            >
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Tabs defaultValue={visualizationOptions.groupBy}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger
                  value="severity"
                  onClick={() => updateOptions({ groupBy: "severity" })}
                >
                  By Severity
                </TabsTrigger>
                <TabsTrigger
                  value="file"
                  onClick={() => updateOptions({ groupBy: "file" })}
                >
                  By File
                </TabsTrigger>
                <TabsTrigger
                  value="status"
                  onClick={() => updateOptions({ groupBy: "status" })}
                >
                  By Status
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-context" className="text-sm">
                    Show Context
                  </Label>
                  <input
                    type="checkbox"
                    id="show-context"
                    checked={visualizationOptions.showContext}
                    onChange={(e) =>
                      updateOptions({ showContext: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="compact-view" className="text-sm">
                    Compact View
                  </Label>
                  <input
                    type="checkbox"
                    id="compact-view"
                    checked={visualizationOptions.compactView}
                    onChange={(e) =>
                      updateOptions({ compactView: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>

            <TabsContent value={visualizationOptions.groupBy || "severity"}>
              {Object.entries(groupedResults).map(
                ([groupKey, groupResults]) => (
                  <div key={groupKey} className="mb-6">
                    <h3 className="text-lg font-medium mb-2">
                      {getGroupTitle(
                        groupKey,
                        visualizationOptions.groupBy || "severity",
                      )}
                      <Badge variant="outline" className="ml-2">
                        {groupResults.length}
                      </Badge>
                    </h3>

                    <div className="space-y-3">
                      {groupResults.map((result) => (
                        <ResultItem
                          key={result.id}
                          result={result}
                          expanded={expandedResults.has(result.id)}
                          onToggleExpand={() => toggleResultExpanded(result.id)}
                          onUpdateStatus={handleUpdateStatus}
                          visualizationOptions={visualizationOptions}
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </TabsContent>
          </Tabs>
        </div>

        {review.summary && (
          <div className="mt-6 p-4 bg-secondary/30 rounded-md">
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {review.summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual result item component
interface ResultItemProps {
  result: ReviewResult;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (resultId: string, status: ReviewStatus) => void;
  visualizationOptions: ReviewVisualizationOptions;
}

function ResultItem({
  result,
  expanded,
  onToggleExpand,
  onUpdateStatus,
  visualizationOptions,
}: ResultItemProps) {
  return (
    <Collapsible
      open={expanded}
      onOpenChange={onToggleExpand}
      className={cn(
        "border rounded-md overflow-hidden transition-all",
        result.severity === "error" && "border-l-4 border-l-destructive",
        result.severity === "warning" && "border-l-4 border-l-warning",
        result.severity === "info" && "border-l-4 border-l-info",
        result.status === "fixed" && "opacity-70",
        result.status === "ignored" && "opacity-50",
      )}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50">
          <div className="flex items-center gap-3">
            {getSeverityIcon(result.severity)}
            <div>
              <div className="font-medium">
                {visualizationOptions.compactView
                  ? truncateText(result.message, 60)
                  : result.message}
              </div>
              <div className="text-xs text-muted-foreground">
                {result.file &&
                  `${result.file}${result.line ? `:${result.line}` : ""}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={result.status} />
            {expanded ? (
              <ChevronUpIcon size={16} />
            ) : (
              <ChevronDownIcon size={16} />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-3 border-t bg-card">
          {visualizationOptions.showContext && result.context && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Context:
              </Label>
              <div className="text-sm rounded bg-muted p-2">
                {result.context}
              </div>
            </div>
          )}

          {result.suggestion && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Suggestion:
              </Label>
              <div className="text-sm">{result.suggestion}</div>
            </div>
          )}

          {result.code && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Code Example:
              </Label>
              <SyntaxHighlighter
                language={result.file?.split(".").pop() || "typescript"}
                style={atomOneDark}
                customStyle={{ borderRadius: "0.375rem", fontSize: "0.875rem" }}
              >
                {result.code}
              </SyntaxHighlighter>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(result.id, "fixed")}
                    disabled={result.status === "fixed"}
                  >
                    <CheckCircleIcon size={16} className="mr-1" />
                    Mark Fixed
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark this issue as fixed</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(result.id, "ignored")}
                    disabled={result.status === "ignored"}
                  >
                    <EyeOffIcon size={16} className="mr-1" />
                    Ignore
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ignore this issue</p>
                </TooltipContent>
              </Tooltip>

              {(result.status === "fixed" || result.status === "ignored") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateStatus(result.id, "open")}
                    >
                      <XCircleIcon size={16} className="mr-1" />
                      Reopen
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reopen this issue</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Helper function to group results based on visualization options
function groupResults(
  results: ReviewResult[],
  options: ReviewVisualizationOptions,
): Record<string, ReviewResult[]> {
  const {
    groupBy = "severity",
    sortBy = "severity",
    sortDirection = "desc",
  } = options;

  // First sort the results
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "severity": {
        const severityOrder: Record<ReviewSeverity, number> = {
          error: 3,
          warning: 2,
          info: 1,
        };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      }
      case "line": {
        const lineA = a.line || 0;
        const lineB = b.line || 0;
        comparison = lineA - lineB;
        break;
      }
      case "file": {
        const fileA = a.file || "";
        const fileB = b.file || "";
        comparison = fileA.localeCompare(fileB);
        break;
      }
    }

    return sortDirection === "desc" ? -comparison : comparison;
  });

  // Then group them
  const grouped: Record<string, ReviewResult[]> = {};

  sortedResults.forEach((result) => {
    let groupKey: string;

    switch (groupBy) {
      case "severity":
        groupKey = result.severity;
        break;
      case "file":
        groupKey = result.file || "Unknown";
        break;
      case "status":
        groupKey = result.status;
        break;
      default:
        groupKey = "unknown";
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }

    grouped[groupKey].push(result);
  });

  return grouped;
}

// Helper function to get a friendly title for each group
function getGroupTitle(groupKey: string, groupBy: string): string {
  switch (groupBy) {
    case "severity":
      return (
        {
          error: "Errors",
          warning: "Warnings",
          info: "Suggestions",
        }[groupKey] || groupKey
      );

    case "status":
      return (
        {
          open: "Open",
          fixed: "Fixed",
          ignored: "Ignored",
        }[groupKey] || groupKey
      );

    case "file":
      return groupKey;

    default:
      return groupKey;
  }
}

// Helper function to get the appropriate icon for each severity level
function getSeverityIcon(severity: ReviewSeverity) {
  switch (severity) {
    case "error":
      return <XCircleIcon size={18} className="text-destructive" />;
    case "warning":
      return <AlertTriangleIcon size={18} className="text-warning" />;
    case "info":
      return <InfoIcon size={18} className="text-info" />;
    default:
      return <FileTextIcon size={18} />;
  }
}

// Component for displaying the status badge
function StatusBadge({ status }: { status: ReviewStatus }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  switch (status) {
    case "open":
      variant = "default";
      break;
    case "fixed":
      variant = "secondary";
      break;
    case "ignored":
      variant = "destructive";
      break;
  }

  return <Badge variant={variant}>{status}</Badge>;
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
