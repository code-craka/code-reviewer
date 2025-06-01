import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Globe } from "lucide-react";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";

export default function CompanyDetailsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AnimatedBackground />
      <Navigation />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Company Details
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Information about TechSci, Inc. and CodeReviewer AI
            </p>
          </div>

          <div className="space-y-8">
            <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Building className="w-6 h-6 text-violet-400" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-violet-400 mb-2">
                      Company Name
                    </h3>
                    <p className="text-gray-300">TechSci, Inc.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                      Product
                    </h3>
                    <p className="text-gray-300">CodeReviewer AI</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-violet-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Headquarters Address
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      651 N Broad St, Suite 201
                      <br />
                      Middletown, Delaware 19709
                      <br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <EnvelopeClosedIcon className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Contact Email
                    </h3>
                    <a
                      href="mailto:hello@techsci.io"
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      hello@techsci.io
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Globe className="w-6 h-6 text-violet-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Business Structure
                    </h3>
                    <p className="text-gray-300">
                      CodeReviewer AI is a sub-business unit of TechSci, Inc.,
                      operating as a specialized division focused on AI-powered
                      developer tools and code analysis solutions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  About TechSci, Inc.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  TechSci, Inc. is a Delaware-incorporated technology company
                  specializing in the development of innovative software
                  solutions for developers and engineering teams. Founded with
                  the mission to enhance developer productivity through
                  cutting-edge technology, TechSci focuses on creating tools
                  that streamline workflows and improve code quality.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  Our flagship product, CodeReviewer AI, represents our
                  commitment to leveraging artificial intelligence to solve
                  real-world problems in software development. By combining
                  advanced machine learning algorithms with deep understanding
                  of developer needs, we&apos;re building the next generation of
                  development tools.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  TechSci is committed to maintaining the highest standards of
                  data privacy, security, and ethical AI practices. We believe
                  in transparent business operations and building trust with our
                  developer community through reliable, secure, and innovative
                  products.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-violet-900/30 to-cyan-900/30 backdrop-blur-xl border border-violet-500/30">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Legal & Compliance
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-violet-400 mb-2">
                      Incorporation
                    </h4>
                    <p>Delaware, United States</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Business Type
                    </h4>
                    <p>Technology Corporation</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-violet-400 mb-2">
                      Industry
                    </h4>
                    <p>Software Development Tools</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-2">
                      Founded
                    </h4>
                    <p>2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
