import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Play, 
  Clock, 
  BookOpen, 
  ChevronRight,
  GraduationCap,
  Calendar,
  Layers
} from 'lucide-react';
import { MockTest, Subject } from '../types';

export default function Tests() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testsSnap = await getDocs(query(collection(db, 'mock_tests'), orderBy('createdAt', 'desc')));
        const subsSnap = await getDocs(query(collection(db, 'subjects'), orderBy('order', 'asc')));
        
        setMockTests(testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockTest)));
        setSubjects(subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'General';

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockTests.length > 0 ? (
          mockTests.map((test, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={test.id}
              className="bg-white group rounded-big border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-black transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {getSubjectName(test.subjectId)}
                  </span>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight leading-tight group-hover:text-black transition-colors">
                    {test.title}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all">
                   < BookOpen size={18} />
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
                  onClick={() => navigate(`/test?mockTestId=${test.id}&subjectId=${test.subjectId}`)}
                  className="w-full py-4 bg-white border-2 border-slate-100 text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-3 group/btn"
                >
                  Start Test
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 bg-slate-50 rounded-big border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
            <Calendar className="text-slate-200 mb-6" size={48} />
            <p className="font-black text-[10px] text-slate-300 uppercase tracking-[0.3em]">No mock tests available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
