import { HeroSection } from '@/src/features/landing/HeroSection';
import { HowItWorksScene } from '@/src/features/landing/HowItWorksScene';
import { RecommendationScene } from '@/src/features/landing/RecommendationScene';
import { ZeroTraceScene } from '@/src/features/landing/ZeroTraceScene';
import { FinalCTAScene } from '@/src/features/landing/FinalCTAScene';

export default function HomePage() {
  return (
    <>
      {/* Scene 01 — Hero */}
      <HeroSection />

      {/* Scene 02 — How it works: data transformation story */}
      <HowItWorksScene />

      {/* Scene 03 — Smart recommendation + chart morphing */}
      <RecommendationScene />

      {/* Scene 04 — Zero-Trace privacy */}
      <ZeroTraceScene />

      {/* Scene 05 — Final CTA + Footer */}
      <FinalCTAScene />
    </>
  );
}
