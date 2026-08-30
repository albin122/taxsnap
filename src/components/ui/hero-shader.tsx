"use client";

import type React from "react";
import { useRef } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

interface ShaderBackgroundProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export function ShaderBackground({ children, theme = 'dark' }: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const MeshGradientComp = MeshGradient as React.ComponentType<any>;

  const isLight = theme === 'light';
  const bgClass = isLight ? "bg-[#f8fafc]" : "bg-[#041019]";
  
  const darkColors = ["#041019", "#064e3b", "#0d9488", "#1e3a8a", "#0f172a"];
  const lightColors = ["#f0fdf4", "#e0f2fe", "#ccfbf1", "#f3f4f6", "#dbeafe"];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${bgClass}`}
    >
      {/* High-Performance 60fps GPU Mesh Gradient Shader */}
      <MeshGradientComp
        className="absolute inset-0 w-full h-full will-change-transform transform-gpu"
        colors={isLight ? lightColors : darkColors}
        speed={0.15}
        backgroundColor={isLight ? "#f8fafc" : "#041019"}
      />

      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
