"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CheckCircle } from "lucide-react"

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false)

  const pricingPlans = [
    {
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Perfect for individual developers",
      features: ["Up to 5 repositories", "Basic code analysis", "Community support", "GitHub integration"],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: "For professional developers",
      features: [
        "Unlimited repositories",
        "Advanced AI analysis",
        "Priority support",
        "All integrations",
        "Custom rules",
        "Team annotations",
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Team",
      monthlyPrice: 99,
      yearlyPrice: 990,
      description: "For development teams",
      features: [
        "Everything in Pro",
        "Team dashboard",
        "Advanced analytics",
        "SSO integration",
        "Custom workflows",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Simple Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">Choose the plan that fits your team size and needs</p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${!isYearly ? "text-white" : "text-gray-400"}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-cyan-500"
            />
            <span className={`text-lg ${isYearly ? "text-white" : "text-gray-400"}`}>
              Yearly
              <Badge className="ml-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative bg-gray-900/30 backdrop-blur-xl border transition-all duration-300 ${
                plan.popular
                  ? "border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.2)] scale-105"
                  : "border-gray-700/50 hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white animate-pulse">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">
                    ${isYearly ? Math.floor(plan.yearlyPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-400 text-lg">/month</span>
                  {isYearly && plan.yearlyPrice > 0 && (
                    <div className="text-sm text-gray-400 mt-1">Billed annually (${plan.yearlyPrice}/year)</div>
                  )}
                </div>
                <CardDescription className="text-gray-300 text-lg">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full text-lg py-3 ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg hover:shadow-violet-500/25"
                      : "bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-violet-500"
                  } transition-all`}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
