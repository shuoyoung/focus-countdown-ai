import React, { useState, useEffect, useRef } from 'react';
import { Exam, WidgetSettings, Quote, Position, DisplayMode, ThemeColor } from './types';
import { DEFAULT_EXAMS, DEFAULT_SETTINGS, DEFAULT_QUOTES } from './constants';
import WidgetDisplay from './components/WidgetDisplay';
import SettingsPanel from './components/SettingsPanel';

// Background Image for Simulation
const WALLPAPER_URL = "https://picsum.photos/1920/1080?blur=2";

const App: React.FC = () => {
  // --- STATE ---
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('fc_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Remove Pinyin if it exists in previously saved default exams
        return parsed.map((e: Exam) => {
          if (e.id === 'gaokao' && e.name.includes('(Gaokao)')) return { ...e, name: '高考' };
          if (e.id === 'zhongkao' && e.name.includes('(Zhongkao)')) return { ...e, name: '中考' };
          return e;
        });
      } catch (e) {
        return DEFAULT_EXAMS;
      }
    }
    return DEFAULT_EXAMS;
  });

  const [settings, setSettings] = useState<WidgetSettings>(() => {
    const saved = localStorage.getItem('fc_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default settings to ensure new properties (quoteSource, customQuotes) exist if missing
        return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  });

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    const saved = localStorage.getItem('fc_selected_exam');
    if (saved) return saved;
    const defaultExam = exams.find(e => e.isDefault);
    return defaultExam ? defaultExam.id : exams[0]?.id || '';
  });

  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem('fc_position');
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  });

  const [quote, setQuote] = useState<Quote | null>(() => {
      const saved = localStorage.getItem('fc_current_quote');
      return saved ? JSON.parse(saved) : DEFAULT_QUOTES[0];
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem('fc_exams', JSON.stringify(exams)), [exams]);
  useEffect(() => localStorage.setItem('fc_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('fc_selected_exam', selectedExamId), [selectedExamId]);
  useEffect(() => localStorage.setItem('fc_position', JSON.stringify(position)), [position]);
  useEffect(() => localStorage.setItem('fc_current_quote', JSON.stringify(quote)), [quote]);


  // --- HANDLERS ---
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag if locked, clicking buttons, or settings are open
    if (settings.isLocked || isSettingsOpen) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    // Simple boundary check (optional, but good for UX)
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleLock = () => {
    setSettings(prev => ({ ...prev, isLocked: !prev.isLocked }));
  };

  // --- RENDER ---
  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none font-sans text-gray-900"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Simulated Desktop Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
      />
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

      {/* 2. Instructions Overlay (For demo purposes) */}
      <div className="absolute bottom-8 left-8 z-0 text-white/50 text-xs pointer-events-none">
        <p>Focus Countdown MVP v1.0</p>
        <p>Simulating Windows Desktop Widget Environment</p>
      </div>

      {/* 3. The Widget */}
      <div
        className={`absolute z-10 ${settings.isLocked ? '' : 'cursor-move'}`}
        style={{ 
          left: position.x, 
          top: position.y,
          // If click-through is enabled, the container ignores pointer events, 
          // but we need a wrapper to catch the click for the 'Unlock' mechanism if we were building the native app.
          // For this web demo, we handle logic inside WidgetDisplay.
        }}
        onMouseDown={handleMouseDown}
      >
        <WidgetDisplay 
          settings={settings}
          exam={activeExam}
          quote={quote}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleLock={toggleLock}
          onUpdateQuote={setQuote}
        />
      </div>

      {/* 4. Settings Modal */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        exams={exams}
        onExamsChange={setExams}
        selectedExamId={selectedExamId}
        onSelectExam={setSelectedExamId}
      />

    </div>
  );
};

export default App;