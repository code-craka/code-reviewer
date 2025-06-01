"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export const CodeCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const codeExamples = [
    {
      title: "JavaScript Security Issue",
      code: `function validateUser(input) {
  return eval(input.userCode);
}`,
      aiComment:
        "🚨 Security vulnerability: eval() can execute arbitrary code. Use JSON.parse() instead.",
      type: "security",
    },
    {
      title: "Python Performance Issue",
      code: `def process_data(items):
  result = []
  for item in items:
    result.append(expensive_operation(item))
  return result`,
      aiComment:
        "⚡ Performance: Use list comprehension or map() for better performance.",
      type: "performance",
    },
    {
      title: "TypeScript Bug Detection",
      code: `interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John",
  // missing age property
}`,
      aiComment: "🐛 Type error: Property 'age' is missing in type assignment.",
      type: "bug",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % codeExamples.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [codeExamples.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % codeExamples.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + codeExamples.length) % codeExamples.length,
    );

  return (
    <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-400 ml-2 font-mono text-sm">
            {codeExamples[currentSlide].title}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={prevSlide} className="p-1 hover:bg-gray-700 rounded">
            <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={nextSlide} className="p-1 hover:bg-gray-700 rounded">
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="font-mono text-sm mb-4">
        <pre className="text-gray-300 whitespace-pre-wrap">
          {codeExamples[currentSlide].code}
        </pre>
      </div>

      <div className="bg-gradient-to-r from-violet-900/30 to-cyan-900/30 border border-violet-500/30 rounded-lg p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 font-medium">AI Reviewer</span>
          <Badge
            variant="secondary"
            className={`text-xs ${
              codeExamples[currentSlide].type === "security"
                ? "bg-red-900/50 text-red-300"
                : codeExamples[currentSlide].type === "performance"
                  ? "bg-yellow-900/50 text-yellow-300"
                  : "bg-blue-900/50 text-blue-300"
            }`}
          >
            {codeExamples[currentSlide].type}
          </Badge>
        </div>
        <p className="text-gray-300 text-sm">
          {codeExamples[currentSlide].aiComment}
        </p>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {codeExamples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-cyan-400" : "bg-gray-600"}`}
          />
        ))}
      </div>
    </div>
  );
};
