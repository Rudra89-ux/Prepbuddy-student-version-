import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, documentId } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
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
  const [pauseReason, setPauseReason] = useState<'switch' | 'manual' | 'resume' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chapterId && !mockTestId) {
      navigate('/subjects');
      return;
    }

    const fetchContent = async () => {
      try {
        const storageKey = `test_progress_${mockTestId || chapterId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
          try {
            const data = JSON.parse(saved);
            setQuestions(data.questions);
            setCurrentIndex(data.currentIndex);
            setAnswers(data.answers);
            setTimeLeft(data.timeLeft);
            setIsPaused(true);
            setPauseReason('resume');
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to restore progress", e);
          }
        }

        if (mockTestId) {
          const testSnap = await getDoc(doc(db, 'mock_tests', mockTestId));
          if (testSnap.exists()) {
            const testData = testSnap.data() as MockTest;
            setTimeLeft(testData.duration * 60);
            
            // Fetch questions in chunks of 30 to avoid Firestore 'in' query limits
            const questionIds = testData.questionIds;
            const fetched: Question[] = [];
            
            for (let i = 0; i < questionIds.length; i += 30) {
              const chunk = questionIds.slice(i, i + 30);
              try {
                const qSnap = await getDocs(query(
                  collection(db, 'questions'), 
                  where(documentId(), 'in', chunk)
                ));
                fetched.push(...qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
              } catch (err) {
                handleFirestoreError(err, OperationType.GET, 'questions-chunk');
              }
            }
            
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

  // Save progress periodically
  useEffect(() => {
    if (loading || questions.length === 0 || submitting) return;
    
    const storageKey = `test_progress_${mockTestId || chapterId}`;
    const progress = {
      questions,
      currentIndex,
      answers,
      timeLeft,
      updatedAt: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [currentIndex, answers, timeLeft, questions, loading, submitting, mockTestId, chapterId]);

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
        
        // Filter out already attempted questions and reshuffle the rest
        setQuestions(prev => {
          const unattempted = prev.filter(q => !answers[q.id]);
          // If no unattempted left, we don't filter (fallback) or we could auto-submit
          return shuffleArray(unattempted.length > 0 ? unattempted : prev);
        });
        
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

    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

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
        mockTestId: mockTestId || null,
        score: correctCount,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        wrongAnswers: questions.length - correctCount,
        accuracy,
        timestamp: serverTimestamp(),
        testType: mockTestId ? 'mock' : 'chapter',
        answers: userAnswers
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'test_results'), resultData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'test_results');
        return; // Should not reach here as handleFirestoreError throws
      }
      
      // Clear persistence
      localStorage.removeItem(`test_progress_${mockTestId || chapterId}`);
      
      navigate(`/results?id=${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [
      hrs > 0 ? hrs.toString().padStart(2, '0') : null,
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean);

    return parts.join(':');
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
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
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
              {pauseReason === 'switch' ? 'Wait a second!' : pauseReason === 'resume' ? 'Welcome Back!' : 'Test Paused'}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
              {pauseReason === 'switch' 
                ? 'It looks like you switched tabs. We\'ve shuffled the questions for fairness.' 
                : pauseReason === 'resume'
                ? 'Ready to pick up where you left off?'
                : 'Take a breath. Resume whenever you\'re ready.'}
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
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <Timer size={14} className={timeLeft < 60 ? 'text-black animate-pulse' : 'text-slate-300'} />
            <span className={`font-mono font-black text-[10px] md:text-xs ${timeLeft < 60 ? 'text-black' : 'text-slate-600'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-black hover:bg-slate-800 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={14} />}
            <span className="hidden sm:inline">Submit</span>
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
          <div className="flex items-start justify-between mb-4 md:mb-6 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
            <div className="flex items-center gap-4">
              <span>Question {currentQuestion.id.slice(0, 4)}</span>
              {currentQuestion.type && (
                <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                  {currentQuestion.type === 'assertion_reason' ? 'Assertion & Reason' : currentQuestion.type === 'match_following' ? 'Match the Following' : 'Standard MCQ'}
                </span>
              )}
            </div>
          </div>

          {currentQuestion.imageUrl && (
            <div className="mb-6 md:mb-8 rounded-2xl overflow-hidden border-2 border-slate-50 bg-white p-2 shadow-sm">
              <img 
                src={getDriveDirectLink(currentQuestion.imageUrl)} 
                alt="Question Content" 
                className="max-h-[35vh] w-auto mx-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="text-base md:text-2xl font-black text-black mb-6 md:mb-10 leading-tight uppercase tracking-tight whitespace-pre-wrap">
            <LatexRenderer text={currentQuestion.questionText} />
          </div>

          <div className="space-y-2 md:space-y-3">
            {currentQuestion.options?.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 md:gap-4 group ${
                    isSelected 
                      ? 'border-black bg-black text-white shadow-lg' 
                      : 'border-slate-50 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-black transition-all text-[9px] md:text-[10px] shrink-0 ${
                    isSelected ? 'bg-white text-black' : 'bg-white text-slate-400 group-hover:text-black'
                  }`}>
                    {letter}
                  </div>
                  <span className={`font-black text-xs md:text-[13px] uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                    <LatexRenderer text={option} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 md:mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
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
              {currentIndex === questions.length - 1 ? 'Submit Test' : 'Next Question'}
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
