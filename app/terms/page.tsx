"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navigation />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <h1 className="text-4xl font-bold text-primary mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-invert max-w-none lg:prose-lg text-muted-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using AICodeReview (&quot;Service&quot;), you accept and
            agree to be bound by the terms and provision of this agreement. In
            addition, when using this Service, you shall be subject to any
            posted guidelines or rules applicable to such services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            AICodeReview provides users with an AI-powered tool for code
            analysis and review. The Service is provided &quot;AS IS&quot; and we reserve
            the right to modify or discontinue, temporarily or permanently, the
            Service with or without notice.
          </p>

          <h2>3. User Responsibilities</h2>
          <p>
            You are responsible for all code, data, and information you submit
            to the Service. You agree not to use the Service for any unlawful
            purpose or to violate any laws in your jurisdiction.
          </p>
          <p>
            You acknowledge that AI-generated content may sometimes be
            inaccurate or incomplete. You are responsible for critically
            evaluating all suggestions provided by the Service before
            implementing them.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by
            users), features, and functionality are and will remain the
            exclusive property of AICodeReview and its licensors. Your code
            remains your intellectual property. We do not claim ownership of the
            code you submit for review.
          </p>

          <h2>5. Subscription and Payment (If Applicable)</h2>
          <p>
            Details about subscription plans, fees, payment terms, and renewal
            policies will be provided on our pricing page and during the signup
            process for paid services.
          </p>

          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend your access to our Service immediately,
            without prior notice or liability, for any reason whatsoever,
            including without limitation if you breach the Terms.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided without warranties of any kind, whether
            express or implied, including, but not limited to, implied
            warranties of merchantability, fitness for a particular purpose,
            non-infringement, or course of performance.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            In no event shall AICodeReview, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from your access to or use of
            or inability to access or use the Service.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of [Your Jurisdiction], without regard to its conflict of law
            provisions.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. We will provide notice of any changes by
            posting the new Terms on this page.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at
            support@aicodereview.example.com.
          </p>

          <p className="mt-8">
            <Link href="/">Back to Home</Link>
          </p>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}
