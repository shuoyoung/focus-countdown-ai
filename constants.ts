
import { Exam, Quote, ThemeColor, DisplayMode, WidgetSettings } from './types';

export const DEFAULT_QUOTES: Quote[] = [
  { text: "The future depends on what you do today.", source: "Mahatma Gandhi" },
  { text: "Believe you can and you're halfway there.", source: "Theodore Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", source: "Sam Levenson" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", source: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", source: "Zig Ziglar" },
];

export const DEFAULT_SETTINGS: WidgetSettings = {
  displayMode: DisplayMode.Standard,
  cardWidth: 320,
  fontSizeScale: 1,
  textColor: ThemeColor.White,
  backgroundColor: '#000000',
  bgOpacity: 20,
  showDate: true,
  showQuote: true,
  quoteSource: 'default',
  customQuotes: [
    { text: "加油，你是最棒的！", source: "自己" }
  ],
  isLocked: false,
  isClickThrough: false,
  alwaysOnTop: true,
  quoteUpdateFreq: 'daily',
};

// Calculate next Gaokao (June 7th)
const today = new Date();
let gaokaoYear = today.getFullYear();
const currentGaokaoDate = new Date(gaokaoYear, 5, 7); // Month is 0-indexed (5 = June)
if (today > currentGaokaoDate) {
  gaokaoYear += 1;
}

export const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'gaokao',
    name: '高考',
    date: `${gaokaoYear}-06-07`,
    isDefault: true,
  },
  {
    id: 'zhongkao',
    name: '中考',
    date: `${today.getFullYear()}-06-20`, // Estimated
  },
];
