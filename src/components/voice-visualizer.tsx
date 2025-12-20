"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export function VoiceVisualizer({ isActive }: VoiceVisualizerProps) {
  const [audioData, setAudioData] = useState<number[]>(new Array(40).fill(10));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isActive) {
      startVisualizer();
    } else {
      stopVisualizer();
    }

    return () => stopVisualizer();
  }, [isActive]);

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 128; // Small fft for simple visualization
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map high frequencies to a smaller array for visualization
        // and normalize values
        const normalizedData = Array.from(dataArray.slice(0, 40)).map(v => 
          Math.max(4, (v / 255) * 40) // Min height 4px, max 40px
        );
        
        setAudioData(normalizedData);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.error("Error starting visualizer:", err);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setAudioData(new Array(40).fill(4));
  };

  return (
    <div className="flex items-center justify-center gap-[3px] h-full w-full min-h-[44px]">
      {audioData.map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: 4 }}
          animate={{ height }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-1 rounded-full bg-blue-500 dark:bg-blue-400 opacity-60"
        />
      ))}
    </div>
  );
}


