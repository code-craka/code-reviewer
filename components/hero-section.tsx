"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { CodeCarousel } from "./code-carousel"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowRightIcon } from "@radix-ui/react-icons"

export const HeroSection = () => {
  const handleTryFree = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } else {
      // Redirect to dashboard or app
      window.location.href = "/dashboard"
    }
  }

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
                  Code Smarter.
                </span>
                <br />
                <span className="text-white">Review Faster.</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                AI that auto-detects bugs, security issues, and performance bottlenecks in your code. Ship better
                software with confidence and reduce review time by 60%.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleTryFree}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-lg px-8 py-4 shadow-lg hover:shadow-violet-500/25 transition-all transform hover:scale-105"
              >
                Try it Free
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-cyan-400 hover:text-cyan-400 text-lg px-8 py-4 transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Live Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <CodeCarousel />
          </div>
        </div>
      </div>
    </section>
  )
}
