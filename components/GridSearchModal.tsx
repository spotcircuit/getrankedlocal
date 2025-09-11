'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MapPin, Search } from 'lucide-react';

interface GridSearchModalProps {
  isOpen: boolean;
  city: string;
  state: string;
  niche: string;
  businessName?: string;
  searchMode: 'all' | 'targeted';
  onClose?: () => void;
  gridSize?: number; // for ETA estimation
  radiusMiles?: number; // optional radius for info
}

export default function GridSearchModal({ 
  isOpen, 
  city, 
  state, 
  niche,
  businessName,
  searchMode,
  onClose,
  gridSize = 13,
  radiusMiles,
}: GridSearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing grid...');

  // Estimate total seconds: ~0.56s per point + small overhead; 13x13 ≈ 95s
  const totalPoints = gridSize * gridSize;
  const estimatedTotalSeconds = Math.max(30, Math.round(totalPoints * 0.56 + 5));
  
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStatusMessage('Initializing grid search...');
      setElapsedSeconds(0);
      return;
    }
    
    // Start timer and progress based on estimated time
    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        setProgress(Math.min(100, (next / estimatedTotalSeconds) * 100));
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Rotate helpful, generic status messages during the ETA
    const messages = [
      'Preparing grid points...',
      'Starting Google Maps queries...',
      'Collecting results across the grid...',
      'Analyzing competitor presence...',
      'Aggregating and scoring...',
      'Finalizing results...'
    ];
    let i = 0;
    setStatusMessage(messages[0]);
    const messageInterval = setInterval(() => {
      i = (i + 1) % messages.length;
      setStatusMessage(messages[i]);
    }, Math.max(4000, Math.floor((estimatedTotalSeconds / messages.length) * 1000)));

    return () => clearInterval(messageInterval);
  }, [isOpen, estimatedTotalSeconds]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
            <MapPin className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Grid Search in Progress
          </h2>
          <p className="text-gray-400">
            Analyzing {niche} in {city}, {state}
          </p>
          {searchMode === 'targeted' && businessName && (
            <p className="text-purple-400 text-sm mt-1">
              Tracking: {businessName}
            </p>
          )}
        </div>

        {/* Progress Bar with Timer */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <div className="flex items-center gap-3">
              <span className="text-blue-400">
                {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
                {(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-end text-xs text-gray-500 mt-1">
            ~{Math.max(0, estimatedTotalSeconds - elapsedSeconds)}s remaining (ETA)
          </div>
        </div>
        {/* Friendly message instead of misleading point counter */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-sm text-gray-300">
          Running {gridSize}×{gridSize} grid (~{totalPoints} points). This typically takes ~{estimatedTotalSeconds}s.
        </div>

        {/* Status Message */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <p className="text-gray-300 text-sm">{statusMessage}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-white">{gridSize}×{gridSize}</p>
            <p className="text-xs text-gray-400">Grid Size</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-purple-400">{totalPoints}</p>
            <p className="text-xs text-gray-400">Points</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-400">~{Math.max(0, estimatedTotalSeconds - elapsedSeconds)}s</p>
            <p className="text-xs text-gray-400">ETA</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">
                What's happening?
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                We're performing ~{gridSize * gridSize} individual Google searches across a {gridSize}×{gridSize} grid
                {typeof radiusMiles === 'number' ? (
                  <> with a {Math.round(radiusMiles)}‑mile radius</>
                ) : null} around your target location. Each point reveals local ranking
                data to build a complete competitive heat map.
              </p>
            </div>
          </div>
        </div>

        {/* Optional Cancel Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
          >
            Run in Background
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
