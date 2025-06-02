"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Code, Menu, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Cross2Icon } from "@radix-ui/react-icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface NavigationProps {
  initialUser?: SupabaseUser | null;
  profilePictureUrl?: string | null;
  username?: string | null;
}

export const Navigation = ({
  initialUser,
  profilePictureUrl,
  username,
}: NavigationProps = {}) => {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/reviewer`,
      },
    });
  };

  // Reset image error when profilePictureUrl changes
  useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl]);

  const renderProfileImage = (className: string) => {
    if (!profilePictureUrl || imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center`}>
          <User className="w-5 h-5 text-white" />
        </div>
      );
    }

    return (
      <Image
        src={profilePictureUrl}
        alt="Profile"
        width={32}
        height={32}
        className={className}
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    );
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              CodeReviewer AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              Contact
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  Welcome, {username || user.email}
                </span>
                {renderProfileImage("w-8 h-8 rounded-full border border-violet-500/50")}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400 transition-all"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleSignIn}
                  variant="outline"
                  className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400 transition-all"
                >
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-violet-500/25">
                  Try Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <Cross2Icon className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800/50">
            <div className="flex flex-col gap-4">
              <Link
                href="/#features"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                Contact
              </Link>

              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {renderProfileImage("w-8 h-8 rounded-full border border-violet-500/50")}
                    <span className="text-gray-300">
                      Welcome, {username || user.email}
                    </span>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400 transition-all w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSignIn}
                    variant="outline"
                    className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400 transition-all w-full"
                  >
                    Sign In
                  </Button>
                  <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-violet-500/25 w-full">
                    Try Free
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
