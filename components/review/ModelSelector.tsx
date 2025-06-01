
'use client';
import React from 'react';
import { AIModel, AIModelOption } from '@/types/index';
import { AI_MODELS_OPTIONS } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModels: AIModel[];
  onSelectionChange: (selected: AIModel[]) => void;
  isGeminiAvailable: boolean; 
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModels, onSelectionChange, isGeminiAvailable }) => {
  const handleCheckboxChange = (modelId: AIModel, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return; // Should not happen with basic checkbox

    const currentIndex = selectedModels.indexOf(modelId);
    let newSelectedModels = [...selectedModels];

    if (checked && currentIndex === -1) {
      newSelectedModels.push(modelId);
    } else if (!checked && currentIndex !== -1) {
      newSelectedModels.splice(currentIndex, 1);
    }
    onSelectionChange(newSelectedModels);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-foreground mb-3">Select AI Model(s):</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AI_MODELS_OPTIONS.map((model: AIModelOption) => {
          const isDisabled = model.id === AIModel.GEMINI && !isGeminiAvailable; 
          const isSelected = selectedModels.includes(model.id) && !isDisabled;
          
          return (
            <Label
              key={model.id}
              htmlFor={`model-${model.id}`}
              className={cn(
                `flex items-center space-x-3 p-4 border rounded-lg transition-all duration-150 cursor-pointer`,
                isDisabled ? 'bg-muted opacity-60 cursor-not-allowed border-border' 
                           : 'bg-card hover:bg-muted/50 border-border hover:border-primary/50',
                isSelected ? 'border-primary ring-2 ring-primary bg-primary/10' : ''
              )}
            >
              <Checkbox
                id={`model-${model.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => !isDisabled && handleCheckboxChange(model.id, checked)}
                disabled={isDisabled}
                aria-labelledby={`model-label-${model.id}`}
              />
              <span id={`model-label-${model.id}`} className={cn(`text-sm font-medium`, isDisabled ? 'text-muted-foreground' : 'text-foreground')}>
                {model.name}
              </span>
            </Label>
          );
        })}
      </div>
       {AI_MODELS_OPTIONS.find(m => m.id === AIModel.GEMINI && !isGeminiAvailable) && (
        <p className="text-xs text-yellow-500 mt-3">
          Gemini reviews might be unavailable. The server will verify API key access.
        </p>
      )}
    </div>
  );
};

export default ModelSelector;

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add checkbox label