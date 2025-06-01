"use client";

import type React from "react";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, MessageSquare } from "lucide-react";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted:", formData);
    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AnimatedBackground />
      <Navigation />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Contact Us
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Get in touch with our team. We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-violet-400" />
                  Send us a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-violet-500"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-violet-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-violet-500"
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-lg py-3 shadow-lg hover:shadow-violet-500/25 transition-all"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-violet-400">
                      <EnvelopeClosedIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Email Us
                      </h3>
                      <p className="text-gray-300 mb-2">
                        Get in touch via email
                      </p>
                      <a
                        href="mailto:hello@techsci.io"
                        className="text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        hello@techsci.io
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Visit Us
                      </h3>
                      <p className="text-gray-300 mb-2">Our headquarters</p>
                      <p className="text-gray-300">
                        651 N Broad St, Suite 201
                        <br />
                        Middletown, Delaware 19709
                        <br />
                        United States
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-violet-400">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Support
                      </h3>
                      <p className="text-gray-300 mb-2">
                        Need help? We&apos;re here for you
                      </p>
                      <p className="text-gray-300">
                        24/7 support available
                        <br />
                        Response time: &lt; 2 hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-r from-violet-900/30 to-cyan-900/30 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Quick Response
                </h3>
                <p className="text-gray-300 mb-4">
                  We typically respond to all inquiries within 2 hours during
                  business hours (9 AM - 6 PM EST, Monday - Friday).
                </p>
                <p className="text-gray-300">
                  For urgent technical issues, please include &quot;URGENT&quot; in your
                  subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
