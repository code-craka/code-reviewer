"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Menu, 
  User, 
  FolderOpen, 
  BarChart3, 
  Settings,
  LogOut,
  Sun,
  Moon
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Cross2Icon } from "@radix-ui/react-icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardNavigationProps {
  initialUser?: SupabaseUser | null;
  profilePictureUrl?: string | null;
  username?: string | null;
  currentPage?: 'dashboard' | 'reviewer' | 'projects' | 'analytics';
}

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", icon: Sun };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", icon: Sun };
  } else if (hour >= 17 && hour < 22) {
    return { greeting: "Good evening", icon: Moon };
  } else {
    return { greeting: "Good night", icon: Moon };
  }
};

export const DashboardNavigation = ({
  initialUser,
  profilePictureUrl,
  username,
  currentPage = 'dashboard',
}: DashboardNavigationProps = {}) => {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [greeting, setGreeting] = useState(() => ({ greeting: "Hello", icon: Sun }));

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Set initial greeting on client mount
    setGreeting(getTimeBasedGreeting());

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(greetingInterval);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, key: 'dashboard' },
    { name: 'Code Review', href: '/reviewer', icon: Code, key: 'reviewer' },
    { name: 'Projects', href: '/dashboard', icon: FolderOpen, key: 'projects' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, key: 'analytics' },
  ];

  const { greeting: greetingText, icon: GreetingIcon } = greeting;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Code className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">CodeReviewer AI</span>
        </Link>

        {/* Center - Greeting and User Info */}
        {user && (
          <div className="hidden md:flex items-center space-x-3 text-center">
            <GreetingIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{greetingText},</p>
              <p className="font-medium">{username || user.email}</p>
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={!imageError ? profilePictureUrl || undefined : undefined} 
                      alt={username || "User"} 
                      onError={() => setImageError(true)}
                    />
                    <AvatarFallback>
                      {username ? username[0].toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <Cross2Icon className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t">
            {/* Mobile Greeting */}
            {user && (
              <div className="flex items-center space-x-3 px-3 py-2 border-b mb-3">
                <GreetingIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{greetingText},</p>
                  <p className="font-medium">{username || user.email}</p>
                </div>
              </div>
            )}
            
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
