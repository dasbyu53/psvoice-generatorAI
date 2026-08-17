import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FlowSection } from "@/components/landing/FlowSection";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { PresetsSection } from "@/components/landing/PresetsSection";
import { VoicesSection } from "@/components/landing/VoicesSection";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      <Navbar />
      <main>
        <Hero />
        <FlowSection />
        <FeaturesSection />
        <VoicesSection />
        <PresetsSection />
      </main>
      <Footer />
    </motion.div>
  );
}
