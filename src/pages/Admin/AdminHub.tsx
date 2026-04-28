import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Users, 
  BarChart, 
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Subject, Chapter } from '../../types';

export default function AdminHub() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'subjects'), {
        name: newSubjectName,
        order: subjects.length + 1,
        createdAt: serverTimestamp()
      });
      setNewSubjectName('');
      setStatus({ type: 'success', message: 'Subject added successfully!' });
      fetchSubjects();
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject? This will affect questions as well.')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
      fetchSubjects();
      setStatus({ type: 'success', message: 'Subject deleted' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Admin Panel</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md leading-relaxed">
            Manage your subjects, questions, and mock tests efficiently.
          </p>
        </div>
        <Settings size={96} className="text-white/5 absolute right-12 bottom-0 rotate-12" />
      </div>

      {status && (
        <motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  className={`p-6 rounded-xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest border ${
    status.type === 'success' ? 'bg-white border-black text-black' : 'bg-white border-slate-200 text-slate-400'
  }`}
>
  {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
  {status.message}
  <button onClick={() => setStatus(null)} className="ml-auto opacity-30 hover:opacity-100 transition-opacity"><X size={14} /></button>
</motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Manage Subjects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-black mb-10 uppercase tracking-[0.25em] flex items-center gap-3">
              <FileText className="text-black" size={14} />
              Subjects
            </h3>
            
            <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-3 mb-12">
              <input
                type="text"
                placeholder="New Subject Name"
                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-8 py-4 bg-black text-white rounded-lg font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
              >
                <Plus size={16} />
                Add Subject
              </button>
            </form>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">Loading...</div>
              ) : subjects.length > 0 ? (
                subjects.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-xl border border-transparent hover:border-black transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded flex items-center justify-center font-black text-[10px] text-slate-300 group-hover:text-black transition-colors">
                        {sub.order.toString().padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-black text-black text-xs uppercase tracking-widest">{sub.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => deleteSubject(sub.id)}
                        className="p-2 text-slate-300 hover:text-black transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-100 text-slate-300">
                  <p className="font-black text-[10px] uppercase tracking-[0.3em]">No subjects added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm">
            <h3 className="font-black text-black text-[10px] uppercase tracking-[0.25em] mb-8 flex items-center gap-3">
              <BarChart className="text-black w-4 h-4" />
              Quick Actions
            </h3>
            <div className="space-y-6">
              <Link to="/admin/questions" className="block w-full py-5 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all text-center shadow-xl">
                Manage Questions
              </Link>
              <Link to="/admin/mock-tests" className="block w-full py-5 bg-white border border-slate-200 text-black rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:border-black transition-all text-center">
                Manage Tests
              </Link>
              <Link to="/admin/results" className="block w-full py-5 bg-white border border-slate-200 text-black rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:border-black transition-all text-center">
                Student Performance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
