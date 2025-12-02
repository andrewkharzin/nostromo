'use client';

import { useEffect, useState } from 'react';

interface MotherScreenProps {
  onComplete?: () => void;
}

export default function MotherScreen({ onComplete }: MotherScreenProps) {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);
  const [showMother, setShowMother] = useState(false);

  const sequence = [
    { text: "INITIALIZING SYSTEM...", delay: 100 },
    { text: "\n> BOOTING NOSTROMO MAINFRAME...", delay: 80 },
    { text: "\n> LOADING CREW MANIFEST...", delay: 70 },
    { text: "\n> ACCESSING SHIP'S LOG...", delay: 90 },
    { text: "\n> VERIFYING SECURITY PROTOCOLS...", delay: 85 },
    { text: "\n\n> ESTABLISHING CONNECTION TO MOTHER...", delay: 75 },
    { text: "\n> AUTHENTICATION REQUIRED...", delay: 100 },
    { text: "\n> VOICE PRINT VERIFIED: CAPTAIN DALLAS", delay: 65 },
    { text: "\n> BIOMETRICS CONFIRMED", delay: 80 },
    { text: "\n> SECURITY LEVEL: OMEGA", delay: 90 },
    { text: "\n\n> ENCRYPTION: 256-BIT QUANTUM", delay: 70 },
    { text: "\n> CONNECTION STATUS: SECURE", delay: 85 },
    { text: "\n> SIGNAL STRENGTH: 100%", delay: 60 },
    { text: "\n> LATENCY: <2ms", delay: 75 },
    { text: "\n\n> ALL SYSTEMS NOMINAL", delay: 100 },
    { text: "\n> READY FOR COMMAND...", delay: 120 },
  ];

  // Terminal typing effect
  useEffect(() => {
    if (currentStep < sequence.length) {
      const { text, delay } = sequence[currentStep];
      let i = 0;

      const typeChar = () => {
        if (i < text.length) {
          setDisplayText(prev => prev + text.charAt(i));
          i++;
          setTimeout(typeChar, delay);
        } else {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
          }, 300);
        }
      };

      const timer = setTimeout(typeChar, 500);
      return () => clearTimeout(timer);
    } else {
      // Final "MOTHER" reveal with effects
      setTimeout(() => {
        setShowGlitch(true);
        setTimeout(() => {
          setShowGlitch(false);
          setShowMother(true);

          // Trigger glitch effect periodically
          const glitchInterval = setInterval(() => {
            setShowGlitch(true);
            setTimeout(() => setShowGlitch(false), 100);
          }, 3000);

          // Auto-complete after showing MOTHER
          const completeTimer = setTimeout(() => {
            clearInterval(glitchInterval);
            if (onComplete) onComplete();
          }, 5000);

          return () => {
            clearInterval(glitchInterval);
            clearTimeout(completeTimer);
          };
        }, 300);
      }, 1000);
    }
  }, [currentStep, onComplete]);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    if (showGlitch) {
      const glitchTimer = setTimeout(() => setShowGlitch(false), 100);
      return () => clearTimeout(glitchTimer);
    }
  }, [showGlitch]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* CRT Screen Effect */}
      <div className="absolute inset-0">
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }}
        />

        {/* Screen curvature effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 70%)" />

        {/* Static noise */}
        <div className="absolute inset-0 opacity-5 animate-pulse-fast">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==')]" />
        </div>
      </div>

      {/* Main Terminal */}
      <div className={`relative h-full flex items-center justify-center p-8 transition-all duration-300 ${
        showGlitch ? 'opacity-70 blur-[2px]' : 'opacity-100 blur-0'
      }`}>
        <div className="relative w-full max-w-4xl">
          {/* Terminal Border */}
          <div className="relative border-2 border-green-900/50 bg-black/90 backdrop-blur-sm rounded-lg p-1">
            {/* Glowing border effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500/10 via-green-500/5 to-green-500/10 blur-xl rounded-xl" />

            {/* Inner terminal */}
            <div className="relative bg-black border border-green-800/30 rounded p-6 md:p-8">
              {/* Terminal header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-900/30">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-900"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-900"></div>
                  <div className="w-3 h-3 rounded-full bg-green-900"></div>
                </div>
                <div className="text-green-700 font-mono text-sm tracking-widest">
                  NOSTROMO_MAINFRAME_TERMINAL
                </div>
                <div className="ml-auto text-green-900 text-xs font-mono">
                  SECURE CONNECTION
                </div>
              </div>

              {/* Terminal content */}
              <div className="font-mono text-green-500 leading-relaxed min-h-[400px]">
                {/* System info */}
                <div className="mb-6 text-green-600">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">WEYLAND-YUTANI CORPORATION</span>
                  </div>
                  <div className="text-xs text-green-700 mb-4">
                    COMMERCIAL STARSHIP NOSTROMO • REGISTRY: 180246
                  </div>
                </div>

                {/* Typing text */}
                <pre className="whitespace-pre-wrap text-green-400 text-sm md:text-base">
                  {displayText}
                  <span className={`inline-block w-2 h-5 bg-green-500 ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
                </pre>

                {/* MOTHER Reveal */}
                {showMother && (
                  <div className="mt-12 animate-fade-in">
                    {/* Glitch container */}
                    <div className="relative">
                      {/* MOTHER text with multiple layers for glitch effect */}
                      <div className="relative">
                        {/* Main text */}
                        <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-center text-green-400 font-mono tracking-wider animate-pulse-slow">
                          MOTHER
                        </div>

                        {/* Glitch layers */}
                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-center text-red-400 font-mono tracking-wider absolute -top-1 -left-1">
                            MOTHER
                          </div>
                          <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-center text-blue-400 font-mono tracking-wider absolute top-1 left-1">
                            MOTHER
                          </div>
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div className="mt-6 text-center">
                        <div className="text-green-600 text-lg font-mono tracking-widest animate-pulse">
                          SYSTEM CONNECTION ESTABLISHED
                        </div>
                        <div className="mt-2 text-green-800 text-sm">
                          Ready to receive commands, Captain
                        </div>
                      </div>
                    </div>

                    {/* Status indicators */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'STATUS', value: 'ONLINE', color: 'text-green-400' },
                        { label: 'SECURITY', value: 'OMEGA', color: 'text-yellow-400' },
                        { label: 'POWER', value: '100%', color: 'text-green-400' },
                        { label: 'CREW', value: '7/7', color: 'text-green-400' },
                      ].map((item, index) => (
                        <div key={index} className="text-center p-3 border border-green-900/30 rounded">
                          <div className="text-xs text-green-700 mb-1">{item.label}</div>
                          <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Command prompt */}
                {!showMother && (
                  <div className="mt-8 text-green-600 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-700">NOSTROMO:</span>
                      <span className="text-green-500">~</span>
                      <span className="text-green-400">$</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-green-900/50 via-green-700/30 to-transparent"></div>
                    </div>
                    <div className="mt-2 text-green-800 text-xs">
                      Type 'help' for available commands
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal footer */}
              <div className="mt-8 pt-4 border-t border-green-900/30">
                <div className="flex flex-wrap items-center justify-between gap-4 text-green-800 text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <span>CPU: 12%</span>
                    <span>RAM: 34%</span>
                    <span>TEMP: 28°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-900 animate-pulse"></div>
                    <span>SECURE CHANNEL ACTIVE</span>
                  </div>
                  <div>23:47:18 UTC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ambient lights */}
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Manual proceed button (optional) */}
      {showMother && (
        <div className="absolute bottom-8 left-0 right-0 text-center animate-fade-in-up">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-800/50 text-green-400 font-mono text-sm rounded-lg hover:bg-green-900/40 hover:border-green-700/50 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            ENTER SYSTEM [PRESS ANY KEY]
          </button>
          <div className="mt-2 text-green-900 text-xs font-mono">
            Press any key or click to continue
          </div>
        </div>
      )}

      {/* Audio element for typing sounds (optional) */}
      <audio id="typing-sound" preload="auto">
        <source src="https://assets.mixkit.co/sfx/preview/mixkit-keyboard-typing-1386.mp3" type="audio/mpeg" />
      </audio>

      {/* Inline styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; text-shadow: 0 0 10px rgba(0, 255, 0, 0.3); }
          50% { opacity: 1; text-shadow: 0 0 20px rgba(0, 255, 0, 0.7); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-fast {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }

        .animate-scan {
          animation: scan 10s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.5s both;
        }

        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }

        /* CRT curvature effect */
        .crt-curve {
          transform: perspective(500px) rotateX(3deg);
        }

        /* Text glow */
        .text-glow {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}