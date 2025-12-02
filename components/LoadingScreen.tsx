'use client';

import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
}

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stars, setStars] = useState<Star[]>([]);
  const [statusWidths, setStatusWidths] = useState<number[]>([]);

  const loadingSteps = [
    { id: 1, text: "Initializing quantum processor...", duration: 800 },
    { id: 2, text: "Calibrating neural network...", duration: 1200 },
    { id: 3, text: "Establishing secure connection...", duration: 1000 },
    { id: 4, text: "Loading communication protocols...", duration: 900 },
    { id: 5, text: "Finalizing system boot sequence...", duration: 1100 },
  ];

  const statusItems = [
    { label: 'ENCRYPTION', value: 'AES-256', color: 'from-blue-500 to-cyan-500' },
    { label: 'QUANTUM LINK', value: 'ACTIVE', color: 'from-purple-500 to-pink-500' },
    { label: 'DATABASE', value: 'SYNCED', color: 'from-emerald-500 to-teal-500' },
    { label: 'LATENCY', value: '<2ms', color: 'from-violet-500 to-indigo-500' },
  ];

  // Initialize stars and random widths on client side only
  useEffect(() => {
    const newStars: Star[] = [];

    // Small stars (700)
    for (let i = 0; i < 700; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 2 + Math.random() * 3
      });
    }

    // Medium stars (200)
    for (let i = 700; i < 900; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2,
        speed: 0.8 + Math.random() * 1.2,
        opacity: 0.4 + Math.random() * 0.6,
        twinkleSpeed: 1.5 + Math.random() * 2.5
      });
    }

    // Large stars (100)
    for (let i = 900; i < 1000; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3,
        speed: 1 + Math.random() * 1,
        opacity: 0.5 + Math.random() * 0.5,
        twinkleSpeed: 1 + Math.random() * 2
      });
    }

    setStars(newStars);

    // Generate random widths for status bars
    const widths = statusItems.map(() => 70 + Math.random() * 30);
    setStatusWidths(widths);
  }, []);

  useEffect(() => {
    if (currentStep < loadingSteps.length) {
      const timer = setTimeout(() => {
        const newProgress = ((currentStep + 1) / loadingSteps.length) * 100;
        setProgress(newProgress);
        setCurrentStep(prev => prev + 1);
      }, loadingSteps[currentStep]?.duration || 1000);

      return () => clearTimeout(timer);
    } else {
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [currentStep]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Parallax Stars Background */}
      <div className="absolute inset-0">
        {/* Nebula/Cloud Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        </div>

        {/* Parallax Stars Layers */}
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}vw`,
                top: `${star.y}vh`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `float ${50 / star.speed}s linear infinite, twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
                boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(255, 255, 255, ${star.opacity * 0.3})`,
                transform: `translateY(${100 * star.speed}vh)`
              }}
            />
          ))}
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(180deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-screen flex flex-col items-center justify-center p-4">
        {/* Logo/Brand */}
        <div className="mb-12 text-center relative">
          <div className="relative inline-block">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 blur-3xl -z-10 animate-pulse-slow"></div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent animate-gradient-x tracking-tight">
              QUANTUM CHAT
            </h1>

            {/* Subtitle */}
            <div className="mt-6 relative">
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-light tracking-widest">
                SECURE COMMUNICATION PROTOCOL
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            </div>
          </div>

          {/* Version Badge */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400 font-mono">v2.1.4 • QUANTUM ENCRYPTED</span>
          </div>
        </div>

        {/* Progress Container */}
        <div className="w-full max-w-2xl mx-auto mb-12">
          {/* Progress Bar */}
          <div className="relative h-1.5 bg-gray-800/50 rounded-full overflow-hidden mb-6 backdrop-blur-sm">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            </div>

            {/* Progress Dots */}
            <div className="absolute inset-0 flex justify-between items-center px-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    progress >= (i + 1) * 10
                      ? 'bg-white scale-125'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 font-mono tracking-wider">SYSTEM INITIALIZATION</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono text-lg font-bold">{Math.round(progress)}%</span>
              <div className="w-16 h-px bg-gradient-to-r from-gray-400 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Loading Steps */}
        <div className="w-full max-w-xl mx-auto mb-16">
          <div className="space-y-3">
            {loadingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 py-4 px-6 rounded-xl transition-all duration-500 backdrop-blur-sm ${
                  index < currentStep
                    ? 'bg-white/5 border border-white/10 shadow-lg shadow-white/5'
                    : 'bg-black/20 border border-gray-800/50'
                }`}
                style={{
                  transform: index < currentStep ? 'translateX(0)' : 'translateX(-20px)',
                  opacity: index < currentStep ? 1 : 0.7
                }}
              >
                {/* Step Number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  index < currentStep
                    ? 'bg-white text-gray-900 scale-110'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {index < currentStep ? '✓' : step.id}
                </div>

                {/* Step Text */}
                <div className="flex-1">
                  <span className={`font-medium transition-all duration-500 ${
                    index < currentStep ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.text}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  index < currentStep
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-gray-700'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* System Status Grid */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statusItems.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-500 hover:scale-105 hover:border-white/20 group"
              >
                <div className="text-xs text-gray-400 font-mono mb-2 tracking-wider">{item.label}</div>
                <div className={`text-xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  {item.value}
                </div>
                <div className="mt-3 h-1 bg-gray-800/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${statusWidths[index] || 70}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Terminal Output */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 font-mono">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm text-gray-400">system-boot.log</div>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { text: 'Initializing quantum encryption modules...', status: 'done' },
                { text: 'Establishing secure quantum entanglement...', status: 'done' },
                { text: 'Calibrating neural interface protocols...', status: 'done' },
                { text: 'Syncing distributed database clusters...', status: 'loading' },
                { text: 'Finalizing security handshake...', status: 'pending' },
              ].map((line, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-500">$</span>
                  <span>{line.text}</span>
                  <span className="ml-auto">
                    {line.status === 'done' && (
                      <span className="text-emerald-500 animate-pulse">✓</span>
                    )}
                    {line.status === 'loading' && (
                      <span className="text-cyan-500 animate-spin">⟳</span>
                    )}
                    {line.status === 'pending' && (
                      <span className="text-gray-500">...</span>
                    )}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-gray-500 animate-blink">
                <span>▋</span>
                <span className="text-xs">Awaiting input...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-mono tracking-widest">
              © 2024 QUANTUM COMMUNICATION NETWORK • ALL RIGHTS RESERVED
            </p>
            <div className="mt-2 flex justify-center gap-4">
              <span className="text-gray-600 text-xs">ENCRYPTED</span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-gray-600 text-xs">SECURE</span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-gray-600 text-xs">PRIVATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style jsx>{`
        @keyframes float {
          from {
            transform: translateY(100vh);
          }
          to {
            transform: translateY(-100vh);
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-blink {
          animation: blink 1s infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}