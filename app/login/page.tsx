import AuthForm from "@/components/auth/AuthForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion"; // Import motion

type SearchParamsType = {
  next?: string | string[];
  message?: string | string[];
  error?: string | string[];
};

type PageProps = {
  searchParams: SearchParamsType;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Use searchParams directly
  const params = searchParams;

  // Handle both string and string[] types for query parameters
  const nextPath =
    typeof params.next === "string"
      ? params.next
      : Array.isArray(params.next)
        ? params.next[0]
        : "/reviewer";

  if (session) {
    redirect(nextPath);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-background p-4 py-8"
    >
      <div className="absolute top-4 left-4">
        <Button variant="link" asChild>
          <Link href="/">&larr; Back to Home</Link>
        </Button>
      </div>
      <AuthForm
        initialMessage={
          typeof params.message === "string"
            ? params.message
            : Array.isArray(params.message)
              ? params.message[0]
              : undefined
        }
        initialError={
          typeof params.error === "string"
            ? params.error
            : Array.isArray(params.error)
              ? params.error[0]
              : undefined
        }
      />
    </motion.div>
  );
}
