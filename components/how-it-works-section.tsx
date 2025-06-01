"use client"

import { GitBranch, Zap, CheckCircle } from "lucide-react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: <GitBranch className="w-12 h-12" />,
      title: "Connect Your Repository",
      description: "Link your GitHub, GitLab, or Bitbucket repository in seconds",
      number: "01",
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "AI Reviews Your Code",
      description: "Our AI analyzes every line for bugs, performance, and security issues",
      number: "02",
    },
    {
      icon: <CheckCircle className="w-12 h-12" />,
      title: "Apply Suggestions",
      description: "Receive actionable feedback and improve your code quality instantly",
      number: "03",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-300">Get started in minutes with our simple 3-step process</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center text-violet-400 mx-auto group-hover:scale-110 transition-transform border border-violet-500/30">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {step.number}
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRightIcon className="w-8 h-8 text-violet-400/50 mx-auto mt-8 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
