import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Mail, Shield, Save, CheckCircle2, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || '');
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    setStatus(null);

    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, { displayName });
      
      // Update FS User record
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        updatedAt: new Date()
      });

      setStatus({ type: 'success', message: 'Profile updated successfully' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-black p-12 rounded-big text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">Your Profile</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-md leading-relaxed">
            Manage your personal identity and security parameters.
          </p>
        </div>
        <User size={120} className="text-white/5 absolute right-12 bottom-0 rotate-12" />
      </div>

      <div className="bg-white p-10 md:p-12 rounded-big border border-slate-100 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-10">
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest border ${
                status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
              }`}
            >
              <CheckCircle2 size={16} />
              {status.message}
            </motion.div>
          )}

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Display Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-black transition-all font-black text-xs uppercase tracking-widest"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  disabled
                  className="w-full pl-16 pr-6 py-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-300 cursor-not-allowed"
                  value={auth.currentUser?.email || ''}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black border border-slate-100">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest">Account Authority</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Verified Integration Model</p>
              </div>
              <div className="ml-auto px-4 py-2 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                Active
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-5 bg-black text-white hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Update Parameters
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 hover:border-black hover:text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={16} />
              Terminate Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
