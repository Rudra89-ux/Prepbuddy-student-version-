import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateQuestions(subject: string, chapter: string, count: number = 5) {
  const prompt = `Generate ${count} practice questions for CBSE Class 10 ${subject}, Chapter: ${chapter}.
  The questions should be a mix of MCQ and numerical type.
  Use LaTeX (wrapped in single $ for inline and double $$ for block) for all mathematical expressions, chemical formulas, and symbols.
  Provide the output in JSON format as an array of objects with the following structure:
  {
    "type": "mcq" | "numerical",
    "questionText": "string",
    "options": ["string", "string", "string", "string"] (only for MCQ),
    "correctAnswer": "string",
    "explanation": "string"
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
