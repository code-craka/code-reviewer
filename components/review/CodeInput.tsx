'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, className }) => {
  return (
    <div className={cn("mb-6", className)}>
      <Label htmlFor="codeInput" className="block text-sm font-medium text-muted-foreground mb-2">
        Paste your code snippet below:
      </Label>
      <Textarea
        id="codeInput"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder="function example() {&#10;  console.log('Hello, AI reviewer!');&#10;}"
        rows={15}
        className="w-full p-4 bg-background text-foreground border border-input rounded-lg shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder-muted-foreground font-mono text-sm transition-colors duration-150"
        aria-label="Code input area"
      />
    </div>
  );
};

export default CodeInput;

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add label textarea
