import { GoogleGenAI } from "@google/genai";
import { Quote } from "../types";

const processEnvApiKey = process.env.API_KEY;

export const fetchMotivationalQuote = async (): Promise<Quote | null> => {
  if (!processEnvApiKey) {
    console.warn("Gemini API Key not found. Using offline quotes.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: processEnvApiKey });
    
    // We request a JSON response for structured data
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, powerful, single-sentence motivational quote for a student preparing for a major exam. Return it in JSON format with 'text' and 'source' (optional, put 'Unknown' if not a famous quote) fields.",
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const parsed = JSON.parse(jsonText);
    
    // Basic validation
    if (parsed.text) {
        return {
            text: parsed.text,
            source: parsed.source || 'AI Wisdom'
        };
    }
    return null;

  } catch (error) {
    console.error("Failed to fetch quote from Gemini:", error);
    return null;
  }
};
