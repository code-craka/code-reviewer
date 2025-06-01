"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none lg:prose-lg text-muted-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Introduction</h2>
          <p>
            AICodeReview (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our Service.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We may collect personal information such as:</p>
          <ul>
            <li>
              <strong>Account Information:</strong> Name, email address,
              username, password when you register.
            </li>
            <li>
              <strong>Code Submissions:</strong> Code snippets and related files
              you submit for review.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use the
              Service, IP address, browser type, operating system.
            </li>
            <li>
              <strong>Payment Information (If Applicable):</strong> Billing
              details for subscription services, processed by a third-party
              payment processor.
            </li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain our Service.</li>
            <li>
              Process your code submissions and provide AI-generated reviews.
            </li>
            <li>Improve, personalize, and expand our Service.</li>
            <li>
              Communicate with you, including for customer service and updates.
            </li>
            <li>Process transactions (if applicable).</li>
            <li>Prevent fraudulent activity and ensure security.</li>
          </ul>
          <p>
            <strong>
              Your code submitted for review is used solely for the purpose of
              providing the review service. We do not use your private code to
              train our general AI models unless you explicitly grant us
              permission to do so.
            </strong>
          </p>

          <h2>4. How We Share Your Information</h2>
          <p>
            We do not sell your personal information. We may share information
            with:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> Third-party vendors who
              perform services on our behalf (e.g., hosting, payment processing,
              AI model providers under strict confidentiality agreements).
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law or in
              response to valid requests by public authorities.
            </li>
          </ul>
          <p>
            When using third-party AI model providers, we send only the
            necessary code data for analysis and ensure these providers adhere
            to strict data privacy and security standards. Your code is not
            persistently stored by these providers beyond the processing time
            required for review, nor is it used for their general model training
            without separate agreements.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information and code submissions against
            accidental or unlawful destruction, loss, alteration, unauthorized
            disclosure, or access. However, no method of transmission over the
            Internet or electronic storage is 100% secure.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to
            provide the Service and fulfill the purposes outlined in this
            policy, or as required by law. Code submissions may be retained
            temporarily to provide the service and for quality assurance, but
            are not kept indefinitely unless associated with a saved project
            under your account.
          </p>

          <h2>7. Your Data Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights regarding your
            personal information, such as the right to access, correct, delete,
            or restrict its processing. Please contact us to exercise these
            rights.
          </p>

          <h2>8. Cookies and Tracking Technologies</h2>
          <p>
            We may use cookies and similar tracking technologies to track
            activity on our Service and hold certain information to enhance and
            personalize your experience.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Our Service is not intended for use by children under the age of 13
            (or applicable age in your jurisdiction). We do not knowingly
            collect personal information from children.
          </p>

          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last updated&quot; date.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at privacy@aicodereview.example.com.
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
