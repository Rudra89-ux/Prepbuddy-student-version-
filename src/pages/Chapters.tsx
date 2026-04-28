import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Plus, 
  ChevronRight, 
  BookOpen, 
  ArrowLeft,
  BookMarked,
  Layers
} from 'lucide-react';
import { Chapter, Subject } from '../types';

export default function Chapters() {
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectId) {
      navigate('/subjects');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Subject details
        const subjectSnap = await getDocs(query(collection(db, 'subjects')));
        const sub = subjectSnap.docs.find(d => d.id === subjectId);
        if (sub) setSubject({ id: sub.id, ...sub.data() } as Subject);

        // Fetch Chapters
        const q = query(
          collection(db, 'chapters'), 
          where('subjectId', '==', subjectId),
          orderBy('order', 'asc')
        );
        const snap = await getDocs(q);
        setChapters(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectId, navigate]);

    if (loading) {
      return <div className="p-10 text-center animate-pulse">Loading chapters...</div>;
    }
  
    return (
      <div className="space-y-8">
        <Link to="/subjects" className="inline-flex items-center gap-3 text-slate-400 hover:text-black transition-colors font-black text-[10px] uppercase tracking-widest group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Subjects
        </Link>
  
        <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-black border border-slate-100">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-none mb-2">{subject?.name || 'Subject'}</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Choose a topic to practice</p>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">Total</p>
              <p className="text-lg font-black text-black">{chapters.length} Chapters</p>
            </div>
          <div className="w-[1px] h-10 bg-slate-100 mx-4 hidden sm:block" />
          <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">
            {chapters.length > 0 ? Math.round((0 / chapters.length) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chapters.length > 0 ? chapters.map((chapter, idx) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/test?chapterId=${chapter.id}&subjectId=${subjectId}`)}
            className="group bg-white p-6 rounded-xl border border-slate-50 shadow-sm hover:border-black cursor-pointer flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:text-white transition-all">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">
                  Chapter {chapter.order || idx + 1}
                </p>
                <h3 className="font-black text-black uppercase tracking-tight text-sm">{chapter.name}</h3>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-black group-hover:text-white transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-big border border-dashed border-slate-100">
            <BookMarked className="w-20 h-20 mx-auto mb-6 opacity-5" />
            <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-300">No chapters found for this subject</p>
          </div>
        )}
      </div>
    </div>
  );
}
