
'use client';

import React, { useState, useEffect, useTransition, FormEvent, useCallback } from 'react';
import { Project } from '@/types/index';
import { createNewProject, updateExistingProject, deleteExistingProject, getUserProjects } from '@/app/actions/projectActions';
import Spinner from '@/components/ui/spinner';
import AlertComponent from '@/components/ui/customalert';
import { PlusCircle, Edit, Trash2, FolderOpen, FileText, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectsClientPageProps {
  initialProjects: Project[];
}

const ProjectsClientPage: React.FC<ProjectsClientPageProps> = ({ initialProjects }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectInitialCode, setNewProjectInitialCode] = useState('');
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameProjectNameInput, setRenameProjectNameInput] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  useEffect(() => setIsClientMounted(true), []);
  
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const refreshProjects = useCallback(() => {
    startTransition(async () => {
      const result = await getUserProjects();
      if (result.success && result.data) {
        setProjects(result.data);
        setFeedback({type: 'info', message: 'Projects list refreshed.'});
      } else {
        setFeedback({type: 'error', message: result.error as string || 'Failed to refresh projects.'});
      }
    });
  }, []);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setFeedback({ type: 'error', message: 'Project name cannot be empty.' });
      return;
    }
    const formData = new FormData();
    formData.append('name', newProjectName);
    formData.append('code', newProjectInitialCode);

    startTransition(async () => {
      const result = await createNewProject(formData);
      setFeedback({ type: result.success ? 'success' : 'error', message: result.message || result.error as string});
      if (result.success) {
        setIsCreateModalOpen(false);
        setNewProjectName('');
        setNewProjectInitialCode('');
        refreshProjects(); 
      }
    });
  };

  const handleOpenProject = (project: Project) => {
    router.push(`/reviewer?projectId=${project.id}`);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    // Consider using ShadCN Dialog for confirmation
    if (window.confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      startTransition(async () => {
        const result = await deleteExistingProject(projectId);
        setFeedback({ type: result.success ? 'success' : 'error', message: result.message || result.error as string });
        if (result.success) {
          refreshProjects(); 
        }
      });
    }
  };

  const openRenameModal = (project: Project) => {
    setEditingProject(project);
    setRenameProjectNameInput(project.name);
    setIsRenameModalOpen(true);
  };

  const handleRenameProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject || !renameProjectNameInput.trim()) {
      setFeedback({ type: 'error', message: 'Project name cannot be empty for renaming.' });
      return;
    }
    const formData = new FormData();
    formData.append('projectId', editingProject.id);
    formData.append('name', renameProjectNameInput);

    startTransition(async () => {
      const result = await updateExistingProject(formData);
       setFeedback({ type: result.success ? 'success' : 'error', message: result.message || result.error as string});
      if (result.success) {
        setEditingProject(null);
        setRenameProjectNameInput('');
        setIsRenameModalOpen(false);
        refreshProjects(); 
      }
    });
  };
  
  if (!isClientMounted && projects.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <Spinner className="h-12 w-12 text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your projects...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-4"
    >
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4 sm:mb-0">My Projects</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshProjects}
            disabled={isPending}
            title="Refresh projects list"
          >
            <RotateCcw size={18} className={isPending ? 'animate-spin': ''} />
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={isPending}>
                <PlusCircle size={20} className="mr-2" /> Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              {/* The form itself might need its own error display if very complex */}
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="newProjectName">Project Name</Label>
                  <Input
                    id="newProjectName"
                    name="name" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <Label htmlFor="newProjectInitialCode">Initial Code (Optional)</Label>
                  <Textarea
                    id="newProjectInitialCode"
                    name="code" 
                    value={newProjectInitialCode}
                    onChange={(e) => setNewProjectInitialCode(e.target.value)}
                    rows={5}
                    placeholder="console.log('Hello Project!');"
                    className="font-mono text-sm"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Spinner className="mr-2"/> : <PlusCircle size={18} className="mr-2"/>} Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {feedback && <AlertComponent type={feedback.type} title={feedback.type.toUpperCase()} message={feedback.message} onClose={() => setFeedback(null)} className="mb-4"/>}

      {projects.length === 0 && !isPending && (
        <Card className="text-center p-10">
          <CardHeader>
             <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Projects Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Click "Create New Project" to get started.</CardDescription>
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="truncate" title={project.name}>{project.name}</CardTitle>
                    <CardDescription>
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 h-12 overflow-hidden">
                      {project.code ? (project.code.substring(0, 100) + (project.code.length > 100 ? '...' : '')) : "No code yet..."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleOpenProject(project)} variant="secondary" className="w-full sm:flex-1" title="Open project in reviewer">
                      <FolderOpen size={16} className="mr-1.5" /> Open
                    </Button>
                    <div className="flex w-full sm:w-auto sm:flex-1 gap-2">
                       <Button onClick={() => openRenameModal(project)} variant="outline" className="flex-1" title="Rename project">
                        <Edit size={16} />
                      </Button>
                      <Button onClick={() => handleDeleteProject(project.id, project.name)} variant="destructive" className="flex-1" disabled={isPending} title="Delete project">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>Enter a new name for the project "{editingProject?.name}".</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameProject} className="space-y-4">
            <div>
              <Label htmlFor="renameProjectNameInput">New Project Name</Label>
              <Input
                id="renameProjectNameInput"
                name="name" 
                value={renameProjectNameInput}
                onChange={(e) => setRenameProjectNameInput(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="mr-2"/> : <Edit size={18} className="mr-2"/>} Save Name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProjectsClientPage;

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add button card dialog input label textarea
// AlertComponent from components/ui/CustomAlert.tsx
// Spinner from components/ui/Spinner.tsx