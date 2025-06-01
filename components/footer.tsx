"use client"

import Link from "next/link"
import { Code, Twitter, Linkedin, Github } from "lucide-react"
import { EnvelopeClosedIcon } from "@radix-ui/react-icons"

export const Footer = () => {
  return (
    <footer className="bg-gray-950/80 backdrop-blur-xl border-t border-gray-800/50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                CodeReviewer AI
              </span>
            </Link>
            <p className="text-gray-400 mb-6">AI-powered code review that helps developers ship better code faster.</p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center hover:bg-violet-500/20 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5 text-gray-400 hover:text-violet-400" />
              </div>
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center hover:bg-violet-500/20 transition-colors cursor-pointer">
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-violet-400" />
              </div>
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center hover:bg-violet-500/20 transition-colors cursor-pointer">
                <Github className="w-5 h-5 text-gray-400 hover:text-violet-400" />
              </div>
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center hover:bg-violet-500/20 transition-colors cursor-pointer">
                <EnvelopeClosedIcon className="w-5 h-5 text-gray-400 hover:text-violet-400" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Product</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/#features" className="hover:text-violet-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-violet-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-violet-400 transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-violet-400 transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Company</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-violet-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-violet-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-violet-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-violet-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/company-details" className="hover:text-violet-400 transition-colors">
                  Company Details
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Legal</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-violet-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-violet-400 transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="hover:text-violet-400 transition-colors">
                  GDPR
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-violet-400 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 TechSci, Inc. All rights reserved. CodeReviewer AI is a product of TechSci, Inc.</p>
        </div>
      </div>
    </footer>
  )
}
