"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
}

export function AnimatedIcon({ icon: Icon, className }: AnimatedIconProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="inline-flex"
      whileHover={reduceMotion ? {} : { scale: 1.15, rotate: 6 }}
      whileTap={reduceMotion ? {} : { scale: 0.9 }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        y: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <Icon className={className} />
    </motion.div>
  );
}
