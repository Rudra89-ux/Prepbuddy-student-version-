import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateQuestions(subject: string, chapter: string, count: number = 5, existingQuestions: string[] = []) {
  const prompt = `Generate ${count} HIGH-QUALITY, UNIQUE MCQ questions for CBSE Class 10 ${subject}, Chapter: ${chapter}.
  
  STRICT RULES:
  1. ONLY MCQ (Multiple Choice) questions.
  2. Use LaTeX (wrapped in $ or $$) for all math symbols and formulas. Escape backslashes for valid JSON (e.g. \\\\frac).
  3. Ensure exactly 4 options.
  4. Ensure the correctAnswer exactly matches one of the options.
  5. Provide a clear step-by-step explanation.
  
  Return a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["mcq"], description: "Always 'mcq'" },
              questionText: { type: Type.STRING, description: "The MCQ question text with LaTeX symbols if needed" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 distinct options"
              },
              correctAnswer: { type: Type.STRING, description: "The exact string of the correct option" },
              explanation: { type: Type.STRING, description: "Step-by-step reasoning for the correct answer" }
            },
            required: ["type", "questionText", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error on text:", text);
      // Fallback: try to fix common LaTeX escape issues if JSON.parse fails
      const fixedText = text.replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
      return JSON.parse(fixedText);
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}
