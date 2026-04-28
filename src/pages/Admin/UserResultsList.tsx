import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Search, 
  User, 
  ChevronRight, 
  Calendar, 
  Target,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { TestResult } from '../../types';
import { useNavigate } from 'react-router-dom';

export default function UserResultsList() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const q = query(collection(db, 'test_results'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const filteredResults = results.filter(r => 
    r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subjectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter flex items-center gap-6">
            <BarChart3 size={40} />
            User Performance
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md leading-relaxed">
            Monitor all student test results and detailed performance metrics across the platform.
          </p>
        </div>
        <ShieldCheck size={160} className="text-white/5 absolute -right-20 -bottom-20 rotate-12" />
      </div>

      <div className="bg-white p-6 rounded-big border border-slate-100 shadow-sm flex items-center gap-4 mb-8">
        <Search className="text-slate-200" size={18} />
        <input
          type="text"
          placeholder="Search by student email or subject..."
          className="flex-1 border-none focus:outline-none font-black text-[10px] uppercase tracking-widest text-slate-400 placeholder:text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse py-40 font-black text-xs uppercase tracking-widest text-slate-300">Syncing database...</div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <motion.div
              layout
              key={result.id}
              onClick={() => navigate(`/results?id=${result.id}`)}
              className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-black transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-black transition-colors">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-black uppercase tracking-widest mb-1">{result.studentEmail || 'Anonymous'}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <Target size={10} /> {result.subjectName || 'General'}
                    </span>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> {result.timestamp?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-black text-black tracking-tighter leading-none mb-1">{result.accuracy}%</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Precision</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-black tracking-tighter leading-none mb-1">{result.score}/{result.totalQuestions}</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-black transition-colors">
                  <Eye size={18} />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center font-black text-[10px] text-slate-300 uppercase tracking-widest">No results found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
