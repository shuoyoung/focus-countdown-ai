export enum DisplayMode {
  Standard = 'STANDARD',
  Minimal = 'MINIMAL',
}

export enum ThemeColor {
  White = 'text-white',
  Black = 'text-gray-900',
  Red = 'text-red-500',
  Blue = 'text-blue-500',
  Green = 'text-emerald-500',
  Gray = 'text-gray-400',
  Yellow = 'text-yellow-400',
}

export type QuoteSource = 'ai' | 'default' | 'custom';

export interface Exam {
  id: string;
  name: string;
  date: string; // ISO Date string YYYY-MM-DD
  isDefault?: boolean;
}

export interface WidgetSettings {
  displayMode: DisplayMode;
  fontSizeScale: number; // 0.5 to 2.0
  textColor: ThemeColor;
  bgOpacity: number; // 0 to 100
  showDate: boolean;
  showQuote: boolean;
  quoteSource: QuoteSource;
  customQuotes: Quote[];
  isLocked: boolean; // Position locked
  isClickThrough: boolean; // Visual simulation of click-through
  quoteUpdateFreq: 'daily' | 'random';
}

export interface Quote {
  text: string;
  source?: string;
}

export interface Position {
  x: number;
  y: number;
}