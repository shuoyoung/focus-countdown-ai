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
  const [isHovered, setIsHovered] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Time Calculation
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      // Reset hours to start of day for cleaner day calculation
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const examDate = new Date(exam.date);
      // Ensure exam date is treated as local midnight
      const examDateStart = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate() + 1); // +1 because inputs are usually 00:00

      const diffTime = examDateStart.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [exam.date]);

  // Quote Refresh Handler
  const handleRefreshQuote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingQuote(true);

    if (settings.quoteSource === 'custom') {
        // Pick from custom quotes
        const pool = settings.customQuotes && settings.customQuotes.length > 0 ? settings.customQuotes : DEFAULT_QUOTES;
        const random = pool[Math.floor(Math.random() * pool.length)];
        onUpdateQuote(random);
        setLoadingQuote(false);
    } else if (settings.quoteSource === 'ai') {
        // Fetch from AI
        const newQuote = await fetchMotivationalQuote();
        if (newQuote) {
            onUpdateQuote(newQuote);
        } else {
            // Fallback to default
            const random = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];
            onUpdateQuote(random);
        }
        setLoadingQuote(false);
    } else {
        // Default source
        const random = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];
        onUpdateQuote(random);
        setLoadingQuote(false);
    }
  };

  // Styles Construction
  const containerStyle: React.CSSProperties = {
    backgroundColor: `rgba(0, 0, 0, ${settings.bgOpacity / 100})`,
    backdropFilter: settings.bgOpacity > 0 ? 'blur(8px)' : 'none',
    transform: `scale(${settings.fontSizeScale})`,
    transformOrigin: 'top left', // Scale from corner
  };

  const isMinimal = settings.displayMode === DisplayMode.Minimal;

  // Conditional Rendering Logic
  return (
    <div
      className={`relative rounded-xl transition-all duration-300 group select-none ${
        settings.isClickThrough ? 'pointer-events-none' : ''
      }`}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Border for ClickThrough Mode to show it exists */}
      {settings.isClickThrough && (
        <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-xl pointer-events-none" />
      )}

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center ${isMinimal ? 'p-4' : 'px-8 py-6'}`}>
        
        {/* Exam Name */}
        <h2 className={`font-serif font-bold tracking-wide opacity-90 ${settings.textColor} ${isMinimal ? 'text-lg' : 'text-xl mb-1'}`}>
          {exam.name}
        </h2>

        {/* Countdown Number */}
        <div className={`font-sans font-black leading-none ${settings.textColor} ${isMinimal ? 'text-4xl' : 'text-7xl my-2'}`}>
          {daysLeft > 0 ? daysLeft : 0}
        </div>

        {/* Label */}
        <div className={`text-sm uppercase tracking-[0.2em] opacity-75 font-medium ${settings.textColor}`}>
            {daysLeft >= 0 ? 'Days Left' : 'Days Passed'}
        </div>

        {/* Standard Mode Extras */}
        {!isMinimal && (
            <>
                {settings.showDate && (
                    <div className={`mt-4 text-xs font-mono opacity-60 ${settings.textColor}`}>
                        Target: {exam.date}
                    </div>
                )}
                
                {settings.showQuote && quote && (
                    <div className={`mt-4 pt-4 border-t border-white/10 max-w-[240px] text-center ${settings.textColor}`}>
                        <p className="text-xs font-serif italic leading-relaxed opacity-90">"{quote.text}"</p>
                    </div>
                )}
            </>
        )}
      </div>

      {/* Controls Overlay (Only visible on hover and NOT in click-through mode, OR if a special 'unlock' handle is used) */}
      <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-200 ${
        (isHovered && !settings.isClickThrough) || (settings.isClickThrough && isHovered) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        
        {/* In ClickThrough mode, we need a specific handle to grab settings or unlock */}
        {settings.isClickThrough && (
             <div className="absolute -top-6 right-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded-t">
                 Click-Through Active
             </div>
        )}

        {/* Refresh Quote Button */}
        {!isMinimal && settings.showQuote && (
             <button 
                onClick={handleRefreshQuote}
                className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors ${loadingQuote ? 'animate-spin' : ''}`}
                title={settings.quoteSource === 'ai' ? "New AI Quote" : "Next Quote"}
             >
                {settings.quoteSource === 'ai' ? <Sparkles size={14} /> : <RefreshCw size={14} />}
             </button>
        )}

        <button
          onClick={onToggleLock}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          title={settings.isLocked ? "Unlock Position" : "Lock Position"}
        >
          {settings.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};

export default WidgetDisplay;