"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Globe, GitBranch, Shield, Users, MessageSquare } from "lucide-react"

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Code Feedback",
      description: "Get instant AI-powered suggestions as you code, catching issues before they become problems.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-language Support",
      description: "Support for 20+ programming languages including JavaScript, Python, Go, Rust, and more.",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "GitHub/GitLab/Bitbucket Integrations",
      description: "Seamlessly integrate with your existing workflow and version control systems.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security-First Analysis",
      description: "Advanced security vulnerability detection with OWASP compliance checking.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Share insights, annotations, and code reviews across your entire development team.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Smart Auto-Suggestions",
      description: "AI-generated code improvements and refactoring suggestions tailored to your codebase.",
    },
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to maintain high code quality and accelerate your development workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]"
            >
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
