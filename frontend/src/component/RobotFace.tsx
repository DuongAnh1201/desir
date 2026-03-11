import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Emotion } from '../types';

interface RobotFaceProps {
  emotion: Emotion;
  isSpeaking: boolean;
  themeColor: string;
}

export const RobotFace: React.FC<RobotFaceProps> = ({ emotion, isSpeaking, themeColor }) => {
  const getEmotionConfig = () => {
    const baseColor = themeColor;
    switch (emotion) {
      case 'happy': 
      case 'happiness':
      case 'smile':
        return { 
          color: baseColor, 
          rotationSpeed: 10, 
          pulseSpeed: 1.5, 
          scale: 1.1,
          glowIntensity: `0 0 30px ${baseColor}99`
        };
      case 'sad': 
      case 'sadness':
        return { 
          color: '#3b82f6', 
          rotationSpeed: 40, 
          pulseSpeed: 4, 
          scale: 0.9,
          glowIntensity: '0 0 15px rgba(59, 130, 246, 0.3)'
        };
      case 'humble':
        return {
          color: '#10b981', // Emerald/Green for humble/peaceful
          rotationSpeed: 30,
          pulseSpeed: 3,
          scale: 0.95,
          glowIntensity: '0 0 20px rgba(16, 185, 129, 0.4)'
        };
      case 'confused': 
        return { 
          color: '#fbbf24', 
          rotationSpeed: 5, 
          pulseSpeed: 0.5, 
          scale: 1.05,
          glowIntensity: '0 0 25px rgba(251, 191, 36, 0.5)'
        };
      case 'thinking': 
        return { 
          color: '#a855f7', 
          rotationSpeed: 2, 
          pulseSpeed: 1, 
          scale: 1,
          glowIntensity: '0 0 40px rgba(168, 85, 247, 0.7)'
        };
      default: 
        return { 
          color: baseColor, 
          rotationSpeed: 20, 
          pulseSpeed: 2, 
          scale: 1,
          glowIntensity: `0 0 20px ${baseColor}66`
        };
    }
  };

  const config = getEmotionConfig();
  const color = config.color;

  return (
    <div className="relative flex items-center justify-center w-96 h-96">
      {/* Background Aura */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: isSpeaking ? [0.1, 0.3, 0.1] : [0.05, 0.15, 0.05]
        }}
        transition={{ repeat: Infinity, duration: config.pulseSpeed }}
        className="absolute inset-0 rounded-full blur-[100px]"
        style={{ backgroundColor: color }}
      />

      {/* Outer Rotating HUD Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: config.rotationSpeed, ease: "linear" }}
        className="absolute inset-0 border-[3px] border-dashed rounded-full opacity-20"
        style={{ borderColor: color, boxShadow: config.glowIntensity }}
      />
      
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: config.rotationSpeed * 1.5, ease: "linear" }}
        className="absolute inset-8 border border-dotted rounded-full opacity-40"
        style={{ borderColor: color }}
      />

      {/* Hexagonal Grid Pattern (Subtle) */}
      <div className="absolute inset-16 rounded-full overflow-hidden opacity-10 pointer-events-none"
           style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 1px, transparent 0)`, backgroundSize: '12px 12px' }} />
      
      {/* HUD Compass Elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-6 rounded-full"
            style={{ 
              backgroundColor: color,
              opacity: i % 6 === 0 ? 0.6 : 0.2,
              transform: `rotate(${i * 15}deg) translateY(-160px)` 
            }}
            animate={isSpeaking ? {
              scaleY: [1, 2, 1],
              opacity: [0.2, 0.8, 0.2]
            } : {}}
            transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.02 }}
          />
        ))}
      </div>

      {/* Core Arc Reactor Structure */}
      <motion.div 
        animate={{ scale: config.scale }}
        className="relative w-56 h-56 flex items-center justify-center"
      >
        {/* Core Glow */}
        <motion.div 
          animate={{ 
            scale: isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
            opacity: isSpeaking ? [0.4, 0.8, 0.4] : [0.2, 0.5, 0.2]
          }}
          transition={{ repeat: Infinity, duration: config.pulseSpeed }}
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ backgroundColor: color }}
        />

        {/* Central Core Housing */}
        <div className="relative w-40 h-40 rounded-full border-2 flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md shadow-[inset_0_0_50px_rgba(0,242,255,0.1)]"
             style={{ borderColor: `${color}33` }}>
          
          {/* Dynamic Visualizer / Emotion Core */}
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.div 
                key="speaking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [8, Math.random() * 60 + 20, 8],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.05 }}
                    className="w-2 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key={emotion}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="flex flex-col items-center justify-center"
              >
                {emotion === 'confused' && (
                  <motion.div 
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-6xl font-display font-bold muse-glow"
                    style={{ color }}
                  >?</motion.div>
                )}
                {emotion === 'thinking' && (
                  <div className="relative w-24 h-24">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{ repeat: Infinity, duration: 3, delay: i * 1 }}
                        className="absolute inset-0 border-2 rounded-full"
                        style={{ borderColor: color, borderTopColor: 'transparent' }}
                      />
                    ))}
                  </div>
                )}
                {(emotion === 'happy' || emotion === 'happiness' || emotion === 'smile') && (
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      y: [0, -5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex gap-8">
                      <motion.div 
                        animate={emotion === 'smile' ? { scaleY: [1, 0.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color }} 
                      />
                      <motion.div 
                        animate={emotion === 'smile' ? { scaleY: [1, 0.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color }} 
                      />
                    </div>
                    <motion.div 
                      animate={emotion === 'happiness' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-16 h-8 border-b-4 rounded-full" 
                      style={{ borderColor: color }} 
                    />
                  </motion.div>
                )}
                {(emotion === 'sad' || emotion === 'sadness') && (
                  <motion.div 
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="flex gap-8">
                      <div className="w-3 h-1 rounded-full" style={{ backgroundColor: color }} />
                      <div className="w-3 h-1 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                    <div className="w-16 h-8 border-t-4 rounded-full opacity-50" style={{ borderColor: color }} />
                  </motion.div>
                )}
                {emotion === 'humble' && (
                  <motion.div 
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex gap-6">
                      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color, transform: 'rotate(10deg)' }} />
                      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color, transform: 'rotate(-10deg)' }} />
                    </div>
                    <div className="w-10 h-0.5 rounded-full opacity-60" style={{ backgroundColor: color }} />
                  </motion.div>
                )}
                {emotion === 'neutral' && (
                  <motion.div 
                    animate={{ width: [40, 60, 40] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="h-1 rounded-full opacity-40"
                    style={{ backgroundColor: color }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HUD Brackets (Corner Accents) */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="absolute inset-[-20px] pointer-events-none"
        >
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: color }} />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: color }} />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: color }} />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: color }} />
        </motion.div>
      </motion.div>
    </div>
  );
};
