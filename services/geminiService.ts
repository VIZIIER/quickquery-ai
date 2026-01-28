
import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

export const performSearch = async (query: string): Promise<{ answer: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a concise, helpful search assistant. Provide accurate answers based on the latest available information. Use clear formatting and bullet points where appropriate.",
      },
    });

    const answer = response.text || "I couldn't find a direct answer for that. Could you try rephrasing?";
    
    // Extract grounding chunks for citations
    const sources: GroundingSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri,
          });
        }
      });
    }

    // Deduplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { answer, sources: uniqueSources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Failed to retrieve information. Please try again later.");
  }
};
