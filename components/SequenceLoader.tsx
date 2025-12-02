'use client';

import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';
import MotherScreen from './MotherScreen';

interface SequenceLoaderProps {
  children: React.ReactNode;
  duration?: number;
  onComplete?: () => void;
}

export default function SequenceLoader({
  children,
  duration = 2200,
  onComplete
}: SequenceLoaderProps) {
  const [currentStage, setCurrentStage] = useState<'loading' | 'mother' | 'complete'>('loading');
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Progress through stages
  useEffect(() => {
    if (currentStage === 'loading') {
      const timer = setTimeout(() => {
        setCurrentStage('mother');
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentStage, duration]);

  const handleMotherComplete = () => {
    setCurrentStage('complete');
    if (onComplete) onComplete();
  };

  if (currentStage === 'complete') {
    return <>{children}</>;
  }

  return (
    <>
      {currentStage === 'loading' && <LoadingScreen />}
      {currentStage === 'mother' && (
        <MotherScreen onComplete={handleMotherComplete} />
      )}
    </>
  );
}