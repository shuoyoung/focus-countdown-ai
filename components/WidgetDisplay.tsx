
import React, { useEffect, useState } from 'react';
import { WidgetSettings, Exam, DisplayMode, Quote } from '../types';
import { Settings, Lock, Unlock, Sparkles, RefreshCw } from 'lucide-react';
import { fetchMotivationalQuote } from '../services/geminiService';
import { DEFAULT_QUOTES } from '../constants';

interface WidgetDisplayProps {
  settings: WidgetSettings;
  exam: Exam;
  quote: Quote | null;
  onOpenSettings: () => void;
  onToggleLock: () => void;
  onUpdateQuote: (q: Quote) => void;
}

const WidgetDisplay: React.FC<WidgetDisplayProps> = ({
  settings,
  exam,
  quote,
  onOpenSettings,
  onToggleLock,
  onUpdateQuote
}) => {
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Time Calculation
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const examDate = new Date(exam.date);
      const examDateStart = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate() + 1);

      const diffTime = examDateStart.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [exam.date]);

  // Quote Refresh Handler
  const handleRefreshQuote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingQuote(true);

    if (settings.quoteSource === 'custom') {
        const pool = settings.customQuotes && settings.customQuotes.length > 0 ? settings.customQuotes : DEFAULT_QUOTES;
        const random = pool[Math.floor(Math.random() * pool.length)];
        onUpdateQuote(random);
        setLoadingQuote(false);
    } else if (settings.quoteSource === 'ai') {
        const newQuote = await fetchMotivationalQuote();
        if (newQuote) {
            onUpdateQuote(newQuote);
        } else {
            const random = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];
            onUpdateQuote(random);
        }
        setLoadingQuote(false);
    } else {
        const random = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];
        onUpdateQuote(random);
        setLoadingQuote(false);
    }
  };

  // Helper to process hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: `rgba(${hexToRgb(settings.backgroundColor || '#000000')}, ${settings.bgOpacity / 100})`,
    backdropFilter: settings.bgOpacity > 0 ? 'blur(8px)' : 'none',
    transform: `scale(${settings.fontSizeScale})`,
    transformOrigin: 'top left',
    width: `${settings.cardWidth}px`, 
    maxWidth: `${settings.cardWidth}px`,
  };

  const isMinimal = settings.displayMode === DisplayMode.Minimal;

  return (
    <div className="relative group">
      
      {/* 
        MAIN CONTENT
        isClickThrough: if true, this layer ignores pointer events.
        BUT the parent container in App.tsx handles the electron mouse forwarding.
        This 'pointer-events-none' is mainly for the visual feel in web mode or 
        ensuring clicks pass through to potential elements behind it if we weren't using the Electron mask.
      */}
      <div
        className={`rounded-xl transition-all duration-300 overflow-hidden ${
          settings.isClickThrough ? 'pointer-events-none' : ''
        }`}
        style={containerStyle}
      >
        <div className={`flex flex-col items-center justify-center ${isMinimal ? 'p-3' : 'px-6 py-5'}`}>
          {/* Exam Name - Forced wrap */}
          <h2 className={`font-serif font-bold tracking-wide opacity-90 text-center w-full whitespace-pre-wrap break-words ${settings.textColor} ${isMinimal ? 'text-lg' : 'text-xl mb-1'}`}>
            {exam.name}
          </h2>

          {/* Countdown */}
          <div className={`font-sans font-black leading-none ${settings.textColor} ${isMinimal ? 'text-4xl' : 'text-7xl my-2'}`}>
            {daysLeft > 0 ? daysLeft : 0}
          </div>

          <div className={`text-sm uppercase tracking-[0.2em] opacity-75 font-medium ${settings.textColor}`}>
              {daysLeft >= 0 ? 'Days Left' : 'Days Passed'}
          </div>

          {!isMinimal && (
              <>
                  {settings.showDate && (
                      <div className={`mt-3 text-xs font-mono opacity-60 ${settings.textColor}`}>
                          Target: {exam.date}
                      </div>
                  )}
                  
                  {settings.showQuote && quote && (
                      <div className={`mt-4 pt-4 border-t border-white/10 w-full text-center ${settings.textColor}`}>
                          {/* Quote Text - Enforce wrapping so it doesn't break fixed width */}
                          <p className="text-xs font-serif italic leading-relaxed opacity-90 whitespace-pre-wrap break-words">
                            "{quote.text}"
                          </p>
                      </div>
                  )}
              </>
          )}
        </div>
      </div>

      {/* 
        CONTROLS HITBOX 
        This is absolutely positioned relative to the widget.
        It must ALWAYS be clickable (pointer-events-auto), even if the widget body is pass-through.
      */}
      <div 
        className="absolute -top-3 -right-3 p-4 z-50 flex gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200"
        style={{ pointerEvents: 'auto' }} 
      >
        {/* Visual Pill Background */}
        <div className="absolute inset-2 bg-black/60 backdrop-blur-md rounded-full -z-10 shadow-lg border border-white/10"></div>

        <div className="flex gap-1 items-center justify-center relative z-10">
          {!isMinimal && settings.showQuote && (
               <button 
                  onClick={handleRefreshQuote}
                  className={`p-1.5 rounded-full hover:bg-white/20 text-white transition-colors ${loadingQuote ? 'animate-spin' : ''}`}
                  title="Next Quote"
               >
                  {settings.quoteSource === 'ai' ? <Sparkles size={14} /> : <RefreshCw size={14} />}
               </button>
          )}

          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded-full hover:bg-white/20 text-white transition-colors ${settings.isLocked ? 'text-red-400' : ''}`}
            title={settings.isLocked ? "Unlock" : "Lock"}
          >
            {settings.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default WidgetDisplay;
