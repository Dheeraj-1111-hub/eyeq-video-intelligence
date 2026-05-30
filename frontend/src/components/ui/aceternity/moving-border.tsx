import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Button = ({
  borderRadius = "0.5rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: any) => {
  return (
    <Component
      className={cn(
        "bg-transparent relative text-xl  h-16 w-40 p-[1px] overflow-hidden ",
        containerClassName,
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div className="absolute inset-0" style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}>
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 opacity-[0.8] bg-[radial-gradient(var(--sky-500)_40%,transparent_60%)]",
              borderClassName,
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative bg-slate-900/[0.8] border border-slate-800 backdrop-blur-xl text-white flex items-center justify-center w-full h-full text-sm antialiased",
          className,
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
};

export const MovingBorder = ({ children, duration = 2000, rx, ry, ...otherProps }: any) => {
  return (
    <div className="absolute inset-0 h-full w-full">
      <motion.div
        animate={{
          transform: ["rotate(0deg)", "rotate(360deg)"],
        }}
        transition={{
          repeat: Infinity,
          duration: duration / 1000,
          ease: "linear",
        }}
        className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] origin-center flex items-center justify-center"
      >
        <div className="w-[100%] h-[100%] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,var(--primary)_100%)]" />
      </motion.div>
      {children}
    </div>
  );
};
