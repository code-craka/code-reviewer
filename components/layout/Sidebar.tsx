"use client";

import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileText,
  FolderOpen,
  MessageSquare,
  BarChart3,
  Users,
  Key,
  Bell,
  Settings,
  Crown,
  HelpCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: User;
  profile: Profile;
  open: boolean;
  onCloseAction: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "AI Reviewer",
    href: "/reviewer",
    icon: FileText,
  },
  {
    label: "Projects",
    href: "/dashboard",
    icon: FolderOpen,
  },
  {
    label: "AI Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Users,
  },
  {
    label: "API Keys",
    href: "/api-keys",
    icon: Key,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: Crown,
    adminOnly: true,
    badge: "Admin"
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

export function Sidebar({ user, profile, open, onCloseAction }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'admin';

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-card lg:border-r">
        <SidebarContent 
          user={user}
          profile={profile}
          navItems={filteredNavItems}
          pathname={pathname}
          isAdmin={isAdmin}
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-card border-r transform transition-transform lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="sm" onClick={onCloseAction}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent 
          user={user}
          profile={profile}
          navItems={filteredNavItems}
          pathname={pathname}
          isAdmin={isAdmin}
          onItemClick={onCloseAction}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  user: User;
  profile: Profile;
  navItems: NavItem[];
  pathname: string;
  isAdmin: boolean;
  onItemClick?: () => void;
}

function SidebarContent({ 
  user, 
  profile, 
  navItems, 
  pathname, 
  isAdmin, 
  onItemClick 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Home className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">AI Reviewer</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.profilePictureUrl || ""} />
            <AvatarFallback>
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          {isAdmin && (
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="outline" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>AI Code Reviewer v2.0</p>
          <p> 2024 Your Company</p>
        </div>
      </div>
    </div>
  );
}
