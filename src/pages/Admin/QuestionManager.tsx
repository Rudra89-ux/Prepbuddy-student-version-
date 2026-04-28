import React, { useState, useEffect, memo } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { generateQuestions } from '../../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Settings2,
  FileText
} from 'lucide-react';
import { Subject, Chapter, Question } from '../../types';
import { LatexRenderer } from '../../components/LatexRenderer';
import { getDriveDirectLink } from '../../lib/utils';

interface ManualQuestionFormProps {
  manualQuestion: Partial<Question>;
  setManualQuestion: React.Dispatch<React.SetStateAction<Partial<Question>>>;
  onSubmit: (e: React.FormEvent, directSave?: boolean) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  editingIndex: number | null;
}

const ManualQuestionForm = memo(({ 
  manualQuestion, 
  setManualQuestion, 
  onSubmit, 
  onCancel, 
  loading,
  editingIndex
}: ManualQuestionFormProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-10 rounded-big border border-black shadow-2xl mb-12"
    >
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xs font-black text-black uppercase tracking-[0.25em]">
          {manualQuestion.id ? 'Edit Question' : (editingIndex !== null ? 'Edit Question from List' : 'Add Question')}
        </h3>
        {(editingIndex !== null || manualQuestion.id) && (
          <button 
            onClick={onCancel}
            className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-black transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>
      <form onSubmit={(e) => onSubmit(e)} className="space-y-6">
        <div>
          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Image URL (Google Drive)</label>
          <input
            type="url"
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
            placeholder="Link to question image..."
            value={manualQuestion.imageUrl}
            onChange={(e) => setManualQuestion(prev => ({ ...prev, imageUrl: e.target.value }))}
          />
          {manualQuestion.imageUrl && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <p className="text-[8px] font-black text-slate-300 uppercase mb-2">Preview</p>
              <img 
                src={getDriveDirectLink(manualQuestion.imageUrl)} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded shadow-lg border border-slate-100"
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Question (Use $...$ for Math)</label>
          <textarea
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase min-h-[120px]"
            placeholder="Type your question..."
            value={manualQuestion.questionText}
            onChange={(e) => setManualQuestion(prev => ({ ...prev, questionText: e.target.value }))}
            required
          />
        </div>

        {manualQuestion.type === 'mcq' && (
          <div className="space-y-4">
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Options</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manualQuestion.options?.map((opt, i) => (
                <div key={i} className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px]">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(manualQuestion.options || [])];
                      newOpts[i] = e.target.value;
                      setManualQuestion(prev => ({ ...prev, options: newOpts }));
                    }}
                    required={manualQuestion.type === 'mcq'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Correct Answer</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
              value={manualQuestion.correctAnswer}
              onChange={(e) => setManualQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
              required
            >
              <option value="">Select Option</option>
              {manualQuestion.options?.map((opt, i) => (
                <option key={i} value={opt}>{String.fromCharCode(65 + i)}: {opt.slice(0, 30)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Explanation</label>
            <input
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
              placeholder="Explain the answer..."
              value={manualQuestion.explanation}
              onChange={(e) => setManualQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="p-8 bg-slate-50 border border-slate-100 rounded-lg">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Preview</p>
          <div className="space-y-6">
            {manualQuestion.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white p-2">
                <img 
                  src={getDriveDirectLink(manualQuestion.imageUrl)} 
                  alt="Asset Preview" 
                  className="max-h-32 mx-auto object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="font-black text-black uppercase tracking-tight text-sm leading-relaxed">
              <LatexRenderer text={manualQuestion.questionText || 'Your question will appear here...'} />
            </div>
            {manualQuestion.type === 'mcq' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {manualQuestion.options?.map((opt, i) => (
                   <div key={i} className="p-3 bg-white border border-slate-100 rounded text-[9px] font-black uppercase tracking-wide flex items-center gap-3">
                     <span className="text-slate-300">{String.fromCharCode(65 + i)}</span>
                     <LatexRenderer text={opt || '...'} />
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row gap-4">
          {!manualQuestion.id && (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-5 bg-white border border-black text-black hover:bg-slate-50 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm disabled:opacity-50"
            >
              Add to List
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e as any, true)}
            className="flex-1 py-5 bg-black text-white hover:bg-slate-800 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />}
            {manualQuestion.id ? 'Save Updates' : 'Save Immediately'}
          </button>
        </div>
      </form>
    </motion.div>
  );
});

ManualQuestionForm.displayName = 'ManualQuestionForm';

export default function QuestionManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Manual form state
  const [manualQuestion, setManualQuestion] = useState<Partial<Question>>({
    type: 'mcq',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    imageUrl: ''
  });

  useEffect(() => {
    const fetchContext = async () => {
      const subSnap = await getDocs(query(collection(db, 'subjects'), orderBy('order', 'asc')));
      const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(subs);

      const chapSnap = await getDocs(query(collection(db, 'chapters'), orderBy('order', 'asc')));
      setChapters(chapSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter)));
    };
    fetchContext();
  }, []);

  const fetchExistingQuestions = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      let q = query(collection(db, 'questions'), where('subjectId', '==', selectedSubject));
      if (selectedChapter) {
        q = query(q, where('chapterId', '==', selectedChapter));
      }
      const snap = await getDocs(q);
      setExistingQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showExisting) {
      fetchExistingQuestions();
    }
  }, [selectedSubject, selectedChapter, showExisting]);

  const handleManualSubmit = async (e: React.FormEvent, directSave = false) => {
    e.preventDefault();
    if (!selectedSubject) {
      setStatus({ type: 'error', message: 'Please select a subject first' });
      return;
    }

    // Basic validation
    if (!manualQuestion.questionText || !manualQuestion.correctAnswer || !manualQuestion.explanation) {
      setStatus({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    if (manualQuestion.type === 'mcq' && manualQuestion.options?.some(opt => !opt)) {
      setStatus({ type: 'error', message: 'All options must be filled for MCQ' });
      return;
    }

    setLoading(true);
    try {
      const questionData = { 
        ...manualQuestion,
        subjectId: selectedSubject,
        chapterId: selectedChapter || 'none'
      };

      if (directSave) {
        if ('id' in manualQuestion && manualQuestion.id) {
          // Update existing
          const { id, ...data } = manualQuestion;
          await updateDoc(doc(db, 'questions', id as string), {
            ...data,
            subjectId: selectedSubject,
            chapterId: selectedChapter || 'none',
            updatedAt: serverTimestamp()
          });
          setStatus({ type: 'success', message: 'Question updated successfully' });
          fetchExistingQuestions();
        } else {
          // Add new
          await addDoc(collection(db, 'questions'), {
            ...questionData,
            createdAt: serverTimestamp()
          });
          setStatus({ type: 'success', message: 'Question saved successfully' });
        }
      } else {
        if (editingIndex !== null) {
          const updated = [...questions];
          updated[editingIndex] = questionData;
          setQuestions(updated);
          setEditingIndex(null);
          setStatus({ type: 'success', message: 'Question updated in list' });
        } else {
          setQuestions(prev => [...prev, questionData]);
          setStatus({ type: 'success', message: 'Question added to list' });
        }
      }

      setShowManualForm(false);
      setManualQuestion({
        type: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        imageUrl: ''
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'questions');
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      setExistingQuestions(prev => prev.filter(q => q.id !== id));
      setStatus({ type: 'success', message: 'Question deleted' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Delete failed' });
    }
  };

  const startEditExisting = (q: Question) => {
    setManualQuestion(q);
    setEditingIndex(null); // Not in pending list
    setShowManualForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateAI = async () => {
    if (!selectedSubject) {
      setStatus({ type: 'error', message: 'Please select a subject first' });
      return;
    }
    
    setGenerating(true);
    setStatus(null);
    try {
      const subName = subjects.find(s => s.id === selectedSubject)?.name || '';
      const chapName = chapters.find(c => c.id === selectedChapter)?.name || 'General';
      
      const response = await generateQuestions(
        subName, 
        chapName, 
        5, 
        existingQuestions.map(q => q.questionText)
      );
      const newQuestions = response.map(q => ({
        ...q,
        subjectId: selectedSubject,
        chapterId: selectedChapter || 'none'
      }));
      
      setQuestions(prev => [...prev, ...newQuestions]);
      setStatus({ type: 'success', message: 'AI generated 5 questions' });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'AI generation failed: ' + err.message });
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (index: number) => {
    setManualQuestion(questions[index]);
    setEditingIndex(index);
    setShowManualForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const regenerateQuestion = async (index: number) => {
    const q = questions[index];
    const subName = subjects.find(s => s.id === (q.subjectId || selectedSubject))?.name || 'General';
    const chapName = chapters.find(c => c.id === (q.chapterId || selectedChapter))?.name || 'General';
    
    setGenerating(true);
    try {
      const response = await generateQuestions(
        subName, 
        chapName, 
        1, 
        [...existingQuestions.map(q => q.questionText), ...questions.map(q => q.questionText || '')]
      );
      const newQ = response[0];
      const updated = [...questions];
      updated[index] = { ...newQ, subjectId: q.subjectId, chapterId: q.chapterId };
      setQuestions(updated);
      setStatus({ type: 'success', message: 'Question regenerated' });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Regeneration failed' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) return;
    setLoading(true);
    setStatus(null);
    let savedCount = 0;
    try {
      for (const q of questions) {
        if (!q.subjectId || !q.chapterId) {
          throw new Error(`Item ${questions.indexOf(q) + 1} is missing subject or chapter.`);
        }

        await addDoc(collection(db, 'questions'), {
          ...q,
          createdAt: serverTimestamp()
        });
        savedCount++;
      }
      setQuestions([]);
      setStatus({ type: 'success', message: `Successfully saved ${savedCount} questions` });
    } catch (err: any) {
      console.error("Save Error:", err);
      setStatus({ 
        type: 'error', 
        message: `Saved ${savedCount}/${questions.length} questions. Error: ${err.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center gap-6 uppercase tracking-tighter">
             <BrainCircuit size={40} />
             Question Manager
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md leading-relaxed">
            Create or generate questions for your tests. You can add them manually or use AI.
          </p>
        </div>
        <Sparkles size={160} className="text-white/5 absolute -right-20 -bottom-20 rotate-12" />
      </div>

      {/* Status Notifications */}
      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className={`p-6 rounded-xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest border transition-all mb-6 ${
              status.type === 'success' ? 'bg-white border-black text-black' : 'bg-white border-red-500 text-red-500'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.message}
            <button onClick={() => setStatus(null)} className="ml-auto hover:opacity-50">CLOSE</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-big border border-slate-100 shadow-sm sticky top-6">
            <h3 className="text-[10px] font-black text-black mb-8 uppercase tracking-[0.25em] flex items-center gap-3">
              <Settings2 size={14} className="text-black" />
              Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Subject</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase mb-4"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedChapter('');
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">Chapter (Optional)</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={!selectedSubject}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => c.subjectId === selectedSubject).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-8 space-y-4">
                <button
                  onClick={handleGenerateAI}
                  disabled={generating || !selectedSubject}
                  className={`w-full py-5 bg-black hover:bg-slate-800 text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${generating ? 'animate-pulse' : ''}`}
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowManualForm(!showManualForm)}
                  className={`w-full py-5 bg-white border border-slate-200 text-black rounded-lg font-black text-[10px] uppercase tracking-[0.15em] hover:border-black transition-all flex items-center justify-center gap-3 ${showManualForm ? 'border-black' : ''}`}
                >
                  <Plus size={16} />
                  {showManualForm ? 'Cancel' : 'Add Manually'}
                </button>
                <button
                  onClick={() => setShowExisting(!showExisting)}
                  className={`w-full py-5 bg-white border border-slate-200 text-black rounded-lg font-black text-[10px] uppercase tracking-[0.15em] hover:border-black transition-all flex items-center justify-center gap-3 ${showExisting ? 'border-black' : ''}`}
                >
                  <FileText size={16} />
                  {showExisting ? 'Hide Library' : 'Question Library'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          {!selectedSubject && (
            <div className="p-8 bg-amber-50 border border-amber-100 rounded-big text-amber-900 mb-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest mb-2">Notice</h4>
                  <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                    Please select a <span className="text-black">Subject</span> in the left sidebar to start adding questions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showManualForm && (
            <ManualQuestionForm 
              manualQuestion={manualQuestion}
              setManualQuestion={setManualQuestion}
              onSubmit={handleManualSubmit}
              loading={loading}
              editingIndex={editingIndex}
              onCancel={() => {
                setShowManualForm(false);
                setEditingIndex(null);
                setManualQuestion({
                  type: 'mcq',
                  questionText: '',
                  options: ['', '', '', ''],
                  correctAnswer: '',
                  explanation: '',
                  imageUrl: ''
                });
              }}
            />
          )}

          {showExisting && (
            <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-black mb-10 uppercase tracking-[0.25em]">Question Library ({existingQuestions.length})</h3>
              <div className="space-y-8">
                {existingQuestions.length > 0 ? (
                  existingQuestions.map((q) => (
                    <div key={q.id} className="p-8 bg-slate-50 border border-slate-50 rounded-2xl relative group hover:border-black transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-3 py-1.5 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest rounded border border-slate-100">
                          {q.type}
                        </span>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => startEditExisting(q)}
                            className="text-slate-300 hover:text-black transition-colors flex items-center gap-2"
                          >
                            <Settings2 size={14} />
                            <span className="text-[8px] font-black uppercase">Edit</span>
                          </button>
                          <button 
                            onClick={() => deleteExistingQuestion(q.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="font-black text-black uppercase tracking-tight text-sm mb-4 leading-relaxed">
                        <LatexRenderer text={q.questionText} />
                      </div>
                      {q.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-white p-2">
                          <img 
                            src={getDriveDirectLink(q.imageUrl)} 
                            alt="Question Content" 
                            className="max-h-64 mx-auto object-contain rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="p-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        <span className="text-black mr-2">Explanation:</span> {q.explanation}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">No existing questions found for this subject.</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-10 rounded-big border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-xs font-black text-black uppercase tracking-[0.25em]">Pending List ({questions.length})</h3>
              {questions.length > 0 && (
                <button
                  onClick={handleSaveQuestions}
                  disabled={loading}
                  className="px-8 py-4 bg-black text-white hover:bg-slate-800 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={14} />}
                  Save All
                </button>
              )}
            </div>

            <div className="space-y-8">
              {questions.length > 0 ? (
                questions.map((q, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-slate-50 border border-slate-50 hover:border-black transition-all relative overflow-hidden group rounded-2xl"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-3">
                        <span className="px-3 py-1.5 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest rounded border border-slate-100">
                          {q.type}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => regenerateQuestion(idx)}
                          className="text-slate-300 hover:text-black transition-colors flex items-center gap-2"
                        >
                          <Sparkles size={14} />
                          <span className="text-[8px] font-black uppercase">Regen</span>
                        </button>
                        <button 
                          onClick={() => startEdit(idx)}
                          className="text-slate-300 hover:text-black transition-colors flex items-center gap-2"
                        >
                          <Settings2 size={14} />
                          <span className="text-[8px] font-black uppercase">Edit</span>
                        </button>
                        <button 
                          onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {q.imageUrl && (
                      <div className="mb-6 rounded-lg overflow-hidden border border-slate-100 bg-white">
                        <img 
                          src={getDriveDirectLink(q.imageUrl)} 
                          alt="Asset" 
                          className="max-h-48 mx-auto object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="font-black text-black uppercase tracking-tight text-sm mb-6 leading-relaxed">
                      <LatexRenderer text={q.questionText || ''} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {q.options?.map((opt, i) => (
                        <div key={i} className={`p-4 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all ${opt === q.correctAnswer ? 'bg-black border-black text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {String.fromCharCode(65 + i)} &nbsp; <LatexRenderer text={opt} />
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-xl text-[10px] font-black tracking-widest text-slate-400 uppercase leading-relaxed">
                      <span className="text-black mr-2">Explanation:</span> {q.explanation}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-24 text-slate-300 border border-dashed border-slate-50 rounded-big">
                  <Plus size={48} className="mx-auto mb-6 opacity-5" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No questions in list</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
