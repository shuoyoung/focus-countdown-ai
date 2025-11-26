
import React, { useState, useEffect, useRef } from 'react';
import { Exam, WidgetSettings, Quote, Position } from './types';
import { DEFAULT_EXAMS, DEFAULT_SETTINGS, DEFAULT_QUOTES } from './constants';
import WidgetDisplay from './components/WidgetDisplay';
import SettingsPanel from './components/SettingsPanel';

// Background Image for Simulation (Only used in Web Mode)
const WALLPAPER_URL = "https://picsum.photos/1920/1080?blur=2";

const App: React.FC = () => {
  // --- DETECT ENVIRONMENT ---
  const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
  const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

  // --- STATE ---
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('fc_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  // --- ELECTRON EFFECTS ---
  useEffect(() => {
    if (isElectron && ipcRenderer) {
      ipcRenderer.send('set-always-on-top', settings.alwaysOnTop);
    }
  }, [settings.alwaysOnTop, isElectron, ipcRenderer]);

  // --- HANDLERS ---
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.isLocked || isSettingsOpen) return;
    // Don't drag if clicking a button
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

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleLock = () => {
    setSettings(prev => ({ ...prev, isLocked: !prev.isLocked }));
  };

  // --- ELECTRON MOUSE PASSTHROUGH LOGIC ---
  // When mouse enters the widget or settings, we capture events.
  // When mouse leaves, we let them pass through to desktop.
  const handleMouseEnterWidget = () => {
    if (isElectron && ipcRenderer) {
      ipcRenderer.send('set-ignore-mouse-events', false);
    }
  };

  const handleMouseLeaveWidget = () => {
    if (isElectron && ipcRenderer) {
      // If we are dragging or settings are open, do NOT let mouse pass through
      if (!isDragging && !isSettingsOpen) {
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      }
    }
  };

  // If settings open, always capture
  useEffect(() => {
    if (isElectron && ipcRenderer) {
        if (isSettingsOpen) {
             ipcRenderer.send('set-ignore-mouse-events', false);
        } else {
             // Reset to pass-through if not hovering (handled by mouse leave)
             // But we need to ensure we don't get stuck in capture mode
             // We rely on the MouseLeave of the widget container
        }
    }
  }, [isSettingsOpen, isElectron, ipcRenderer]);

  // --- RENDER ---
  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden select-none font-sans ${isElectron ? 'bg-transparent' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. Wallpaper: Only show in Web Mode, strictly hidden in Electron */}
      {!isElectron && (
        <>
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />
          <div className="absolute bottom-8 left-8 z-0 text-white/50 text-xs pointer-events-none">
            <p>Focus Countdown Web Simulator</p>
          </div>
        </>
      )}

      {/* 
        2. The Widget Container 
        This is the interaction zone. 
      */}
      <div
        className={`absolute z-10 ${settings.isLocked ? '' : 'cursor-move'}`}
        style={{ 
          left: position.x, 
          top: position.y,
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnterWidget}
        onMouseLeave={handleMouseLeaveWidget}
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

      {/* 
        3. Settings Modal 
        Rendered absolutely in the center of the screen (overlay).
      */}
      {isSettingsOpen && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            // Ensure mouse events are captured when settings are open
            onMouseEnter={handleMouseEnterWidget} 
        >
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
      )}
    </div>
  );
};

export default App;
