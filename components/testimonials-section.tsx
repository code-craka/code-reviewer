"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { PlaceholderImage } from "@/components/ui/placeholder-image"

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Developer",
      company: "Stripe",
      content:
        "CodeReviewer AI cut our review time by 60% and caught 3x more bugs before production. It's like having a senior developer on every commit.",
      rating: 5,
      avatar: null, // Will use PlaceholderImage instead
      initials: "SC",
    },
    {
      name: "Marcus Rodriguez",
      role: "Engineering Lead",
      company: "Shopify",
      content:
        "The AI suggestions are incredibly accurate and contextual. Our team's code quality has improved dramatically since we started using it.",
      rating: 5,
      avatar: null, // Will use PlaceholderImage instead
      initials: "MR",
    },
    {
      name: "Emily Watson",
      role: "Full Stack Developer",
      company: "Airbnb",
      content:
        "Finally, a tool that understands our codebase context. The security vulnerability detection has saved us from multiple potential issues.",
      rating: 5,
      avatar: null, // Will use PlaceholderImage instead
      initials: "EW",
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Loved by Developers
            </span>
          </h2>
          <p className="text-xl text-gray-300">See what developers are saying about CodeReviewer AI</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]"
            >
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full border-2 border-violet-500/30"
                    />
                  ) : (
                    <PlaceholderImage
                      text={testimonial.initials}
                      width={60}
                      height={60}
                      textColor="white"
                      backgroundColor="#8b5cf6"
                      className="w-12 h-12 rounded-full border-2 border-violet-500/30"
                    />
                  )}
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
