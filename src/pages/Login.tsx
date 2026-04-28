import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Determine role
        const role = (email === 'leaninkclothing@gmail.com' || email === 'rudrapable2010@gmail.com') ? 'admin' : 'student';
        
        // Create user profile
        await setDoc(doc(db, 'user_profiles', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName || 'Student',
          role: role,
          createdAt: serverTimestamp(),
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-black text-xl mx-auto mb-6">
            P
          </div>
          <h1 className="text-sm font-black text-black uppercase tracking-[0.3em] mb-2">PrepBuddy</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">Premium Board Preparation<br />Student Edition</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="STUDENT NAME"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="password"
              placeholder="PASSWORD"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-black transition-all font-black text-[10px] tracking-widest uppercase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-black bg-slate-100 p-3 rounded text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white hover:bg-slate-800 rounded-lg font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-12 space-y-6 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {isLogin ? "New user?" : "Existing user?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-black font-black hover:underline"
            >
              {isLogin ? 'Register account' : 'Sign in here'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
