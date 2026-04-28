import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  PlayCircle, 
  Trophy, 
  Target, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Brain,
  ShieldCheck
} from 'lucide-react';
import { TestResult, Subject } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch last 5 results
        const resultsRef = collection(db, 'test_results');
        const q = query(
          resultsRef, 
          where('studentId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const resultsSnap = await getDocs(q);
        setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));

        // Fetch subjects
        const subjectsRef = collection(db, 'subjects');
        const subjectsSnap = await getDocs(subjectsRef);
        setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const avgAccuracy = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.accuracy, 0) / results.length)
    : 0;

  const data = [
    { name: 'Correct', value: avgAccuracy },
    { name: 'Remaining', value: 100 - avgAccuracy },
  ];

  const COLORS = ['#000000', '#E2E8F0'];

  return (
    <div className="space-y-8">
      {(auth.currentUser?.email === 'rudrapable2010@gmail.com' || auth.currentUser?.email === 'leaninkclothing@gmail.com') && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black p-6 rounded-big border border-black shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-white font-black text-sm uppercase tracking-widest leading-none mb-1">System Administrator Identified</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Access restricted management console</p>
            </div>
          </div>
          <Link to="/admin" className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
            Open Admin Panel
          </Link>
        </motion.div>
      )}

      {/* Top Section: Progress & Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-big border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-black text-xs uppercase tracking-[0.2em]">Subject Performance</h3>
            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Updates</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {subjects.length > 0 ? subjects.slice(0, 4).map((sub) => {
              return (
                <div key={sub.id} className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100 flex flex-col items-center gap-2 transition-all hover:bg-black hover:text-white group">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest group-hover:text-slate-500 transition-colors">{sub.name}</p>
                  <p className="text-2xl font-black">0%</p>
                </div>
              );
            }) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl text-center border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest leading-none mb-2">Subject</p>
                  <p className="text-2xl font-black text-slate-200 tracking-tighter">--</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-black rounded-2xl text-white gap-6">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                <Brain className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-sm">Full Mock Exam</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Comprehensive Board Review</p>
              </div>
            </div>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
              Start Now <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-48 h-48 relative flex items-center justify-center mb-6">
            <ResponsiveContainer width={192} height={192}>
              <PieChart>
                <Pie
                  data={data}
                  cx={96}
                  cy={96}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-black tracking-tighter leading-none mb-1">{avgAccuracy}%</span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Accuracy</span>
            </div>
          </div>
          <h4 className="font-black text-black uppercase tracking-widest text-xs mb-2">Learning Milestone</h4>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter leading-relaxed max-w-[200px] mb-8">
            {avgAccuracy > 80 ? "Mastery achieved in current topics." : "Consistent practice accelerates mastery."}
          </p>
          <button className="w-full py-4 border-2 border-black text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-black hover:text-white transition-all">
            Full Analytics
          </button>
        </div>
      </div>

      {/* Bottom Section: Recent Results & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm">
          <h3 className="font-black text-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <Clock className="w-4 h-4 text-black" />
            Recent History
          </h3>
          <div className="space-y-4">
            {results.length > 0 ? results.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-5 border border-slate-50 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all">
                    {res.score >= 8 ? <Trophy size={18} /> : <Target size={18} />}
                  </div>
                  <div>
                    <p className="font-black text-black text-xs uppercase tracking-widest">Chapter Test</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(res.timestamp?.toDate()).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-black text-sm tabular-nums">
                    {res.score}/{res.totalQuestions}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{res.accuracy}% ACC</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-16 text-slate-200">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="font-black text-xs uppercase tracking-[0.2em]">No test data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-black text-xs uppercase tracking-[0.2em]">Quick Actions</h3>
            <TrendingUp size={16} className="text-black" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Timed Exam', icon: <Clock size={20} /> },
              { label: 'AI Review', icon: <Brain size={20} /> },
              { label: 'Weak Topics', icon: <Target size={20} /> },
              { label: 'Subject List', icon: <PlayCircle size={20} /> },
            ].map((action) => (
              <button
                key={action.label}
                className="p-8 rounded-xl flex flex-col items-center justify-center gap-4 transition-all hover:bg-black hover:text-white border border-slate-100 group"
              >
                <div className="w-12 h-12 bg-slate-50 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-all">
                  {action.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
