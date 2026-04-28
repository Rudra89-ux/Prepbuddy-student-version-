import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Trophy, 
  ArrowRight, 
  RefreshCw, 
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  LayoutDashboard
} from 'lucide-react';
import { TestResult } from '../types';

export default function Results() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resultId) {
      navigate('/');
      return;
    }

    const fetchResult = async () => {
      try {
        const docRef = doc(db, 'test_results', resultId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult({ id: docSnap.id, ...docSnap.data() } as TestResult);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId, navigate]);

  if (loading) return <div className="p-10 text-center animate-pulse">Computing your results...</div>;

  if (!result) return <div className="text-center py-20">Result not found</div>;

  const isPassed = result.accuracy >= 60;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 md:p-20 rounded-big border border-slate-100 shadow-sm text-center relative overflow-hidden"
      >
        <div className={`absolute top-0 inset-x-0 h-1 ${isPassed ? 'bg-black' : 'bg-slate-300'}`} />
        
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8 relative border-2 ${
          isPassed ? 'border-black text-black' : 'border-slate-200 text-slate-300'
        }`}>
          {isPassed ? <Trophy size={40} /> : <XCircle size={40} />}
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-black mb-4 uppercase tracking-tighter">
          {isPassed ? 'Excellence' : 'Persistence Required'}
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mb-16 max-w-sm mx-auto leading-relaxed">
          {isPassed 
            ? "Your performance alignment meets board standards. Continue current trajectory."
            : "Performance delta identified. Strategic review recommended for mastery."
          }
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Volume</p>
            <p className="text-3xl font-black text-black tracking-tighter">{result.totalQuestions}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total Items</p>
          </div>
          <div className="p-8 bg-black text-white rounded-2xl shadow-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-3">Performance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-white tracking-tighter">{result.score}</span>
              <span className="text-lg font-bold text-slate-600">/ {result.totalQuestions}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Raw Score</p>
          </div>
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Precision</p>
            <p className="text-3xl font-black text-black tracking-tighter">{result.accuracy}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Success Rate</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            to="/subjects"
            className="w-full sm:w-auto px-10 py-5 bg-black text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3"
          >
            Advance to Syllabus <ArrowRight size={14} />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 hover:border-black text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            Return to Dashboard
          </Link>
        </div>
      </motion.div>

      <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-black uppercase tracking-[0.25em] mb-10 flex items-center gap-4">
          <Layers size={14} />
          Analytical Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 border border-slate-50 bg-slate-50/20 rounded-2xl flex items-center gap-8">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-full flex items-center justify-center text-black shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-black tabular-nums leading-none mb-2">{result.correctAnswers}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Validations</p>
            </div>
          </div>
          <div className="p-8 border border-slate-50 bg-slate-50/20 rounded-2xl flex items-center gap-8">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-200 shadow-sm">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-black tabular-nums leading-none mb-2">{result.wrongAnswers}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inaccurate Metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
