import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Code,
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
  Download,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetProfile } from "@/lib/auth/profile-service";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const profileResult = await createOrGetProfile(user);
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const profile = profileResult.data;

  // Mock analytics data - in production, fetch from database
  const analytics = {
    overview: {
      totalReviews: 247,
      totalProjects: 18,
      issuesFound: 1284,
      issuesResolved: 1089,
      codeQualityScore: 87,
      monthlyGrowth: {
        reviews: 23,
        projects: 12,
        issues: -15, // negative means fewer issues (good)
      },
    },
    reviewStats: {
      byModel: [
        { model: "Gemini Pro", count: 127, percentage: 51.4 },
        { model: "GPT-4", count: 89, percentage: 36.0 },
        { model: "Claude 3", count: 31, percentage: 12.6 },
      ],
      bySeverity: [
        { severity: "Error", count: 89, color: "bg-red-500" },
        { severity: "Warning", count: 145, color: "bg-yellow-500" },
        { severity: "Info", count: 342, color: "bg-blue-500" },
      ],
      byLanguage: [
        { language: "TypeScript", count: 98, percentage: 39.7 },
        { language: "JavaScript", count: 67, percentage: 27.1 },
        { language: "Python", count: 45, percentage: 18.2 },
        { language: "Java", count: 23, percentage: 9.3 },
        { language: "Other", count: 14, percentage: 5.7 },
      ],
    },
    timeData: {
      last30Days: [
        { date: "2024-05-02", reviews: 8, issues: 23 },
        { date: "2024-05-03", reviews: 12, issues: 31 },
        { date: "2024-05-04", reviews: 6, issues: 15 },
        { date: "2024-05-05", reviews: 15, issues: 42 },
        { date: "2024-05-06", reviews: 9, issues: 28 },
        { date: "2024-05-07", reviews: 11, issues: 33 },
        { date: "2024-05-08", reviews: 14, issues: 37 },
      ],
    },
    topIssues: [
      {
        type: "Security Vulnerability",
        count: 23,
        trend: "up",
        severity: "error",
        description: "Potential XSS vulnerabilities detected",
      },
      {
        type: "Performance Issue",
        count: 67,
        trend: "down", 
        severity: "warning",
        description: "Inefficient loops and memory usage",
      },
      {
        type: "Code Style",
        count: 134,
        trend: "stable",
        severity: "info", 
        description: "Formatting and naming conventions",
      },
      {
        type: "Unused Code",
        count: 45,
        trend: "down",
        severity: "warning",
        description: "Dead code and unused imports",
      },
    ],
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <span className="h-4 w-4 text-gray-500">→</span>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: "bg-red-100 text-red-800 dark:bg-red-900/20",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20", 
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20",
    } as const;
    
    return (
      <Badge className={variants[severity as keyof typeof variants] || variants.info}>
        {severity}
      </Badge>
    );
  };

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Insights into your code review activity and quality metrics.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center gap-2">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalReviews}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                +{analytics.overview.monthlyGrowth.reviews}% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.issuesFound}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="inline h-3 w-3 mr-1 text-green-500" />
                {Math.abs(analytics.overview.monthlyGrowth.issues)}% fewer this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((analytics.overview.issuesResolved / analytics.overview.issuesFound) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.issuesResolved} of {analytics.overview.issuesFound} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Code Quality Score</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.overview.codeQualityScore}/100
              </div>
              <Progress value={analytics.overview.codeQualityScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Review Analysis</TabsTrigger>
            <TabsTrigger value="issues">Issue Tracking</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* AI Model Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Model Usage</CardTitle>
                  <CardDescription>
                    Distribution of reviews by AI model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.reviewStats.byModel.map((model) => (
                      <div key={model.model} className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{model.model}</span>
                            <span className="text-muted-foreground">
                              {model.count} ({model.percentage}%)
                            </span>
                          </div>
                          <Progress value={model.percentage} className="h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Programming Languages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Languages Reviewed</CardTitle>
                  <CardDescription>
                    Code review distribution by programming language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.reviewStats.byLanguage.map((lang) => (
                      <div key={lang.language} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{lang.language}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {lang.count} reviews
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {lang.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Issue Severity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Issue Severity</CardTitle>
                  <CardDescription>
                    Breakdown of issues by severity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.reviewStats.bySeverity.map((severity) => (
                      <div key={severity.severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded ${severity.color}`} />
                          <span className="text-sm font-medium">{severity.severity}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {severity.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Review Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Activity</CardTitle>
                  <CardDescription>
                    Recent review frequency and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg per day</span>
                      <span className="text-2xl font-bold">8.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Most active day</span>
                      <span className="text-sm text-muted-foreground">Tuesday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Peak hours</span>
                      <span className="text-sm text-muted-foreground">2-4 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quality Trends</CardTitle>
                  <CardDescription>
                    Code quality improvements over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Error rate</span>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-green-500" />
                        <span className="text-sm text-green-600">-12%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Fix rate</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm text-green-600">+18%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg time to fix</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">2.3 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Issue Types</CardTitle>
                <CardDescription>
                  Most frequently detected issues and their trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topIssues.map((issue, index) => (
                    <div key={issue.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{issue.type}</h4>
                            {getSeverityBadge(issue.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-bold">{issue.count}</div>
                          <div className="text-xs text-muted-foreground">occurrences</div>
                        </div>
                        {getTrendIcon(issue.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                  <CardDescription>
                    System performance and efficiency indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Review Time</span>
                        <span className="font-medium">2.3 seconds</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-medium">98.7%</span>
                      </div>
                      <Progress value={98.7} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Efficiency</span>
                        <span className="font-medium">94.2%</span>
                      </div>
                      <Progress value={94.2} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resource Usage</CardTitle>
                  <CardDescription>
                    API calls and resource consumption
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Calls (Month)</span>
                      <span className="text-lg font-bold">4,372</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Cost</span>
                      <span className="text-lg font-bold">$28.45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Cost/Review</span>
                      <span className="text-lg font-bold">$0.115</span>
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground">
                      <p>↗️ 8% cost reduction vs last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
