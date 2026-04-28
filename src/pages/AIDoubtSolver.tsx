import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareQuote, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2,
  Trash2,
  BrainCircuit,
  Settings2,
  Plus
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LatexRenderer } from '../components/LatexRenderer';

// We'll use the environment variable for the API key
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIDoubtSolver() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = `You are a professional study doubt solver for competitive exams like JEE/NEET. 
      Answer the student's doubt clearly and concisely. 
      If there is math involved, use LaTeX format like $x^2$.
      Student doubt: ${input}`;

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });

      const text = response.text || "I'm sorry, I couldn't generate a response.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your doubt. Please check your connection and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Clear entire conversation?')) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] overflow-hidden bg-white rounded-big border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-black text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none mb-1">AI Solution</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active • 1.5 Flash Model</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-3 text-slate-500 hover:text-white transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-200">
              <MessageSquareQuote size={32} />
            </div>
            <div className="max-w-xs">
              <h2 className="text-sm font-black text-black uppercase tracking-widest mb-2">Instant Doubt Solver</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Type any question or doubt related to your syllabus and get an instant step-by-step solution.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              <button 
                onClick={() => setInput("Explain Kirchhoff's current law with an example.")}
                className="p-4 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-black hover:text-black transition-all text-left"
              >
                "Explain Kirchhoff's laws..."
              </button>
              <button 
                onClick={() => setInput("Solve: integrate sin^2(x) dx from 0 to pi.")}
                className="p-4 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-black hover:text-black transition-all text-left"
              >
                "Solve: integrate sin^2(x) dx..."
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={message.id}
              className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                message.role === 'user' ? 'bg-black border-black text-white' : 'bg-white border-slate-100 text-black'
              }`}>
                {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-2xl ${
                message.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-white border border-slate-100 text-black shadow-sm'
              }`}>
                <div className={`text-xs md:text-sm font-black tracking-tight leading-relaxed ${message.role === 'user' ? 'uppercase' : ''}`}>
                  <LatexRenderer text={message.content} />
                </div>
                <p className={`text-[8px] font-bold uppercase mt-4 opacity-30 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-black shadow-sm">
              <Bot size={18} className="animate-pulse" />
            </div>
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <Loader2 className="animate-spin w-4 h-4 text-black" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-8 bg-white border-t border-slate-50">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            className="w-full pl-6 pr-16 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-black transition-all font-black text-[10px] md:text-xs uppercase tracking-widest text-black placeholder:text-slate-300"
            placeholder="Type your doubt here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
        <p className="text-center mt-6 text-[8px] font-black text-slate-300 uppercase tracking-widest">
          Gemini AI Solutions may occasionally generate inaccurate responses. Cross-verify with textbook.
        </p>
      </div>
    </div>
  );
}
