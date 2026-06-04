import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultsContent from '@/app/results-page/components/ResultsContent';

export default function ResultsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16" style={{ paddingBottom: '4rem' }}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
