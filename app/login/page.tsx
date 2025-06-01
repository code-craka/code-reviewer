import AuthForm from '@/components/auth/AuthForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion'; // Import motion

export default async function LoginPage({ searchParams }: { searchParams: { next?: string, message?: string, error?: string }}) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const nextPath = searchParams.next || '/reviewer';

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
          <Link href="/">
            &larr; Back to Home
          </Link>
        </Button>
      </div>
      <AuthForm initialMessage={searchParams.message} initialError={searchParams.error} />
    </motion.div>
  );
}