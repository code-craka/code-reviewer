"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Bot,
  MoreHorizontal,
  Trash2,
  Download,
  Copy,
  Plus,
  Code,
  FileText,
  HelpCircle,
  Sparkles,
  Settings,
} from "lucide-react";
import { Profile } from "@/types";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "code" | "analysis";
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatInterfaceProps {
  profile: Profile;
}

export function ChatInterface({ profile }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    {
      id: "1",
      title: "Code Review Help",
      messages: [
        {
          id: "1",
          content: "Hello! I'm your AI coding assistant. I can help you with code reviews, debugging, best practices, and answer any programming questions you have. How can I assist you today?",
          role: "assistant",
          timestamp: new Date("2024-01-01T12:00:00Z"),
        },
      ],
      createdAt: new Date("2024-01-01T11:55:00Z"),
      updatedAt: new Date("2024-01-01T12:00:00Z"),
    },
  ]);

  const [currentConversationId, setCurrentConversationId] = useState<string>("1");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    // Add user message
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
        : conv
    ));

    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputValue),
        role: "assistant",
        timestamp: new Date(),
        type: inputValue.toLowerCase().includes("code") ? "code" : "text",
      };

      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [...conv.messages, aiMessage], updatedAt: new Date() }
          : conv
      ));

      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = {
      code: `Here's a code analysis for you:

\`\`\`typescript
// Example optimized code
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
\`\`\`

This implementation provides better type safety and performance. Would you like me to explain any specific part?`,
      review: `I'll help you review your code! Here are some best practices to consider:

**Code Quality Checklist:**
• Proper error handling and validation
• Clear variable and function naming
• Consistent code formatting
• Avoid code duplication (DRY principle)
• Write meaningful comments for complex logic
• Consider performance implications
• Ensure security best practices

Would you like me to review a specific piece of code?`,
      default: `I understand you're asking about development practices. Based on your question, I'd recommend:

1. **Follow established patterns** - Use proven architectural patterns
2. **Write tests** - Ensure your code is reliable and maintainable  
3. **Document your code** - Help future developers (including yourself)
4. **Performance optimization** - Profile and optimize bottlenecks
5. **Security considerations** - Always validate inputs and sanitize data

Is there a specific area you'd like me to dive deeper into?`,
    };

    const input = userInput.toLowerCase();
    if (input.includes("code") || input.includes("function")) {
      return responses.code;
    } else if (input.includes("review") || input.includes("analyze")) {
      return responses.review;
    } else {
      return responses.default;
    }
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          content: "Hello! I'm ready to help you with your coding questions. What would you like to work on?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId);
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id);
      } else {
        createNewConversation();
      }
    }
  };

  const quickPrompts = [
    { id: "code-review", icon: Code, text: "Review my React component", type: "code" },
    { id: "best-practices", icon: FileText, text: "Explain best practices", type: "advice" },
    { id: "debug-help", icon: HelpCircle, text: "Debug this error", type: "debug" },
    { id: "optimize", icon: Sparkles, text: "Optimize performance", type: "optimization" },
  ];

  return (
    <div className="h-full flex">
      {/* Sidebar - Conversation History */}
      <div className="w-80 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Conversations</h2>
            <Button onClick={createNewConversation} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setCurrentConversationId(conversation.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conversation.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {conversation.messages.length} messages
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Export Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteConversation(conversation.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">AI Coding Assistant</h2>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                GPT-4 Enhanced
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {currentConversation?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex space-x-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm">{message.content}</pre>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.role === "assistant" && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.profilePictureUrl || ""} />
                    <AvatarFallback>
                      {profile.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex space-x-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-lg p-4 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        {currentConversation?.messages.length === 1 && (
          <div className="p-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground mb-3">Quick prompts to get started:</p>
            <div className="grid grid-cols-2 gap-2 max-w-2xl">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3"
                  onClick={() => setInputValue(prompt.text)}
                >
                  <prompt.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-left">{prompt.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex space-x-2 max-w-4xl mx-auto">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about coding, debugging, or best practices..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!inputValue.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 max-w-4xl mx-auto">
            AI responses are generated for demonstration. Always verify suggestions in your specific context.
          </p>
        </div>
      </div>
    </div>
  );
}
