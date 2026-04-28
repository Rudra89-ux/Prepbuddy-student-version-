import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateQuestions(subject: string, chapter: string, count: number = 5, existingQuestions: string[] = []) {
  const prompt = `Generate ${count} VERY HARD, conceptually challenging questions for the subject "${subject}" (Chapter: ${chapter}).
  
  CORE MISSION: 
  - "Scrape" your internal training data to extract and synthesize the most difficult questions found on the internet and in the latest Class 10th syllabus books (like NCERT Exemplar, toughest Board Paper questions, and competitive foundation materials like NTSE/IMO).
  - TYPE FREQUENCY: Use 'mcq' (Standard MCQ) for ~95% of the questions. Only generate 'assertion_reason' or 'match_following' for roughly 1 out of every 20 questions requested.
  - You must generate the questions in the SAME LANGUAGE as the subject name "${subject}". 
  ${existingQuestions.length > 0 ? `- DO NOT repeat or generate questions similar to these already existing ones:
  ${existingQuestions.join('\n  ')}` : ''}
  
  STRICT FORMATTING RULES:
  1. For 'mcq': Standard conceptually deep questions.
  2. For 'assertion_reason': Format exactly as:
     Assertion (A): [Statement]
     Reason (R): [Statement]
     (Use newlines between A and R). 
     Options must be:
     (A) Both (A) and (R) are true and (R) is the correct explanation of (A)
     (B) Both (A) and (R) are true but (R) is not the correct explanation of (A)
     (C) (A) is true but (R) is false
     (D) (A) is false but (R) is true
  3. For 'match_following': Organize into clear columns in questionText.
     Example:
     Column I              Column II
     (A) Item 1            (1) Match 1
     (B) Item 2            (2) Match 2
     (C) Item 3            (3) Match 3
     Options must be pairing combinations like "A-2, B-1, C-3".
  4. Use LaTeX (wrapped in $ or $$) for all math symbols and formulas. Escape backslashes for valid JSON (e.g. \\\\frac).
  5. Ensure exactly 4 distinct and challenging options for each.
  6. Ensure the correctAnswer exactly matches one of the options string.
  7. Provide a detailed step-by-step explanation in the SAME LANGUAGE as the questions.
  8. Return a JSON array of objects.`;

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
              type: { type: Type.STRING, enum: ["mcq", "assertion_reason", "match_following"], description: "Type of question" },
              questionText: { type: Type.STRING, description: "The full question text including any lists or A/R headers" },
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
