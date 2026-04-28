import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ArrowRight, 
  RefreshCw, 
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Target
} from 'lucide-react';
import { TestResult, Question } from '../types';
import { LatexRenderer } from '../components/LatexRenderer';
import { getDriveDirectLink } from '../lib/utils';

export default function Results() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');
  const [result, setResult] = useState<TestResult | null>(null);
  const [reviewedQuestions, setReviewedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resultId) {
      navigate('/tests');
      return;
    }

    const fetchResult = async () => {
      try {
        const docRef = doc(db, 'test_results', resultId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as TestResult;
          setResult(data);

          // If there are answers, fetch the corresponding questions
          if (data.answers && data.answers.length > 0) {
            const qIds = data.answers.map(a => a.questionId);
            const questionDocs = [];
            
            // Firestore 'in' query has a limit of 10-30 IDs usually. 
            // For longer tests, we might need chunks, but let's assume 10-20 for now.
            // Or better, fetch individual docs for safety if qIds is long.
            for (let i = 0; i < qIds.length; i += 10) {
              const chunk = qIds.slice(i, i + 10);
              if (chunk.length === 0) break;
              const qSnap = await getDocs(query(collection(db, 'questions'), where('__name__', 'in', chunk)));
              questionDocs.push(...qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
            }
            setReviewedQuestions(questionDocs);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId, navigate]);

  if (loading) return <div className="p-10 text-center animate-pulse py-40 font-black text-xs uppercase tracking-widest text-slate-300">Computing Metrics...</div>;

  if (!result) return <div className="text-center py-20 font-black text-xs uppercase tracking-widest text-red-500">Record not found</div>;

  const isPassed = result.accuracy >= 60;

  // Calculate chapter-wise accuracy
  const chapterBreakdown = reviewedQuestions.reduce((acc, q) => {
    const answer = result.answers?.find(a => a.questionId === q.id);
    const chapterName = q.chapterId; // We might want to fetch chapter names, but for now use ID or fallback
    if (!acc[chapterName]) acc[chapterName] = { total: 0, correct: 0 };
    acc[chapterName].total++;
    if (answer?.isCorrect) acc[chapterName].correct++;
    return acc;
  }, {} as Record<string, { total: number, correct: number }>);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 md:p-20 rounded-big border border-slate-100 shadow-sm text-center relative overflow-hidden"
      >
        <div className={`absolute top-0 inset-x-0 h-1.5 ${isPassed ? 'bg-black' : 'bg-slate-300'}`} />
        
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto flex items-center justify-center mb-8 relative border-2 ${
          isPassed ? 'border-black text-black' : 'border-slate-200 text-slate-300'
        }`}>
          {isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
        </div>

        <h1 className="text-2xl md:text-5xl font-black text-black mb-4 uppercase tracking-tighter">
          {isPassed ? 'Test Validated' : 'Delta Observed'}
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.25em] mb-12 md:mb-16 max-w-sm mx-auto leading-relaxed">
          {result.subjectName || 'General'} Performance Evaluation Summary
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Volume</p>
            <p className="text-3xl font-black text-black tracking-tighter">{result.totalQuestions}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total Items</p>
          </div>
          <div className="p-8 bg-black text-white rounded-2xl shadow-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-3">Performance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-white tracking-tighter">{result.score}</span>
              <span className="text-lg font-bold text-slate-600">/ {result.totalQuestions}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Raw Score</p>
          </div>
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Precision</p>
            <p className="text-3xl font-black text-black tracking-tighter">{result.accuracy}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Success Rate</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full sm:w-auto px-10 py-5 bg-white border border-black text-black hover:bg-slate-50 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            <Eye size={16} />
            {showReview ? 'Hide Responses' : 'Detailed Review'}
          </button>
          <Link
            to="/tests"
            className="w-full sm:w-auto px-10 py-5 bg-black text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3"
          >
            Advance <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4">
             <Target size={14} />
             Growth Identification
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              {Object.entries(chapterBreakdown).map(([chapterId, data], i) => {
                const chapterData = data as { correct: number, total: number };
                const acc = Math.round((chapterData.correct / chapterData.total) * 100);
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest truncate max-w-[150px]">
                      {chapterId === 'none' ? 'General' : chapterId}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${acc >= 75 ? 'bg-emerald-500' : acc >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-black">{acc}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {result.accuracy < 80 ? (
              <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Weakness Detected</p>
                <p className="text-[11px] font-bold text-red-900 uppercase leading-relaxed">
                  Precision delta exceeds 20%. Multiple conceptual gaps identified in current session. 
                  Focused review of {result.subjectName || 'Current Subject'} required for board alignment.
                </p>
              </div>
            ) : (
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Efficiency Confirmed</p>
                <p className="text-[11px] font-bold text-emerald-900 uppercase leading-relaxed">
                  Conceptual alignment verified. Performance metrics within 90th percentile threshold. 
                  Continue strategic progression.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4">
            <Layers size={14} />
            Analytical Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Correct</p>
              <p className="text-xl font-black text-emerald-500">{result.score}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Incorrect</p>
              <p className="text-xl font-black text-red-500">{result.wrongAnswers}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <h3 className="text-xs font-black text-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4 px-4 pt-8 border-t border-slate-50">
              <MessageSquareQuote size={14} />
              Response Validation Report
            </h3>
            <div className="space-y-6">
              {result.answers?.map((answer, index) => {
                const q = reviewedQuestions.find(rq => rq.id === answer.questionId);
                return (
                  <div key={index} className={`p-8 rounded-big border ${answer.isCorrect ? 'bg-white border-emerald-100' : 'bg-white border-red-100'} shadow-sm`}>
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border ${
                        answer.isCorrect ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {answer.isCorrect ? 'Correct Validation' : 'Inaccurate Response'}
                      </span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Q. {index + 1}</span>
                    </div>
                    
                    <div className="font-black text-black text-sm uppercase tracking-tight leading-relaxed mb-6">
                      <LatexRenderer text={q?.questionText || 'Loading Item...'} />
                    </div>

                    {q?.imageUrl && (
                      <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 bg-white p-2">
                        <img 
                          src={getDriveDirectLink(q.imageUrl)} 
                          alt="Question Visual" 
                          className="max-h-48 mx-auto object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Input:</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${answer.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                           <LatexRenderer text={answer.selectedAnswer} />
                        </span>
                      </div>
                      {!answer.isCorrect && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Expected:</span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <LatexRenderer text={q?.correctAnswer || ''} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
