import React, { useState, useEffect, useRef } from 'react';
import { Exam, WidgetSettings, Quote, Position } from './types';
import { DEFAULT_EXAMS, DEFAULT_SETTINGS, DEFAULT_QUOTES } from './constants';
import WidgetDisplay from './components/WidgetDisplay';
import SettingsPanel from './components/SettingsPanel';
import { RotateCcw, XCircle, Power } from 'lucide-react';

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

  // Position is only used in Web Mode simulation
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem('fc_position');
    return saved ? JSON.parse(saved) : { x: 50, y: 50 };
  });

  const [quote, setQuote] = useState<Quote | null>(() => {
      const saved = localStorage.getItem('fc_current_quote');
      return saved ? JSON.parse(saved) : DEFAULT_QUOTES[0];
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  // Dragging State (Web Mode Only)
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const appContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-resize Electron window based on content
  useEffect(() => {
    if (isElectron && ipcRenderer && appContainerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
           const width = Math.ceil(entry.contentRect.width);
           const height = Math.ceil(entry.contentRect.height);
           // Ensure we send a reasonable size, accounting for padding/shadows if needed
           if (width > 0 && height > 0) {
             ipcRenderer.send('resize-window', { width, height });
           }
        }
      });
      observer.observe(appContainerRef.current);
      return () => observer.disconnect();
    }
  }, [isElectron, ipcRenderer, isSettingsOpen, settings.fontSizeScale, settings.cardWidth]);

  // --- HANDLERS ---
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const toggleLock = () => {
    setSettings(prev => ({ ...prev, isLocked: !prev.isLocked }));
  };

  // Right Click Menu Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSettingsOpen) {
        setContextMenu({ visible: true, x: e.pageX, y: e.pageY });
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleResetApp = () => {
      localStorage.clear();
      if (ipcRenderer) {
          ipcRenderer.send('app-relaunch');
      } else {
          window.location.reload();
      }
  };

  const handleQuitApp = () => {
      if (ipcRenderer) ipcRenderer.send('close-app');
  };

  // --- WEB MODE DRAGGING ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) setContextMenu(null);
    if (isElectron) return; // Electron uses CSS dragging
    if (settings.isLocked || isSettingsOpen) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.no-drag')) return;

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

  // --- RENDER ---

  const ContextMenu = () => {
      if (!contextMenu) return null;
      return (
          <div 
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48 text-sm select-none"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">Troubleshooting</div>
              <button 
                onClick={handleResetApp}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                  <RotateCcw size={14} /> Reset All Settings
              </button>
              <button 
                onClick={handleQuitApp}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
              >
                  <Power size={14} /> Quit Application
              </button>
              <button 
                onClick={closeContextMenu}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-500 flex items-center gap-2 border-t border-gray-100"
              >
                  <XCircle size={14} /> Close Menu
              </button>
          </div>
      );
  };

  // 1. ELECTRON MODE: Minimal container
  if (isElectron) {
    return (
      <div 
        ref={appContainerRef} 
        onContextMenu={handleContextMenu}
        onClick={closeContextMenu}
        className="inline-block relative p-6"
        // CRITICAL FIX: Windows needs a non-zero opacity surface to capture mouse events.
        // transparent/0 opacity passes events through to desktop.
        // 0.01 opacity is invisible to user but solid to OS.
        style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} 
      >
        <ContextMenu />
        
        {isSettingsOpen ? (
          <SettingsPanel
            isOpen={true} // Always "open" in this view
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={setSettings}
            exams={exams}
            onExamsChange={setExams}
            selectedExamId={selectedExamId}
            onSelectExam={setSelectedExamId}
            isEmbedded={true}
          />
        ) : (
          <WidgetDisplay 
            settings={settings}
            exam={activeExam}
            quote={quote}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleLock={toggleLock}
            onUpdateQuote={setQuote}
            isElectron={true}
          />
        )}
      </div>
    );
  }

  // 2. WEB MODE: Desktop Simulator
  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      <ContextMenu />

      {/* Simulation Wallpaper */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
      />
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />
      <div className="absolute bottom-8 left-8 z-0 text-white/50 text-xs pointer-events-none">
        <p>Focus Countdown Web Simulator</p>
        <p>Right-click widget to reset</p>
      </div>

      {/* Draggable Widget */}
      <div
        className={`absolute z-10 ${settings.isLocked ? '' : 'cursor-move'}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <WidgetDisplay 
          settings={settings}
          exam={activeExam}
          quote={quote}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleLock={toggleLock}
          onUpdateQuote={setQuote}
          isElectron={false}
        />
      </div>

      {/* Settings Overlay (Modal style for web) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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