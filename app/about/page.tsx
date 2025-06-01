import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AnimatedBackground } from "@/components/animated-background"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AnimatedBackground />
      <Navigation />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                About CodeReviewer AI
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Revolutionizing code review with artificial intelligence
            </p>
          </div>

          <div className="space-y-12">
            <section className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                At CodeReviewer AI, we believe that every developer deserves access to world-class code review
                capabilities. Our mission is to democratize code quality by providing AI-powered insights that help
                developers write better, more secure, and more performant code.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                We're building the future of software development, where AI and human expertise work together to create
                exceptional software that powers the world's most important applications.
              </p>
            </section>

            <section className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                CodeReviewer AI was born from the frustration of spending countless hours on manual code reviews. Our
                founding team, comprised of senior engineers from top tech companies, experienced firsthand the
                challenges of maintaining code quality at scale.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                We realized that while human expertise is irreplaceable, AI could augment our capabilities and catch
                issues that even experienced developers might miss. This insight led to the creation of CodeReviewer AI,
                a tool that combines the best of artificial intelligence with human intuition.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Today, we're proud to serve thousands of developers and hundreds of companies worldwide, helping them
                ship better code faster and with more confidence.
              </p>
            </section>

            <section className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-violet-400 mb-3">Developer-First</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We build tools by developers, for developers. Every feature is designed with the developer
                    experience in mind.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cyan-400 mb-3">Privacy & Security</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Your code is your intellectual property. We never store your code and use enterprise-grade security
                    measures.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-violet-400 mb-3">Continuous Innovation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We're constantly pushing the boundaries of what's possible with AI-powered code analysis.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cyan-400 mb-3">Community Driven</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our roadmap is shaped by feedback from our community of developers and engineering teams.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Company Information</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                CodeReviewer AI is a product of <strong className="text-white">TechSci, Inc.</strong>, a technology
                company focused on building developer tools that enhance productivity and code quality.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                For more information about our parent company, please visit our{" "}
                <a href="/company-details" className="text-violet-400 hover:text-violet-300 transition-colors">
                  company details page
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
