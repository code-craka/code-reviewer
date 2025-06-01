
'use client';

import React, { useState, useCallback, useEffect, useTransition, FormEvent } from 'react';
import { User } from '@supabase/supabase-js';
import { AIModel, ReviewResults, Project as ProjectType, Review } from '@/types/index'; // Added Review
import { AI_MODELS_OPTIONS } from '@/lib/constants';
import { getGeminiReviewAction, GeminiReviewData } from '@/app/actions/geminiActions';
import { getMockReview, MockReviewResponse } from '@/services/mockAIService';
import { createNewProject, updateExistingProject, getUserProjects, getProjectById } from '@/app/actions/projectActions';

import CodeInput from '@/components/review/CodeInput'; 
import ModelSelector from '@/components/review/ModelSelector';
import ReviewOutput from '@/components/review/ReviewOutput';
import Spinner from '@/components/ui/spinner';
import AlertComponent from '@/components/ui/customalert'; // Renamed to avoid conflict
import { Save, FolderPlus, RotateCcw } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
// cn import removed as it's not being used

interface ReviewerClientPageProps {
  user: User;
  initialProjects: ProjectType[];
}

export default function ReviewerClientPage({ user, initialProjects }: ReviewerClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [projects, setProjects] = useState<ProjectType[]>(initialProjects);
  const [currentProject, setCurrentProject] = useState<ProjectType | null>(null);
  
  const [currentCodeInEditor, setCurrentCodeInEditor] = useState<string>('// Welcome! Select a project or start coding in scratchpad mode.');
  const [newProjectNameFromReviewer, setNewProjectNameFromReviewer] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
  const [reviews, setReviews] = useState<ReviewResults>({});
  
  // const [isGeminiApiKeyAvailable, setIsGeminiApiKeyAvailable] = useState<boolean>(true); // Server will handle availability
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalInfo, setGlobalInfo] = useState<string | null>(null);
  
  useEffect(() => setIsClientMounted(true), []);

  useEffect(() => {
    const projectIdFromQuery = searchParams.get('projectId');
    if (projectIdFromQuery) {
      if(currentProject?.id !== projectIdFromQuery) { // Only load if different project
        startTransition(async () => {
          const response = await getProjectById(projectIdFromQuery);
          if (response.success && response.data) {
            setCurrentProject(response.data);
            setCurrentCodeInEditor(response.data.code || '');
            setGlobalInfo(`Project "${response.data.name}" loaded.`);
          } else {
            setGlobalError(response.error as string || `Could not load project ${projectIdFromQuery}.`);
            router.replace(pathname, { scroll: false }); 
          }
        });
      }
    } else if (currentProject) { 
      handleSwitchToScratchpad(false); // Don't show info message if it's initial load
    } else {
      setCurrentCodeInEditor('// Start coding in scratchpad mode or select a project.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, pathname]); // currentProject removed to prevent loops on selection

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
    if (globalInfo) {
      const timer = setTimeout(() => setGlobalInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalInfo]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCurrentCodeInEditor(newCode);
  }, []);

  const handleModelSelectionChange = useCallback((models: AIModel[]) => {
    setSelectedModels(models);
  }, []);

  const handleGetReviewSubmit = useCallback(async () => {
    if (!currentCodeInEditor.trim()) {
      setGlobalError("Please enter some code to review.");
      return;
    }
    if (selectedModels.length === 0) {
      setGlobalError("Please select at least one AI model for review.");
      return;
    }
    setGlobalError(null);
    
    const initialReviewsData: ReviewResults = {};
    selectedModels.forEach(modelId => {
      const modelOption = AI_MODELS_OPTIONS.find(opt => opt.id === modelId);
      if (modelOption) {
         initialReviewsData[modelId] = { 
          model: modelId, 
          modelName: modelOption.name,
          feedback: null, error: null, isLoading: true, tokensUsed: 0
        };
      }
    });
    setReviews(initialReviewsData);

    startTransition(async () => {
      for (const modelId of selectedModels) {
        const modelOption = AI_MODELS_OPTIONS.find(opt => opt.id === modelId)!;
        try {
          let reviewResponseData: GeminiReviewData | MockReviewResponse | null = null;
          if (modelId === AIModel.GEMINI) {
            const geminiResult = await getGeminiReviewAction(currentCodeInEditor);
            if (!geminiResult.success) throw new Error(geminiResult.error as string || 'Gemini review failed');
            reviewResponseData = geminiResult.data!;
          } else { 
            reviewResponseData = await getMockReview(modelOption.name, currentCodeInEditor);
          }
          setReviews(prev => ({
            ...prev,
            [modelId]: { ...prev[modelId]!, feedback: reviewResponseData!.feedback, tokensUsed: reviewResponseData!.tokensUsed, isLoading: false, error: null }
          }));
        } catch (error) {
          console.error(`Error reviewing with ${modelOption.name}:`, error);
          setReviews(prev => ({
            ...prev,
            [modelId]: { ...prev[modelId]!, error: (error as Error).message || `Failed to get review from ${modelOption.name}`, isLoading: false }
          }));
        }
      }
    });
  }, [currentCodeInEditor, selectedModels]);

  const handleSaveProject = async () => {
    if (!currentProject) {
      setGlobalError("No active project selected. Cannot save.");
      return;
    }
    if (currentCodeInEditor === (currentProject.code || '')) {
      setGlobalInfo("No changes to save in the current project.");
      return;
    }
    
    const formData = new FormData();
    formData.append('projectId', currentProject.id);
    formData.append('code', currentCodeInEditor);

    startTransition(async () => {
      const result = await updateExistingProject(formData);
      if (result.success && result.data) {
        setGlobalInfo(`Project "${result.data.name}" saved successfully.`);
        setCurrentProject(result.data);
        setProjects(prev => prev.map(p => p.id === result.data!.id ? result.data! : p));
      } else {
        setGlobalError(result.error as string || "Failed to save project.");
      }
    });
  };
  
  const handleCreateNewProjectFromReviewer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectNameFromReviewer.trim()) {
        setGlobalError("Project name cannot be empty.");
        return;
    }
    const formData = new FormData();
    formData.append('name', newProjectNameFromReviewer);
    formData.append('code', currentCodeInEditor);

    startTransition(async () => {
      const result = await createNewProject(formData);
      if (result.success && result.data) {
        setGlobalInfo(`Project "${result.data.name}" created and current code saved.`);
        setCurrentProject(result.data); 
        setProjects(prev => [result.data!, ...prev]);
        setIsNewProjectModalOpen(false);
        setNewProjectNameFromReviewer('');
        router.push(`${pathname}?projectId=${result.data.id}`, { scroll: false }); 
      } else {
        setGlobalError(result.error as string || "Failed to create new project.");
      }
    });
  };

  const handleSwitchToScratchpad = (showInfo: boolean = true) => {
    setCurrentProject(null);
    setCurrentCodeInEditor('// Start coding in scratchpad mode...');
    if (showInfo) setGlobalInfo("Switched to scratchpad mode.");
    if (searchParams.get('projectId')) {
      router.push(pathname, { scroll: false }); 
    }
  };

  const refreshProjects = useCallback(() => {
    startTransition(async () => {
      const result = await getUserProjects();
      if (result.success && result.data) {
        setProjects(result.data);
        if (currentProject) {
          const updatedCurrent = result.data.find(p => p.id === currentProject.id);
          if (!updatedCurrent) { // Current project might have been deleted elsewhere
             handleSwitchToScratchpad();
          } else if ((updatedCurrent.code || '') !== (currentProject.code || '') && (updatedCurrent.code || '') !== currentCodeInEditor) {
            // If project was updated server-side and differs from local editor and local currentProject state
             setCurrentProject(updatedCurrent);
             setCurrentCodeInEditor(updatedCurrent.code || '');
             setGlobalInfo(`Project "${updatedCurrent.name}" reloaded with latest changes.`);
          }
        }
         setGlobalInfo("Project list refreshed.");
      } else {
        setGlobalError("Failed to refresh projects.");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject, currentCodeInEditor, pathname, router]);


  const loadProject = (projectId: string) => {
    if (!projectId) {
        handleSwitchToScratchpad();
        return;
    }
    router.push(`${pathname}?projectId=${projectId}`, { scroll: false });
  };
  
  if (!isClientMounted && !searchParams.get('projectId')) {
    return <div className="flex justify-center items-center p-10"><Spinner className="h-10 w-10" /> <span className="ml-3 text-muted-foreground">Initializing Reviewer...</span></div>;
  }
  if (isPending && searchParams.get('projectId') && !currentProject) {
    return <div className="flex justify-center items-center p-10"><Spinner className="h-10 w-10" /> <span className="ml-3 text-muted-foreground">Loading project...</span></div>;
  }

  const codeHasUnsavedChanges = currentProject && currentCodeInEditor !== (currentProject.code || '');
  const isGeminiAvailable = true; // Server handles API key validation now
  const isAnyReviewLoading = Object.values(reviews).filter(Boolean).some((r: Review) => r.isLoading);


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {globalError && <AlertComponent type="error" title="Error" message={globalError} onClose={() => setGlobalError(null)} className="mb-4" />}
      {globalInfo && <AlertComponent type="info" title="Info" message={globalInfo} onClose={() => setGlobalInfo(null)} className="mb-4" />}

      <div className="bg-card shadow-2xl rounded-lg p-6 sm:p-8 mb-8">
        {currentProject && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-md text-sm text-primary flex justify-between items-center">
            <div>
              Active Project: <strong className="font-semibold">{currentProject.name}</strong>
              {codeHasUnsavedChanges && <span className="ml-2 text-yellow-400">(Unsaved Changes)</span>}
            </div>
            <Button 
              variant="ghost" size="sm"
              onClick={() => handleSwitchToScratchpad()}
              title="Clear active project and use scratchpad"
            >
              Switch to Scratchpad
            </Button>
          </div>
        )}
        {!currentProject && (
          <div className="mb-4 p-3 bg-muted border border-border rounded-md text-sm text-muted-foreground">
            Currently in scratchpad mode. Changes are not saved unless you create a new project.
          </div>
        )}
        
        <div className="mb-4">
          <Label htmlFor="project-selector" className="mb-1">Load Project:</Label>
          <div className="flex gap-2">
            <Select 
              value={currentProject?.id || ""}
              onValueChange={loadProject}
            >
              <SelectTrigger id="project-selector" className="flex-grow">
                <SelectValue placeholder={currentProject ? "Switch to Scratchpad..." : "Select a Project..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{currentProject ? "Switch to Scratchpad" : "Select a Project..."}</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={refreshProjects} disabled={isPending} variant="outline" size="icon" title="Refresh project list">
              <RotateCcw size={18} className={isPending ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <CodeInput value={currentCodeInEditor} onChange={handleCodeChange} />
        <ModelSelector
          selectedModels={selectedModels}
          onSelectionChange={handleModelSelectionChange}
          isGeminiAvailable={isGeminiAvailable}
        />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            onClick={handleGetReviewSubmit}
            disabled={isPending || !currentCodeInEditor.trim() || selectedModels.length === 0}
            className="w-full"
          >
            {isPending && isAnyReviewLoading ? <Spinner /> : 'Get Review'}
          </Button>
          {currentProject ? (
            <Button
              variant="secondary"
              onClick={handleSaveProject}
              disabled={isPending || !codeHasUnsavedChanges}
              className="w-full"
            >
              {isPending && !isAnyReviewLoading ? <Spinner /> : <Save size={18} className="mr-2"/>} Save Project
            </Button>
          ) : (
            <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={isPending || !currentCodeInEditor.trim()}
                  className="w-full"
                >
                  <FolderPlus size={18} className="mr-2"/> Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>The current code in the editor will be saved as the initial code for this new project.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNewProjectFromReviewer} className="space-y-4">
                  <div>
                    <Label htmlFor="newProjectNameFromReviewer">Project Name</Label>
                    <Input
                      id="newProjectNameFromReviewer"
                      value={newProjectNameFromReviewer}
                      onChange={(e) => setNewProjectNameFromReviewer(e.target.value)}
                      required
                      placeholder="My New Code Project"
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? <Spinner className="mr-2"/> : <FolderPlus size={18} className="mr-2"/>} Create and Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
            <Button
            variant="outline"
            onClick={() => router.push('/projects')}
            className="w-full"
          >
            View All Projects
          </Button>
        </div>
      </div>

      {Object.keys(reviews).length > 0 && (
        <motion.div layout className="space-y-6">
          <AnimatePresence>
            {AI_MODELS_OPTIONS.filter(opt => selectedModels.includes(opt.id)).map((modelOption) => {
              const review = reviews[modelOption.id];
              if (!review) return null;
              return (
                <motion.div
                  key={modelOption.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReviewOutput review={review} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add button select dialog input label
// AlertComponent is used from components/ui/CustomAlert.tsx
// Spinner is used from components/ui/Spinner.tsx