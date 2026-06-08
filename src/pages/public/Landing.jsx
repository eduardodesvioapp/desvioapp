import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Showcase } from '@/components/landing/Showcase';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';
import { PageHeader } from '@/components/patterns/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';

export function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Showcase />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
