import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import PopularRoutes from '@/app/components/PopularRoutes';
import HowItWorks from '@/app/components/HowItWorks';
import FeaturedCarriers from '@/app/components/FeaturedCarriers';
import TrustBanner from '@/app/components/TrustBanner';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBanner />
        <PopularRoutes />
        <HowItWorks />
        <FeaturedCarriers />
      </main>
      <Footer />
    </div>
  );
}
