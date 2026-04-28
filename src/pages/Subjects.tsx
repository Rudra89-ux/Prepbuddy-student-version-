import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  BookOpen, 
  Search,
  BookMarked,
  Atom,
  Calculator,
  Languages,
  History
} from 'lucide-react';
import { Subject } from '../types';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('math')) return <Calculator className="w-6 h-6" />;
    if (n.includes('science')) return <Atom className="w-6 h-6" />;
    if (n.includes('social') || n.includes('history')) return <History className="w-6 h-6" />;
    if (n.includes('english') || n.includes('hindi') || n.includes('language')) return <Languages className="w-6 h-6" />;
    return <BookMarked className="w-6 h-6" />;
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-black uppercase tracking-widest">Board Syllabus</h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Core Subjects for CBSE Class 10</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input
            type="text"
            placeholder="SEARCH SUBJECTS..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-60 bg-white rounded-big animate-pulse border border-slate-100" />
          ))
        ) : filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject, idx) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              className="bg-white p-10 rounded-big border border-slate-100 shadow-sm group cursor-pointer relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-black mb-8 group-hover:bg-black group-hover:text-white transition-all duration-300">
                  {getSubjectIcon(subject.name)}
                </div>
                <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight">{subject.name}</h3>
                <p className="text-[10px] text-slate-400 mb-10 font-black uppercase tracking-widest">Academic Year 2025-26</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <span className="text-[10px] font-black text-black bg-slate-100 px-4 py-2 rounded uppercase tracking-[0.2em]">
                    Curriculum Ready
                  </span>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <BookOpen className="w-20 h-20 mx-auto mb-6 opacity-5" />
            <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-300">No data found</p>
          </div>
        )}
      </div>
    </div>
  );
}
