import AuthForm from "@/components/auth/AuthForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/ui/motion-wrapper"; // Import client-side motion wrapper

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
    data: { user },
  } = await supabase.auth.getUser();

  const awaitedSearchParams = await searchParams;
  const { next: nextParam, message: messageParam, error: errorParam } = awaitedSearchParams;
  
  // Process the next path
  let nextPath = "/dashboard";
  if (typeof nextParam === "string") {
    nextPath = nextParam;
  } else if (Array.isArray(nextParam) && nextParam.length > 0) {
    nextPath = nextParam[0];
  }

  // Process message parameter
  let messageValue: string | undefined = undefined;
  if (typeof messageParam === "string") {
    messageValue = messageParam;
  } else if (Array.isArray(messageParam) && messageParam.length > 0) {
    messageValue = messageParam[0];
  }

  // Process error parameter
  let errorValue: string | undefined = undefined;
  if (typeof errorParam === "string") {
    errorValue = errorParam;
  } else if (Array.isArray(errorParam) && errorParam.length > 0) {
    errorValue = errorParam[0];
  }

  if (user) {
    redirect(nextPath);
  }

  return (
    <MotionDiv className="min-h-screen flex flex-col items-center justify-center bg-background p-4 py-8">
      <div className="absolute top-4 left-4">
        <Button variant="link" asChild>
          <Link href="/">&larr; Back to Home</Link>
        </Button>
      </div>
      <AuthForm
        initialMessage={messageValue}
        initialError={errorValue}
      />
    </MotionDiv>
  );
}
