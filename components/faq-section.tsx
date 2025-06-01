"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "How accurate is the AI code review?",
      answer:
        "Our AI achieves 95%+ accuracy in bug detection and has been trained on millions of code repositories. It continuously learns from developer feedback to improve its suggestions.",
    },
    {
      question: "Which programming languages are supported?",
      answer:
        "We support 20+ languages including JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, and more. New languages are added regularly based on user demand.",
    },
    {
      question: "How does the integration with GitHub work?",
      answer:
        "Simply install our GitHub app and we'll automatically review pull requests, add comments, and provide suggestions. No code changes required on your end.",
    },
    {
      question: "Is my code data secure?",
      answer:
        "Absolutely. We use enterprise-grade encryption, never store your code permanently, and are SOC 2 Type II compliant. Your code privacy is our top priority.",
    },
    {
      question: "Can I customize the review rules?",
      answer:
        "Yes! Pro and Team plans allow you to create custom rules, disable specific checks, and configure the AI to match your team's coding standards.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need to know about CodeReviewer AI
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-6 hover:border-violet-500/50 transition-all"
            >
              <AccordionTrigger className="text-white hover:text-violet-400 text-lg py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 text-base leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
