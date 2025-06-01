"use client";

import { AnimatedBackground } from "@/components/animated-background";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { IntegrationsSection } from "@/components/integrations-section";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";
import { NewsletterSection } from "@/components/newsletter-section";
import { Footer } from "@/components/footer";

// CodeCarousel component removed as it's not being used in the application

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      <Navigation />
      <main>
        <HeroSection />
        {/* Add the CodeCarousel component to the HeroSection instead */}
        {/* <div className="container mx-auto px-4 py-8">
          <CodeCarousel />
        </div> */}
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <IntegrationsSection />
        <PricingSection />
        <FAQSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
