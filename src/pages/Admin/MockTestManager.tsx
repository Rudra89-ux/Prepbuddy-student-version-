import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search,
  Filter,
  GraduationCap,
  ChevronRight,
  Clock,
  BookOpen,
  Edit2,
  ListRestart
} from 'lucide-react';
import { Subject, Question, MockTest } from '../../types';
import { LatexRenderer } from '../../components/LatexRenderer';

export default function MockTestManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  
  const [loading, setLoading] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      const subQ = query(collection(db, 'subjects'), orderBy('order', 'asc'));
      const subSnap = await getDocs(subQ);
      setSubjects(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));

      const testQ = query(collection(db, 'mock_tests'), orderBy('createdAt', 'desc'));
      const testSnap = await getDocs(testQ);
      setMockTests(testSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockTest)));
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      const fetchQuestions = async () => {
        setFetchingQuestions(true);
        try {
          const q = query(
            collection(db, 'questions'), 
            where('subjectId', '==', selectedSubject)
          );
          const snap = await getDocs(q);
          setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
        } catch (err) {
          console.error(err);
        } finally {
          setFetchingQuestions(false);
        }
      };
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedSubject]);

  const toggleQuestion = (id: string, forceState?: boolean) => {
    setSelectedQuestionIds(prev => {
      const exists = prev.includes(id);
      const shouldBeAdded = forceState !== undefined ? forceState : !exists;
      if (shouldBeAdded && !exists) return [...prev, id];
      if (!shouldBeAdded && exists) return prev.filter(i => i !== id);
      return prev;
    });
  };

  const handleCreateOrUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      setStatus({ type: 'error', message: 'PLEASE SELECT AT LEAST ONE QUESTION' });
      return;
    }
    
    setLoading(true);
    try {
      const testData = {
        title,
        description,
        subjectId: selectedSubject,
        questionIds: selectedQuestionIds,
        duration,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'mock_tests', editingId), testData);
        setStatus({ type: 'success', message: 'MOCK TEST UPDATED SUCCESSFULLY' });
      } else {
        await addDoc(collection(db, 'mock_tests'), {
          ...testData,
          createdAt: serverTimestamp()
        });
        setStatus({ type: 'success', message: 'MOCK TEST CREATED SUCCESSFULLY' });
      }
      
      resetForm();
      const testQ = query(collection(db, 'mock_tests'), orderBy('createdAt', 'desc'));
      const testSnap = await getDocs(testQ);
      setMockTests(testSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockTest)));

      setTimeout(() => setStatus(null), 5000);
    } catch (err: any) {
      setStatus({ type: 'error', message: 'ACTION FAILED: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedQuestionIds([]);
    setEditingId(null);
    setSelectedSubject('');
  };

  const startEdit = (test: MockTest) => {
    setEditingId(test.id || null);
    setTitle(test.title);
    setDescription(test.description);
    setDuration(test.duration);
    setSelectedSubject(test.subjectId);
    setSelectedQuestionIds(test.questionIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteDoc(doc(db, 'mock_tests', id));
      setMockTests(prev => prev.filter(t => t.id !== id));
      setStatus({ type: 'success', message: 'TEST DELETED' });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'DELETE FAILED' });
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedQuestionIds.includes(q.id) // Hide if already selected, as per user request
  );

  const selectedQuestionsDisplay = questions.filter(q => selectedQuestionIds.includes(q.id));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Mock Test Builder</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md leading-relaxed">
            Create or edit mock tests by picking questions from your database.
          </p>
        </div>
        <GraduationCap size={96} className="text-white/5 absolute right-12 bottom-0 rotate-12" />
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-6 rounded-xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest border transition-all ${
              status.type === 'success' ? 'bg-white border-black text-black' : 'bg-white border-red-500 text-red-500'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.message}
            <button onClick={() => setStatus(null)} className="ml-auto opacity-30 hover:opacity-100 transition-opacity"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm sticky top-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.25em] flex items-center gap-3">
                <BookOpen size={14} className="text-black" />
                {editingId ? 'Edit Mock Test' : 'New Mock Test'}
              </h3>
              {editingId && (
                <button onClick={resetForm} className="text-[9px] font-black text-slate-300 hover:text-black uppercase tracking-widest">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleCreateOrUpdateTest} className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Select Subject</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedQuestionIds([]); // Clear selection when switching subject
                  }}
                  required
                  disabled={!!editingId} // Don't allow subject change on edit for simplicity
                >
                  <option value="">Select Domain</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Test Title</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                  placeholder="E.G. MATHS MOCK 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Time Limit (Minutes)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Description</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase min-h-[100px]"
                  placeholder="Test instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Questions Picked</span>
                  <span className="font-black text-black text-xs">{selectedQuestionIds.length}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedSubject || selectedQuestionIds.length === 0}
                  className="w-full py-5 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {editingId ? 'Save Changes' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Selected Questions Section */}
          {selectedQuestionIds.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-black uppercase tracking-[0.25em] flex items-center gap-3 px-4">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Selected Questions ({selectedQuestionIds.length})
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {selectedQuestionsDisplay.map(q => (
                  <motion.div
                    layout
                    key={`selected-${q.id}`}
                    className="p-6 bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-start justify-between group"
                  >
                     <div className="flex-1">
                        <div className="text-[11px] font-bold text-black leading-relaxed uppercase tracking-tight line-clamp-1">
                           <LatexRenderer text={q.questionText} />
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleQuestion(q.id, false); }}
                        className="text-slate-300 hover:text-red-500 transition-colors ml-4"
                      >
                        <Trash2 size={16} />
                      </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Available Questions Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-black uppercase tracking-[0.25em] flex items-center gap-3 px-4">
              <Plus size={14} className="text-blue-500" />
              Available Questions
            </h4>
            
            <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm flex items-center gap-4">
              <Search className="text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Search for questions..."
                className="flex-1 border-none focus:outline-none font-black text-[10px] uppercase tracking-widest text-slate-400 placeholder:text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">Total:</span>
                 <span className="text-[9px] font-black text-black uppercase tracking-widest">{questions.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {fetchingQuestions ? (
                <div className="py-20 text-center font-black text-[10px] text-slate-300 uppercase tracking-[0.2em] animate-pulse">Loading question pool...</div>
              ) : filteredQuestions.length > 0 ? (
                filteredQuestions.map(q => {
                  return (
                    <motion.div
                      layout
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className="p-6 bg-white border border-slate-100 rounded-xl transition-all cursor-pointer group shadow-sm hover:border-black active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 shrink-0 w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center transition-all group-hover:border-black">
                          <Plus size={12} className="text-slate-200 group-hover:text-black" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[8px] font-black uppercase py-1 px-2 bg-slate-50 border border-slate-100 text-slate-400 rounded">
                              {q.type}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-black leading-relaxed uppercase tracking-tight line-clamp-2">
                             <LatexRenderer text={q.questionText} />
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-200 mt-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  );
                })
              ) : selectedSubject ? (
                <div className="py-20 bg-slate-50 rounded-big border border-dashed border-slate-100 text-center">
                  <AlertCircle className="mx-auto mb-4 text-slate-200" size={32} />
                  <p className="font-black text-[10px] text-slate-300 uppercase tracking-widest">No more questions available for this domain</p>
                </div>
              ) : (
                <div className="py-20 bg-slate-50 rounded-big border border-dashed border-slate-100 text-center">
                  <Filter className="mx-auto mb-4 text-slate-200" size={32} />
                  <p className="font-black text-[10px] text-slate-300 uppercase tracking-widest">Select a subject to see questions</p>
                </div>
              )}
            </div>
          </div>

          {/* Existing Mock Tests List */}
          <div className="space-y-6 pt-12 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-black uppercase tracking-[0.25em] flex items-center gap-3 px-4">
              <ListRestart size={14} className="text-purple-500" />
              Existing Mock Tests
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockTests.map(test => (
                <div key={test.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-tight mb-2 truncate">{test.title}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {subjects.find(s => s.id === test.subjectId)?.name} • {test.questionIds.length} Qs
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => startEdit(test)}
                      className="flex-1 py-3 bg-slate-50 text-black border border-slate-100 rounded-lg font-black text-[8px] uppercase tracking-widest hover:border-black transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button 
                      onClick={() => test.id && handleDelete(test.id)}
                      className="py-3 px-4 bg-slate-50 text-red-500 border border-slate-100 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-red-50 hover:border-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
