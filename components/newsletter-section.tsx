"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-violet-900/30 to-cyan-900/30 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get the latest updates on new features and AI improvements
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-violet-500 text-lg py-3"
              required
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-lg px-8 py-3 shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
