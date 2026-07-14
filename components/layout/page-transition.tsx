"use client";

import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.16,
      ease: [0.22, 1, 0.36, 1] as const,
      delayChildren: 0.02,
      staggerChildren: 0.04,
    },
  },
};

// Gentle spring with a hint of overshoot — the "settling" motion that reads
// as native on Apple platforms, rather than a flat tween.
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.9 },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={variants}>
      {children}
    </motion.div>
  );
}

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section variants={item} className={className}>
      {children}
    </motion.section>
  );
}
