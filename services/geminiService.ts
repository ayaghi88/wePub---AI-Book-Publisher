
import { GoogleGenAI, Type } from "@google/genai";
import { BookMetadata, Chapter, StorySettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processBookContent = async (
  rawText: string, 
  settings?: StorySettings
): Promise<{ chapters: Chapter[], metadata: Partial<BookMetadata> }> => {
  const settingsPrompt = settings ? `
    STORY PLANNING OVERRIDE:
    - Target number of chapters: ${settings.targetChapters}
    - Story Direction: ${settings.direction}
    - Key Characters: ${settings.characters.map(c => `${c.name} (Traits: ${c.traits}): ${c.description}`).join('; ')}
    
    STRICT LENGTH REQUIREMENT: Every single chapter generated must be a FULL-LENGTH chapter. 
    A chapter MUST consist of at least 20 substantial, detailed paragraphs. 
    Do not summarize. Use immersive, slow-burn, descriptive prose. 
    If the source material is short, you MUST expand the narrative with internal monologues, vivid environmental descriptions, and secondary character interactions to reach the 20-paragraph minimum.
  ` : '';

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `You are an elite novelist. Convert the following text into a professionally structured book. 
    ${settingsPrompt}
    
    CRITICAL INSTRUCTIONS:
    1. Identify the book title and author if present in the text.
    2. Split content into exactly ${settings?.targetChapters || 'logical'} chapters. 
    3. Ensure characters match the provided character list if applicable.
    4. Provide a compelling summary for metadata.
    5. MANDATORY: Every chapter MUST be at least 20 paragraphs long. Expand the scenes significantly. 
    6. Return the data in valid JSON format according to the schema.
    
    Text: ${rawText.substring(0, 35000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          description: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING, description: "Full chapter text. Must be at least 20 paragraphs long." }
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["chapters"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    metadata: {
      title: data.title || "",
      author: data.author || "",
      description: data.description || ""
    },
    chapters: (data.chapters || []).map((ch: any, index: number) => ({
      id: `chapter-${index}-${Date.now()}`,
      title: ch.title || `Chapter ${index + 1}`,
      content: ch.content
    }))
  };
};

export const refineChapter = async (chapterContent: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a professional book editor. Polish the following chapter. 
    - Fix all grammar and punctuation errors.
    - Improve narrative flow and vocabulary.
    - IMPORTANT: DO NOT shorten the text. Instead, elaborate on the scenes and descriptions.
    - Ensure there are at least 20 distinct paragraphs. 
    - Use clear double-newlines between paragraphs.
    
    Content: ${chapterContent}`,
  });
  return response.text || chapterContent;
};

export const continueWriting = async (
  context: string, 
  prompt: string, 
  settings?: StorySettings
): Promise<string> => {
  const settingsPrompt = settings ? `
    STORY CONTEXT:
    - Overall Direction: ${settings.direction}
    - Active Characters: ${settings.characters.map(c => `${c.name} (${c.traits})`).join(', ')}
    - PROSE STYLE: Highly descriptive, cinematic, detailed.
  ` : '';

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Continue the story from the context provided below. 
    
    CRITICAL: You MUST write AT LEAST 20 detailed paragraphs. 
    Focus on world-building, sensory details (sights, sounds, smells), and the psychological state of the characters. 
    Ensure the writing is 100% original and high-quality fiction.
    
    ${settingsPrompt}
    
    Context: ${context.slice(-8000)}
    Instruction for next sequence: ${prompt}
    
    Write the next 20+ paragraphs:`,
  });
  return response.text || "";
};

export const verifyOriginality = async (text: string): Promise<{ isOriginal: boolean, score: number, report: string }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text for plagiarism and originality. Provide a score from 0-100 (100 is perfectly unique).
    
    Text: ${text.substring(0, 10000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isOriginal: { type: Type.BOOLEAN },
          score: { type: Type.NUMBER },
          report: { type: Type.STRING }
        },
        required: ["isOriginal", "score", "report"]
      }
    }
  });
  return JSON.parse(response.text || '{"isOriginal": true, "score": 100, "report": "Unknown"}');
};
