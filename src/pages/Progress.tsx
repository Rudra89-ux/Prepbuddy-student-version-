import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Medal,
  Target,
  Brain
} from 'lucide-react';
import { TestResult } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function Progress() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'test_results'),
          where('studentId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'asc')
        );
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

  const validResults = results.filter(r => r && typeof r.accuracy === 'number' && !isNaN(r.accuracy));

  const chartData = validResults.map(r => ({
    date: new Date(r.timestamp?.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: r.accuracy
  }));

  const bestScore = validResults.length > 0 ? Math.max(...validResults.map(r => r.accuracy)) : 0;
  const recentScore = validResults.length > 0 ? validResults[validResults.length - 1].accuracy : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-big border border-slate-100 shadow-sm gap-8 transition-all hover:shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-none mb-3">Analytical Growth</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Quantitative performance assessment over time</p>
        </div>
        <div className="flex items-center gap-12 w-full md:w-auto pt-8 md:pt-0 border-t md:border-t-0 border-slate-50 justify-between md:justify-end">
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Peak</p>
            <p className="text-3xl font-black text-black tracking-tighter tabular-nums">{bestScore}%</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">Latest</p>
            <p className="text-3xl font-black text-black tracking-tighter tabular-nums">{recentScore}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-big border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="font-black text-black text-xs uppercase tracking-[0.25em] flex items-center gap-3">
              <TrendingUp className="text-black" size={16} />
              Performance Matrix
            </h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded">Historical Data</span>
          </div>

          <div className="h-80 w-full">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1', letterSpacing: '0.1em' }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1', letterSpacing: '0.1em' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '1px solid #f1f5f9', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '16px' }}
                    labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: '#000000', letterSpacing: '0.2em' }}
                  />
                  <Area type="stepBefore" dataKey="accuracy" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-6 border-2 border-dashed border-slate-50 rounded-2xl">
                <BarChart3 size={48} className="opacity-5" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Insufficient Data Set</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm">
            <h3 className="font-black text-black text-xs uppercase tracking-[0.25em] mb-10 flex items-center gap-3">
              <Medal className="text-black w-4 h-4" />
              Milestones
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-6 p-5 bg-slate-50/50 rounded-xl border border-slate-50">
                <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-black text-xs">01</div>
                <div>
                  <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none mb-2">Initial Checkpoint</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status: Active</p>
                </div>
              </div>
              <div className="flex items-center gap-6 p-5 bg-white rounded-xl border border-dashed border-slate-100 opacity-40">
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-black text-xs">02</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Accuracy Guard</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Required: 95% Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black p-10 rounded-big text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Tactical Directive</h4>
              <p className="text-xs text-white/80 font-black uppercase tracking-widest leading-relaxed italic">
                Focus on high-precision review. Accuracy over speed ensures alignment with curriculum standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
