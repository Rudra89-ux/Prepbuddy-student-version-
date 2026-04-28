import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Clock, 
  BookOpen, 
  ChevronRight,
  GraduationCap,
  Calendar,
  Layers,
  History,
  CheckCircle2,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';
import { MockTest, Subject, TestResult } from '../types';

export default function Tests() {
  const [activeTab, setActiveTab] = useState<'available' | 'results'>('available');
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [showInstructions, setShowInstructions] = useState<MockTest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const testsSnap = await getDocs(query(collection(db, 'mock_tests'), orderBy('createdAt', 'desc')));
        const subsSnap = await getDocs(query(collection(db, 'subjects'), orderBy('order', 'asc')));
        const resultsSnap = await getDocs(query(
          collection(db, 'test_results'), 
          where('studentId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        ));
        
        setMockTests(testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockTest)));
        setSubjects(subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
        setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'General';
  const isTestCompleted = (testId: string) => results.some(r => r.mockTestId === testId);

  const filteredTests = mockTests.filter(test => 
    selectedSubjectFilter === 'all' || test.subjectId === selectedSubjectFilter
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Mock Tests</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-md leading-relaxed">
            Practice with full-length tests to prepare for your exams.
          </p>
        </div>
        <GraduationCap size={120} className="text-white/5 absolute right-12 bottom-0 rotate-12" />
        
        {/* Tab Controls */}
  <div className="flex flex-col md:flex-row gap-6 mt-12 relative z-20 w-full overflow-hidden">
          <div className="flex gap-2 md:gap-4 bg-white/5 p-1.5 md:p-2 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
            <button 
              onClick={() => setActiveTab('available')}
              className={`px-4 md:px-8 py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'available' ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'
              }`}
            >
              Available Tests
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-4 md:px-8 py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'results' ? 'bg-white text-black shadow-xl' : 'text-slate-400 hover:text-white'
              }`}
            >
              Test History
            </button>
          </div>

          {activeTab === 'available' && (
            <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedSubjectFilter === 'all' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Subjects
              </button>
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectFilter(subject.id)}
                  className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedSubjectFilter === subject.id ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'available' ? (
          <motion.div 
            key="available"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredTests.length > 0 ? (
              filteredTests.map((test, index) => {
                const completed = isTestCompleted(test.id);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={test.id}
                    className={`bg-white group rounded-big border ${completed ? 'border-emerald-100' : 'border-slate-100'} p-8 shadow-sm hover:shadow-xl hover:border-black transition-all flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {getSubjectName(test.subjectId)}
                          </span>
                          {completed && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase tracking-widest rounded border border-emerald-100">
                              Completed
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-black uppercase tracking-tight leading-tight group-hover:text-black transition-colors">
                          {test.title}
                        </h3>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${completed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 border border-slate-100 text-slate-300'} flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all`}>
                        {completed ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed mb-auto">
                      {test.description || 'Practice test covering various topics.'}
                    </p>

                    <div className="mt-10 space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-300" />
                          <span>{test.duration} Mins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers size={12} className="text-slate-300" />
                          <span>{test.questionIds.length} Qs</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowInstructions(test)}
                        className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn ${
                          completed 
                            ? 'bg-slate-50 text-slate-400 hover:bg-black hover:text-white' 
                            : 'bg-white border-2 border-slate-100 text-black hover:bg-black hover:text-white hover:border-black'
                        }`}
                      >
                        {completed ? 'Retake Test' : 'Start Test'}
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-32 bg-slate-50 rounded-big border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                <Calendar className="text-slate-200 mb-6" size={48} />
                <p className="font-black text-[10px] text-slate-300 uppercase tracking-[0.3em]">No mock tests available yet</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {results.length > 0 ? (
              results.map((result, idx) => (
                <div 
                  key={result.id}
                  onClick={() => navigate(`/results?id=${result.id}`)}
                  className="bg-white p-8 rounded-big border border-slate-100 shadow-sm hover:border-black transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded truncate max-w-[120px]">
                          {result.subjectName}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap">
                          {result.timestamp?.toDate ? new Date(result.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <h4 className="text-sm md:text-lg font-black text-black uppercase tracking-tight line-clamp-1">{result.testType === 'mock' ? 'Mock Session' : 'Chapter Session'}</h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                     <div className="text-center">
                       <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Score</p>
                       <p className="text-base md:text-xl font-black text-black">{result.score}/{result.totalQuestions}</p>
                     </div>
                     <div className="text-center">
                       <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Accuracy</p>
                       <p className={`text-base md:text-xl font-black ${result.accuracy >= 75 ? 'text-emerald-500' : result.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{result.accuracy}%</p>
                     </div>
                     <ChevronRight size={20} className="text-slate-100 group-hover:text-black group-hover:translate-x-1 transition-all hidden md:block" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 bg-slate-50 rounded-big border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                <History className="text-slate-200 mb-6" size={48} />
                <p className="font-black text-[10px] text-slate-300 uppercase tracking-[0.3em]">No test history found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-big w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Instructions</span>
                    <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-tight">
                      {showInstructions.title}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowInstructions(null)}
                    className="p-3 bg-slate-50 text-slate-300 hover:bg-black hover:text-white rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8 mb-12">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clock size={10} /> Duration
                      </p>
                      <p className="text-xl font-black text-black uppercase">{showInstructions.duration} Minutes</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers size={10} /> Questions
                      </p>
                      <p className="text-xl font-black text-black uppercase">{showInstructions.questionIds.length} Total</p>
                    </div>
                  </div>

                  <div className="p-8 bg-black text-white rounded-2xl shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                      <AlertCircle size={14} className="text-white" /> Exam Rules
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex gap-4 text-[10px] font-bold uppercase tracking-tight text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                        Do not refresh or close the browser during the exam.
                      </li>
                      <li className="flex gap-4 text-[10px] font-bold uppercase tracking-tight text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                        Once started, the timer cannot be paused.
                      </li>
                      <li className="flex gap-4 text-[10px] font-bold uppercase tracking-tight text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                        Your session will be automatically submitted when time runs out.
                      </li>
                      {showInstructions.description && (
                        <li className="flex gap-4 text-[10px] font-bold uppercase tracking-tight text-white leading-relaxed mt-4 pt-4 border-t border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                          {showInstructions.description}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => setShowInstructions(null)}
                    className="flex-1 py-5 bg-white border border-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => navigate(`/test?mockTestId=${showInstructions.id}&subjectId=${showInstructions.subjectId}`)}
                    className="flex-1 py-5 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    Start Examination
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
