import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrGetProfile } from "@/lib/auth/profile-service";

export default async function ApiKeysPage() {
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

  // Mock API keys data - in production, fetch from database
  const apiKeys = [
    {
      id: "1",
      name: "OpenAI GPT-4",
      provider: "openai",
      keyPreview: "sk-proj...Xy9Z",
      status: "active" as const,
      lastUsed: "2024-06-01T10:30:00Z",
      usageLimit: 10000,
      usageCount: 2340,
      createdAt: "2024-05-01T09:00:00Z",
    },
    {
      id: "2", 
      name: "Google Gemini Pro",
      provider: "google",
      keyPreview: "AIza...mN7q",
      status: "active" as const,
      lastUsed: "2024-06-01T14:22:00Z",
      usageLimit: 5000,
      usageCount: 1876,
      createdAt: "2024-05-15T16:45:00Z",
    },
    {
      id: "3",
      name: "Anthropic Claude",
      provider: "anthropic", 
      keyPreview: "sk-ant...Kp2L",
      status: "inactive" as const,
      lastUsed: "2024-05-28T08:15:00Z",
      usageLimit: 8000,
      usageCount: 156,
      createdAt: "2024-04-20T11:20:00Z",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI provider API keys for Bring Your Own Key (BYOK) usage.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New API Key</DialogTitle>
                <DialogDescription>
                  Add a new AI provider API key to enable BYOK functionality.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., OpenAI Production Key"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apikey">API Key</Label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="Enter your API key"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Usage Limit (optional)</Label>
                  <Input
                    id="limit"
                    type="number"
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a monthly usage limit to prevent overuse
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add API Key</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your API Keys
            </CardTitle>
            <CardDescription>
              Manage and monitor your AI provider API keys. Keys are encrypted and stored securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{apiKey.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {apiKey.keyPreview}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {apiKey.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(apiKey.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{apiKey.usageCount.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            / {apiKey.usageLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              getUsagePercentage(apiKey.usageCount, apiKey.usageLimit) > 80
                                ? "bg-red-500"
                                : getUsagePercentage(apiKey.usageCount, apiKey.usageLimit) > 60
                                ? "bg-yellow-500" 
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${getUsagePercentage(apiKey.usageCount, apiKey.usageLimit)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getUsagePercentage(apiKey.usageCount, apiKey.usageLimit)}% used
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(apiKey.lastUsed)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(apiKey.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Key ID
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Regenerate Key
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Usage Summary</CardTitle>
              <CardDescription>
                AI API usage across all providers this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Requests</span>
                  <span className="text-2xl font-bold">4,372</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="text-2xl font-bold">$28.45</span>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  <p>↗️ 23% increase from last month</p>
                  <p>Most used: OpenAI GPT-4 (53.6%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security & Best Practices</CardTitle>
              <CardDescription>
                Keep your API keys secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Encrypted Storage</p>
                    <p className="text-muted-foreground">All keys are encrypted at rest</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Usage Monitoring</p>
                    <p className="text-muted-foreground">Track and limit API usage</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Rotate Regularly</p>
                    <p className="text-muted-foreground">Update keys every 90 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
