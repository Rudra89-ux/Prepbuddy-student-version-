import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';

import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Chapters from './pages/Chapters';
import TestMode from './pages/TestMode';
import Results from './pages/Results';
import Progress from './pages/Progress';
import Tests from './pages/Tests';
import Login from './pages/Login';
import AdminHub from './pages/Admin/AdminHub';
import QuestionManager from './pages/Admin/QuestionManager';
import MockTestManager from './pages/Admin/MockTestManager';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'user_profiles', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly) {
    const isDesignatedAdmin = user?.email === 'rudrapable2010@gmail.com' || user?.email === 'leaninkclothing@gmail.com';
    if (profile?.role !== 'admin' && !isDesignatedAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
        <Route path="/chapters" element={<ProtectedRoute><Chapters /></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute><TestMode /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        
        <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><div>Settings Page coming soon</div></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminHub /></ProtectedRoute>} />
        <Route path="/admin/questions" element={<ProtectedRoute adminOnly><QuestionManager /></ProtectedRoute>} />
        <Route path="/admin/mock-tests" element={<ProtectedRoute adminOnly><MockTestManager /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
