'use client'

import { useEffect } from 'react'

interface ParallaxStarsProps {
  intensity?: 'low' | 'medium' | 'high'
  speed?: 'slow' | 'normal' | 'fast'
  className?: string
}

export default function ParallaxStars({
  intensity = 'medium',
  speed = 'normal',
  className = ''
}: ParallaxStarsProps) {
  useEffect(() => {
    // Generate CSS for stars
    const style = document.createElement('style')
    style.textContent = `
      .parallax-stars-container {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      .parallax-stars {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
      }

      #parallax-stars-small {
        width: 1px;
        height: 1px;
        box-shadow: ${generateStars(700, 2000)};
        animation: parallax-star-move 50s linear infinite;
      }

      #parallax-stars-medium {
        width: 2px;
        height: 2px;
        box-shadow: ${generateStars(200, 2000)};
        animation: parallax-star-move 100s linear infinite;
      }

      #parallax-stars-large {
        width: 3px;
        height: 3px;
        box-shadow: ${generateStars(100, 2000)};
        animation: parallax-star-move 150s linear infinite;
      }

      @keyframes parallax-star-move {
        from {
          transform: translateY(0px);
        }
        to {
          transform: translateY(-2000px);
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [intensity, speed])

  const generateStars = (n: number, max: number): string => {
    let shadows = ''
    for (let i = 0; i < n; i++) {
      const x = Math.floor(Math.random() * max)
      const y = Math.floor(Math.random() * max)
      shadows += `${shadows ? ', ' : ''}${x}px ${y}px #FFF`
    }
    return shadows
  }

  return (
    <div className={`parallax-stars-container ${className}`}>
      <div className="parallax-stars" id="parallax-stars-small"></div>
      <div className="parallax-stars" id="parallax-stars-medium"></div>
      <div className="parallax-stars" id="parallax-stars-large"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/20 via-transparent to-gray-950/20"></div>
    </div>
  )
}