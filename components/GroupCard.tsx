'use client'

import { useState, useEffect, useRef } from 'react'
import { Group } from '../lib/types'

interface GroupCardProps {
  group: Group
  onJoin?: (groupId: string) => void
  showJoinButton?: boolean
  showDetails?: boolean
  variant?: 'default' | 'priority' // Changed from premium to priority for Alien theme
}

export default function GroupCard({
  group,
  onJoin,
  showJoinButton = true,
  showDetails = true,
  variant = 'default'
}: GroupCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scanlinePosition, setScanlinePosition] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Scanline animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePosition(prev => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current && isHovered) {
        const rect = cardRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10
        setMousePosition({ x, y })
      }
    }

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered])

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onJoin) {
      onJoin(group.id)
    }
  }

  const handleCardClick = () => {
    if (onJoin) {
      onJoin(group.id)
    }
  }

  // Alien theme styling
  const getStyles = () => {
    if (variant === 'priority') {
      return {
        gradient: 'from-yellow-600 via-yellow-500 to-amber-700',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500',
        border: 'border-yellow-500',
        glow: 'shadow-yellow-500/30',
        status: 'PRIORITY'
      }
    }

    // Default variant
    return {
      gradient: 'from-green-600 via-green-500 to-green-700',
      text: 'text-green-400',
      bg: 'bg-green-500',
      border: 'border-green-500',
      glow: 'shadow-green-500/20',
      status: 'STANDARD'
    }
  }

  const styles = getStyles()

  return (
    <div className="relative font-mono">
      {/* CRT Screen Effects */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
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

        {/* Moving scanline */}
        <div
          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent"
          style={{ top: `${scanlinePosition}%` }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 80%)" />
      </div>

      {/* Main Card - Terminal Style */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-lg border border-green-800/50 bg-black/90 backdrop-blur-sm transition-all duration-300 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setMousePosition({ x: 0, y: 0 })
        }}
        onClick={handleCardClick}
        style={{
          transform: isHovered
            ? `translateY(-4px) scale(1.02) perspective(500px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
            : 'translateY(0) scale(1)',
          boxShadow: isHovered
            ? `0 15px 35px -8px rgba(0, 0, 0, 0.7), 0 0 30px ${styles.glow}, inset 0 0 20px rgba(0, 255, 0, 0.1)`
            : '0 4px 20px rgba(0, 0, 0, 0.5)',
          borderColor: isHovered ? `rgba(0, 255, 0, 0.4)` : 'rgba(0, 150, 0, 0.3)'
        }}
      >
        {/* Terminal glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-900/20 via-green-800/10 to-green-900/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Flickering text effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/[0.02] to-transparent animate-pulse-slow"></div>
        </div>

        <div className="relative z-10 p-6">
          {/* Header with terminal indicators */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-green-900/30">
            <div className="flex-1">
              {/* Status lights */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${styles.bg} animate-pulse`}></div>
                  <div className="w-2 h-2 rounded-full bg-green-700"></div>
                  <div className="w-2 h-2 rounded-full bg-green-900"></div>
                </div>
                <span className={`text-xs font-medium ${styles.text} uppercase tracking-widest`}>
                  COMMUNICATION CHANNEL
                </span>
              </div>

              {/* Channel name */}
              <h3 className="text-xl font-bold text-green-300 mb-2 group-hover:text-green-200 transition-colors duration-300 tracking-tight">
                {group.name}
              </h3>

              {/* Metadata */}
              {showDetails && (
                <div className="flex items-center gap-3 text-xs text-green-700">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(group.created_at).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: '2-digit'
                    }).replace(/\//g, '.')}
                  </span>
                  <span className="text-green-900">•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    ACTIVE
                  </span>
                </div>
              )}
            </div>

            {/* Priority Badge */}
            <div className={`px-3 py-1.5 bg-gradient-to-r ${styles.gradient} rounded text-black text-xs font-bold tracking-wider shadow-lg ${styles.glow} border border-green-300/20`}>
              {styles.status}
            </div>
          </div>

          {/* Description */}
          {group.description && showDetails && (
            <div className="mb-6">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-green-600 text-xs mt-1"></span>
                <p className="text-green-400 text-sm leading-relaxed line-clamp-3 group-hover:text-green-300 transition-colors duration-300">
                  {group.description}
                </p>
              </div>
              <div className="h-px bg-gradient-to-r from-green-900/50 via-green-700/30 to-green-900/50"></div>
            </div>
          )}

          {/* System Stats */}
          {showDetails && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'CAPACITY', value: '∞', color: 'text-green-400' },
                { label: 'ENCRYPT', value: variant === 'priority' ? '256BIT' : '128BIT', color: styles.text },
                { label: 'UPTIME', value: '99.9%', color: 'text-green-400' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-3 rounded border border-green-900/30 bg-black/30 group-hover:border-green-700/50 transition-colors duration-300"
                >
                  <div className={`text-lg font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-green-700 text-xs tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Footer with connection info */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-5 border-t border-green-900/30">
            {showDetails ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-green-700">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span>SECURE</span>
                  </span>
                  <span className="text-green-900">•</span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    ENCRYPTED
                  </span>
                  <span className="text-green-900">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    LOW LATENCY
                  </span>
                </div>

                {showJoinButton && (
                  <button
                    onClick={handleJoin}
                    className={`relative px-6 py-2.5 bg-gradient-to-r ${styles.gradient} text-black font-bold text-sm rounded border border-green-300/30 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden group/btn tracking-wider`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      ACCESS CHANNEL
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>

                    {/* Button scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 animate-shimmer"></div>
                  </button>
                )}
              </>
            ) : (
              <div className="w-full text-center">
                <div className="text-xs text-green-700">
                  CREATED: {new Date(group.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terminal corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-700/50"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-green-700/50"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-green-700/50"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-700/50"></div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] via-transparent to-green-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Inline styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-scan {
          animation: scan 10s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        /* Line clamp for description */
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        /* Terminal text glow */
        .text-glow {
          text-shadow: 0 0 8px currentColor;
        }
      `}</style>
    </div>
  )
}