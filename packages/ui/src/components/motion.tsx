// ─────────────────────────────────────────────────────────────────────────────
// Motion primitives — framer-motion wrappers with consistent easing curves.
// Re-exports cover both the salon and freelancer dashboards' usage so either
// can switch to `@kshuri/ui` without behavioural change.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import * as React from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

export interface FadeInProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn = ({
  children,
  delay = 0,
  className = "",
  ...props
}: FadeInProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeInUp}
    transition={{ duration: 0.5, delay, ease: EASE }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const ScaleIn = ({ children, delay = 0, className = "" }: ScaleInProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={scaleIn}
    transition={{ duration: 0.4, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

export interface SlideInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const SlideIn = ({ children, delay = 0, className = "" }: SlideInProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={slideInLeft}
    transition={{ duration: 0.45, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

export interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className = "" }: StaggerItemProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
      visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.45, ease: EASE },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export const HoverScale = React.forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, className = "", scale = 1.02 }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale, y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  ),
);
HoverScale.displayName = "HoverScale";

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedCard = ({ children, className = "", delay = 0 }: AnimatedCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: EASE }}
    whileHover={{
      y: -3,
      boxShadow:
        "0 8px 30px hsl(0 0% 0% / 0.08), 0 20px 50px hsl(0 0% 0% / 0.06)",
      transition: { duration: 0.25 },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.4, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);
