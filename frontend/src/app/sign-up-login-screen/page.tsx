import React from 'react';
import Header from '@/components/Header';
import AuthCard from '@/app/sign-up-login-screen/components/AuthCard';

export default function SignUpLoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <AuthCard />
      </main>
    </div>
  );
}
