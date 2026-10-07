"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Dumbbell } from "lucide-react";

export function ScrollPulldown() {
  const { scrollYProgress } = useScroll();
  
  // Smooth out the scroll progress to feel like a weighted cable machine
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 80, 
    damping: 25,
    restDelta: 0.001
  });
  
  // The weight rotates slightly as you pull it down
  const rotate = useTransform(smoothProgress, [0, 1], [-20, 20]);

  return (
    <div className="fixed right-2 sm:right-8 top-0 h-[85vh] w-12 z-50 pointer-events-none flex flex-col items-center">
      {/* Top Pulley Wheel */}
      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-[3px] md:border-4 border-foreground/20 bg-surface shadow-sm absolute top-[-12px] md:top-[-16px] z-10 flex items-center justify-center">
         <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-foreground/40" />
      </div>

      {/* The Cable Line */}
      <motion.div 
        className="w-[2px] md:w-[3px] bg-gradient-to-b from-foreground/20 via-brand/80 to-brand origin-top shadow-[0_0_8px_rgba(132,204,22,0.6)]"
        style={{ scaleY: smoothProgress, height: "100%" }}
      />
      
      {/* The Dumbbell attached to the cable */}
      <motion.div 
        className="absolute left-1/2 -ml-5 md:-ml-7 w-10 h-10 md:w-14 md:h-14 bg-surface dark:bg-[#0d0e0c] border-2 md:border-[3px] border-brand rounded-full shadow-[0_4px_20px_rgba(132,204,22,0.4)] flex items-center justify-center text-foreground z-20"
        style={{ 
          top: useTransform(smoothProgress, [0, 1], ["0%", "100%"]), 
          marginTop: "-14px",
          rotate
        }}
      >
        <Dumbbell className="size-5 md:size-6 text-brand drop-shadow-md" strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
