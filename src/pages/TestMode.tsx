import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, documentId } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Timer,
  ChevronRight,
  Send,
  Loader2,
  RefreshCw,
  Play
} from 'lucide-react';
import { Question, MockTest } from '../types';
import { LatexRenderer } from '../components/LatexRenderer';
import { getDriveDirectLink, shuffleArray } from '../lib/utils';

export default function TestMode() {
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapterId');
  const subjectId = searchParams.get('subjectId');
  const mockTestId = searchParams.get('mockTestId');
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // Default 10 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<'switch' | 'manual' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chapterId && !mockTestId) {
      navigate('/subjects');
      return;
    }

    const fetchContent = async () => {
      try {
        if (mockTestId) {
          const testSnap = await getDoc(doc(db, 'mock_tests', mockTestId));
          if (testSnap.exists()) {
            const testData = testSnap.data() as MockTest;
            setTimeLeft(testData.duration * 60);
            
            // Fix: Use documentId() instead of 'id' field for document IDs
            const qSnap = await getDocs(query(collection(db, 'questions'), where(documentId(), 'in', testData.questionIds)));
            const fetched = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
            setQuestions(shuffleArray(fetched));
          }
        } else {
          const q = query(collection(db, 'questions'), where('chapterId', '==', chapterId));
          const snap = await getDocs(q);
          const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
          setQuestions(shuffleArray(fetched));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [chapterId, mockTestId, navigate]);

  useEffect(() => {
    if (loading || questions.length === 0 || isPaused) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions, isPaused]);

  // Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !loading && questions.length > 0 && !submitting) {
        setIsPaused(true);
        setPauseReason('switch');
        // Reshuffle immediately
        setQuestions(prev => shuffleArray(prev));
        // Reset index to add to the "penalty/confusion" effect
        setCurrentIndex(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, questions, submitting]);

  const handleOptionSelect = (option: string) => {
    if (isPaused) return;
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const accuracy = Math.round((correctCount / questions.length) * 100);

    const userAnswers = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] || 'unanswered',
      isCorrect: answers[q.id] === q.correctAnswer
    }));

    try {
      // Fetch subject name for record
      let subjectName = '';
      if (subjectId) {
        const sDoc = await getDoc(doc(db, 'subjects', subjectId));
        if (sDoc.exists()) subjectName = sDoc.data().name;
      }

      const resultData = {
        studentId: auth.currentUser?.uid,
        studentEmail: auth.currentUser?.email,
        subjectId: subjectId || questions[0]?.subjectId || '',
        subjectName: subjectName || 'General',
        chapterId: chapterId || 'mock',
        score: correctCount,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        wrongAnswers: questions.length - correctCount,
        accuracy,
        timestamp: serverTimestamp(),
        testType: mockTestId ? 'mock' : 'chapter',
        answers: userAnswers
      };

      const docRef = await addDoc(collection(db, 'test_results'), resultData);
      navigate(`/results?id=${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-black animate-spin" />
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Loading Test...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-slate-200" />
        <h2 className="text-sm font-black text-black uppercase tracking-widest mb-2">No Questions Found</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">This test doesn't have any questions yet.</p>
        <button onClick={() => navigate(-1)} className="px-8 py-4 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-8 pb-32 md:pb-20">
      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="max-w-md w-full text-center space-y-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10 text-white animate-pulse">
                <RefreshCw size={32} />
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                {pauseReason === 'switch' ? 'Test Paused' : 'Paused'}
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                {pauseReason === 'switch' 
                  ? 'Warning: You switched tabs. The questions have been shuffled to keep the test fair.' 
                  : 'The timer has been paused. Resume when you are ready.'}
              </p>
              <button
                onClick={() => {
                   setIsPaused(false);
                   setPauseReason(null);
                }}
                className="w-full py-5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-2xl"
              >
                <Play size={16} />
                Resume Test
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl shadow-sm sticky top-2 md:top-4 z-10 border border-slate-100 font-sans">
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => navigate(-1)} className="p-1 md:p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all">
            <ArrowLeft size={16} md:size={18} />
          </button>
          <div>
            <h4 className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">
              {mockTestId ? 'Mock Test' : 'Chapter Test'}
            </h4>
            <p className="text-xs font-black text-black uppercase tracking-widest leading-none">Question {currentIndex + 1} / {questions.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <Timer size={16} className={timeLeft < 60 ? 'text-black animate-pulse' : 'text-slate-300'} />
            <span className={`font-mono font-black text-xs ${timeLeft < 60 ? 'text-black' : 'text-slate-600'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-black hover:bg-slate-800 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={14} />}
            <span className="hidden sm:inline">Finish</span>
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          className="bg-black h-full" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
          <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 md:p-16 rounded-big border border-slate-100 shadow-sm"
        >
          <div className="flex items-start justify-between mb-6 md:mb-10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            <span>Question {currentQuestion.id.slice(0, 4)}</span>
          </div>

          {currentQuestion.imageUrl && (
            <div className="mb-8 md:mb-12 rounded-2xl overflow-hidden border border-slate-100 bg-white p-2">
              <img 
                src={getDriveDirectLink(currentQuestion.imageUrl)} 
                alt="Question Image" 
                className="max-h-[200px] md:max-h-[300px] w-auto mx-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <h2 className="text-lg md:text-3xl font-black text-black mb-8 md:mb-16 leading-tight uppercase tracking-tight">
            <LatexRenderer text={currentQuestion.questionText} />
          </h2>

          <div className="space-y-3 md:space-y-4">
            {currentQuestion.options?.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 md:p-6 rounded-xl border-2 text-left transition-all flex items-center gap-4 md:gap-6 group ${
                    isSelected 
                      ? 'border-black bg-black text-white shadow-xl' 
                      : 'border-slate-50 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-black transition-all text-[10px] md:text-xs shrink-0 ${
                    isSelected ? 'bg-white text-black' : 'bg-white text-slate-400 group-hover:text-black'
                  }`}>
                    {letter}
                  </div>
                  <span className={`font-black text-xs md:text-sm uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                    <LatexRenderer text={option} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 md:mt-16 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="w-full md:w-auto px-6 py-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest text-slate-300 hover:text-black disabled:opacity-0 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                } else {
                  handleSubmit();
                }
              }}
              className="w-full md:w-auto px-10 py-5 bg-black hover:bg-slate-800 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-3 group"
            >
              {currentIndex === questions.length - 1 ? 'End Test' : 'Next Question'}
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
