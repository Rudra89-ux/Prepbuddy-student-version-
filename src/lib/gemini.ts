import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateQuestions(subject: string, chapter: string, count: number = 5, existingQuestions: string[] = []) {
  const prompt = `Generate ${count} HIGH-QUALITY, UNIQUE MCQ questions for CBSE Class 10 ${subject}, Chapter: ${chapter}.
  
  STRICT RULES:
  1. ONLY MCQ (Multiple Choice) questions. DO NOT generate numerical entry or any other type.
  2. Use LaTeX (wrapped in single $ for inline and double $$ for block) for ALL mathematical expressions, formulas, and symbols.
  3. Ensure questions are DIFFERENT from common patterns and cover diverse concepts within the chapter.
  ${existingQuestions.length > 0 ? `4. IMPORTANT: DO NOT repeat or duplicate the following existing questions: ${existingQuestions.slice(-10).join(', ')}` : ''}
  
  Provide the output in JSON format as an array of objects with the following structure:
  {
    "type": "mcq",
    "questionText": "Detailed question string with LaTeX",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact string from one of the options",
    "explanation": "Brief step-by-step logic"
  }
  Respond ONLY with the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}
