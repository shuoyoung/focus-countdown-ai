import React, { useState } from 'react';
import { WidgetSettings, Exam, ThemeColor, DisplayMode, Quote } from '../types';
import { X, Plus, Trash2, RotateCcw, Monitor } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WidgetSettings;
  onSettingsChange: (newSettings: WidgetSettings) => void;
  exams: Exam[];
  onExamsChange: (newExams: Exam[]) => void;
  selectedExamId: string;
  onSelectExam: (id: string) => void;
  isEmbedded?: boolean; // If true, renders as a standalone card (no modal overlay)
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  exams,
  onExamsChange,
  selectedExamId,
  onSelectExam,
  isEmbedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'appearance' | 'quotes' | 'advanced'>('exams');
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');

  if (!isOpen) return null;

  const handleAddExam = () => {
    if (!newExamName || !newExamDate) return;
    const newExam: Exam = {
      id: Date.now().toString(),
      name: newExamName,
      date: newExamDate,
    };
    onExamsChange([...exams, newExam]);
    setNewExamName('');
    setNewExamDate('');
  };

  const handleDeleteExam = (id: string) => {
    const updated = exams.filter(e => e.id !== id);
    onExamsChange(updated);
    if (selectedExamId === id && updated.length > 0) {
      onSelectExam(updated[0].id);
    }
  };

  const updateSetting = <K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleAddQuote = () => {
    if (!newQuoteText) return;
    const newQuote: Quote = { text: newQuoteText, source: newQuoteSource || undefined };
    updateSetting('customQuotes', [...(settings.customQuotes || []), newQuote]);
    setNewQuoteText('');
    setNewQuoteSource('');
  };

  const handleDeleteQuote = (index: number) => {
    const updated = settings.customQuotes.filter((_, i) => i !== index);
    updateSetting('customQuotes', updated);
  };

  // Outer container class: If embedded, standard width/height; if modal, fixed overlay
  const containerClass = isEmbedded 
    ? "w-[340px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[400px]" 
    : "w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]";

  return (
    <div className={containerClass}>
        {/* Header - Draggable in Electron */}
        <div 
          className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <h2 className="text-lg font-bold text-gray-800 select-none">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs - No Drag */}
        <div 
          className="flex border-b border-gray-100 overflow-x-auto shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {(['exams', 'appearance', 'quotes', 'advanced'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content - No Drag */}
        <div 
          className="flex-1 overflow-y-auto p-5 space-y-6"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          
          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Select Active Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => onSelectExam(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id} className="text-gray-900">
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Manage Exams</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {exams.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <div>
                        <div className="font-medium text-gray-800">{exam.name}</div>
                        <div className="text-xs text-gray-500">{exam.date}</div>
                      </div>
                      {!exam.isDefault && (
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Add New Exam</div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    className="w-full p-2 text-sm text-gray-900 border border-blue-200 rounded focus:outline-none focus:border-blue-400 placeholder-gray-500"
                  />
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full p-2 text-sm text-gray-900 border border-blue-200 rounded focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={handleAddExam}
                    disabled={!newExamName || !newExamDate}
                    className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Exam
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Display Mode */}
              <div className="grid grid-cols-2 gap-3">
                 <button
                   onClick={() => updateSetting('displayMode', DisplayMode.Standard)}
                   className={`p-3 border rounded-lg text-sm text-center transition-all ${
                     settings.displayMode === DisplayMode.Standard 
                       ? 'border-blue-500 bg-blue-50 text-blue-700' 
                       : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                   }`}
                 >
                   Standard
                 </button>
                 <button
                   onClick={() => updateSetting('displayMode', DisplayMode.Minimal)}
                   className={`p-3 border rounded-lg text-sm text-center transition-all ${
                     settings.displayMode === DisplayMode.Minimal 
                       ? 'border-blue-500 bg-blue-50 text-blue-700' 
                       : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                   }`}
                 >
                   Minimal
                 </button>
              </div>

              {/* Card Width */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Window Width ({settings.cardWidth}px)
                </label>
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="10"
                  value={settings.cardWidth}
                  onChange={(e) => updateSetting('cardWidth', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Text Color */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Text Color</label>
                <div className="flex gap-2">
                  {[ThemeColor.White, ThemeColor.Black, ThemeColor.Red, ThemeColor.Blue, ThemeColor.Green, ThemeColor.Yellow].map((color) => {
                     let bgClass = '';
                     switch(color) {
                        case ThemeColor.White: bgClass = 'bg-gray-100 border-2 border-gray-300'; break;
                        case ThemeColor.Black: bgClass = 'bg-gray-900'; break;
                        case ThemeColor.Red: bgClass = 'bg-red-500'; break;
                        case ThemeColor.Blue: bgClass = 'bg-blue-500'; break;
                        case ThemeColor.Green: bgClass = 'bg-emerald-500'; break;
                        case ThemeColor.Yellow: bgClass = 'bg-yellow-400'; break;
                        default: bgClass = 'bg-gray-400';
                     }
                     return (
                      <button
                        key={color}
                        onClick={() => updateSetting('textColor', color)}
                        className={`w-8 h-8 rounded-full ${bgClass} ${settings.textColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      />
                     );
                  })}
                </div>
              </div>

              {/* Background Color & Opacity */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Background Color</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={settings.backgroundColor || '#000000'}
                            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                            className="w-full h-10 p-1 rounded border border-gray-200 cursor-pointer"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Opacity ({settings.bgOpacity}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={settings.bgOpacity}
                      onChange={(e) => updateSetting('bgOpacity', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3 accent-blue-600"
                    />
                 </div>
              </div>

              {/* Font Scale */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Size Scale ({settings.fontSizeScale}x)</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.fontSizeScale}
                  onChange={(e) => updateSetting('fontSizeScale', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* QUOTES TAB */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Quote Source</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <input
                      type="radio"
                      name="quoteSource"
                      checked={settings.quoteSource === 'default'}
                      onChange={() => updateSetting('quoteSource', 'default')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm text-gray-800 group-hover:text-gray-900">Built-in</div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <input
                      type="radio"
                      name="quoteSource"
                      checked={settings.quoteSource === 'ai'}
                      onChange={() => updateSetting('quoteSource', 'ai')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                     <div className="flex-1">
                        <div className="text-sm text-gray-800 flex items-center gap-1 group-hover:text-gray-900">AI Generated <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Online</span></div>
                     </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <input
                      type="radio"
                      name="quoteSource"
                      checked={settings.quoteSource === 'custom'}
                      onChange={() => updateSetting('quoteSource', 'custom')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm text-gray-800 group-hover:text-gray-900">Custom</div>
                  </label>
                </div>
              </div>

              {settings.quoteSource === 'custom' && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Quotes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
                    <textarea
                      placeholder="Enter quote..."
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      className="w-full p-2 text-sm text-gray-900 border border-gray-200 rounded focus:outline-none focus:border-blue-400 min-h-[60px] placeholder-gray-500"
                    />
                    <button
                      onClick={handleAddQuote}
                      disabled={!newQuoteText}
                      className="w-full py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-900 disabled:opacity-50"
                    >
                      <Plus size={16} className="inline mr-1" /> Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {settings.customQuotes?.map((quote, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-white border border-gray-100 rounded-lg group">
                        <div className="text-sm text-gray-800 pr-2">{quote.text}</div>
                        <button onClick={() => handleDeleteQuote(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADVANCED TAB */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
               {/* ALWAYS ON TOP (Electron) */}
               <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-indigo-600" />
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">Always on Top</span>
                        <span className="text-xs text-gray-500">Keep window above others (Desktop only)</span>
                    </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.alwaysOnTop}
                  onChange={(e) => updateSetting('alwaysOnTop', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Show Date</span>
                <input
                  type="checkbox"
                  checked={settings.showDate}
                  onChange={(e) => updateSetting('showDate', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded accent-blue-600"
                />
              </div>

               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Show Quote</span>
                <input
                  type="checkbox"
                  checked={settings.showQuote}
                  onChange={(e) => updateSetting('showQuote', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - No Drag */}
        <div 
          className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
            <button
                onClick={() => {
                    onSettingsChange({ 
                        ...settings, 
                        fontSizeScale: 1, 
                        textColor: ThemeColor.White, 
                        bgOpacity: 20,
                        cardWidth: 320,
                        backgroundColor: '#000000'
                    });
                }}
                className="mr-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
                <RotateCcw size={14} /> Reset
            </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
    </div>
  );
};

export default SettingsPanel;