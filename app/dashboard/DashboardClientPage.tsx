"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Code,
  FolderOpen,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { Project } from "@/types/index";
import ProjectsClientPage from "../projects/ProjectsClientPage";
import ReviewerClientPage from "../reviewer/ReviewerClientPage";

interface DashboardClientPageProps {
  initialProjects: Project[];
  dashboardStats: {
    totalProjects: number;
    totalReviews: number;
    issuesFound: number;
    issuesFixed: number;
  };
}

export default function DashboardClientPage({
  initialProjects,
  dashboardStats,
}: DashboardClientPageProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Recent activity mock data
  const recentActivity = [
    {
      id: 1,
      type: "review",
      message: "Code review completed for authentication module",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      id: 2,
      type: "project",
      message: "New project 'E-commerce API' created",
      time: "4 hours ago",
      icon: FolderOpen,
      color: "text-blue-500",
    },
    {
      id: 3,
      type: "issue",
      message: "3 security issues found in payment service",
      time: "6 hours ago",
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      id: 4,
      type: "review",
      message: "Performance review for user dashboard",
      time: "1 day ago",
      icon: TrendingUp,
      color: "text-yellow-500",
    },
  ];

  const quickStats = [
    {
      title: "Total Projects",
      value: dashboardStats.totalProjects,
      icon: FolderOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Code Reviews",
      value: dashboardStats.totalReviews,
      icon: Code,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Issues Found",
      value: dashboardStats.issuesFound,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      title: "Issues Fixed",
      value: dashboardStats.issuesFixed,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviewer">Code Review</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {initialProjects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {initialProjects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No projects yet</p>
                      <Button
                        onClick={() => setActiveTab("projects")}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Create your first project
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`rounded-full p-1 ${activity.color}`}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button
                    onClick={() => setActiveTab("reviewer")}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <Code className="h-6 w-6" />
                    Start Code Review
                  </Button>
                  <Button
                    onClick={() => setActiveTab("projects")}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <PlusCircle className="h-6 w-6" />
                    Create Project
                  </Button>
                  <Button
                    onClick={() => setActiveTab("analytics")}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="h-6 w-6" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviewer" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">AI Code Reviewer</h2>
            <p className="text-muted-foreground">
              Get instant feedback on your code from leading AI models
            </p>
          </div>
          <ReviewerClientPage initialProjects={initialProjects} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Project Management</h2>
            <p className="text-muted-foreground">
              Organize and manage your development projects
            </p>
          </div>
          <ProjectsClientPage initialProjects={initialProjects} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Analytics & Insights</h2>
            <p className="text-muted-foreground">
              Track your code quality and review trends
            </p>
          </div>
          
          {/* Analytics placeholder */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Code Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Quality Score</span>
                    <span className="font-bold">8.5/10</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">23</div>
                      <div className="text-xs text-muted-foreground">Issues Fixed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">7</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">156</div>
                      <div className="text-xs text-muted-foreground">Total Reviews</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>No Issues</span>
                    </div>
                    <span>45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Minor Issues</span>
                    </div>
                    <span>35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Major Issues</span>
                    </div>
                    <span>20%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
