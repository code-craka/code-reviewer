"use client"

import { PlaceholderImage } from "@/components/ui/placeholder-image"

export const IntegrationsSection = () => {
  const integrations = [
    { name: "GitHub", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]" },
    { name: "VS Code", glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]" },
    { name: "JetBrains", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]" },
    { name: "GitLab", glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]" },
    { name: "Bitbucket", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]" },
    { name: "Slack", glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]" },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Seamless Integrations
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-12">Connect with the tools you already use and love</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className={`bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-violet-500/50 transition-all duration-300 group cursor-pointer ${integration.glow}`}
            >
              <PlaceholderImage
                text={integration.name}
                width={120}
                height={60}
                textColor="#A855F7"
                backgroundColor="#1f2937"
                className="h-12 mx-auto filter grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
