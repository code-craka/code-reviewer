import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SupabaseProvider from "@/components/providers/supabase-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f23" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "CodeReviewer AI - AI-Powered Code Review Tool",
    template: "%s | CodeReviewer AI",
  },
  description:
    "AI that auto-detects bugs, security issues, and performance bottlenecks in your code. Ship better software with confidence and reduce review time by 60%.",
  keywords: [
    "code review",
    "AI code analysis",
    "automated code review",
    "bug detection",
    "security analysis",
    "performance optimization",
    "developer tools",
    "GitHub integration",
    "code quality",
    "static analysis",
    "software development",
    "AI developer tools",
    "code reviewer",
    "automated testing",
    "code optimization",
  ],
  authors: [{ name: "TechSci, Inc." }],
  creator: "TechSci, Inc.",
  publisher: "TechSci, Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://codereviewer.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codereviewer.ai",
    title: "CodeReviewer AI - AI-Powered Code Review Tool",
    description:
      "AI that auto-detects bugs, security issues, and performance bottlenecks in your code. Ship better software with confidence and reduce review time by 60%.",
    siteName: "CodeReviewer AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeReviewer AI - AI-Powered Code Review Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeReviewer AI - AI-Powered Code Review Tool",
    description:
      "AI that auto-detects bugs, security issues, and performance bottlenecks in your code. Ship better software with confidence and reduce review time by 60%.",
    images: ["/og-image.png"],
    creator: "@codereviewer_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "technology",
  classification: "Business",
  referrer: "origin-when-cross-origin",
  generator: "Next.js",
  applicationName: "CodeReviewer AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CodeReviewer AI",
  },
  other: {
    "msapplication-TileColor": "#8b5cf6",
    "msapplication-config": "/browserconfig.xml",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Additional meta tags for better SEO */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Structured data for search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CodeReviewer AI",
              description:
                "AI-powered code review tool that auto-detects bugs, security issues, and performance bottlenecks",
              url: "https://codereviewer.ai",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier available",
              },
              publisher: {
                "@type": "Organization",
                name: "TechSci, Inc.",
                url: "https://codereviewer.ai",
                logo: {
                  "@type": "ImageObject",
                  url: "https://codereviewer.ai/logo.png",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "hello@techsci.io",
                  contactType: "customer service",
                },
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "651 N Broad St, Suite 201",
                  addressLocality: "Middletown",
                  addressRegion: "Delaware",
                  postalCode: "19709",
                  addressCountry: "US",
                },
              },
              featureList: [
                "Real-time code feedback",
                "Multi-language support",
                "GitHub/GitLab/Bitbucket integrations",
                "Security vulnerability detection",
                "Team collaboration",
                "Smart auto-suggestions",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-gray-950 text-white antialiased`}
        suppressHydrationWarning
      >
        <SupabaseProvider>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-violet-600 text-white px-4 py-2 rounded-md z-50 transition-all"
          >
            Skip to main content
          </a>

          <div className="relative min-h-screen flex flex-col">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-blue-900/20 to-cyan-900/20 animate-pulse" />
              <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 10}s`,
                      animationDuration: `${10 + Math.random() * 20}s`,
                    }}
                  />
                ))}
              </div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "2s" }}
              />
            </div>
            <main id="main-content" className="relative flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </SupabaseProvider>

        {/* Analytics scripts (only in production) */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
