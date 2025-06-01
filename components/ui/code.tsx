// components/ui/code.tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CodeProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  highlight?: number[];
}

export function Code({
  code,
  language = "typescript",
  showLineNumbers = true,
  className,
  highlight = [],
}: CodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className={cn("relative rounded-md bg-muted", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="text-sm text-muted-foreground">{language}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {copied ? "Copied" : "Copy code"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy code"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono">
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "relative",
                highlight.includes(i + 1) && "bg-muted-foreground/10",
              )}
            >
              {showLineNumbers && (
                <span className="inline-block w-8 text-right pr-2 text-muted-foreground">
                  {i + 1}
                </span>
              )}
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
