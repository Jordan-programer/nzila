import React, { Suspense } from 'react';
import Header from '@/components/Header';
import AuthCard from '@/app/sign-up-login-screen/components/AuthCard';
import { Loader2 } from 'lucide-react';

export default function SignUpLoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
          }
        >
          <AuthCard />
        </Suspense>
      </main>
    </div>
  );
}
