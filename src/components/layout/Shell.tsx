import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  MessageSquareQuote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../../types';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'user_profiles', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Mock Tests', icon: GraduationCap, path: '/tests' },
    { name: 'AI Solutions', icon: MessageSquareQuote, path: '/solutions' },
    { name: 'Profile', icon: UserIcon, path: '/profile' },
  ];

  const adminItems = [
    { name: 'Admin Hub', icon: ShieldCheck, path: '/admin' },
  ];

   const isAdmin = profile?.role === 'admin' || 
                  auth.currentUser?.email === 'rudrapable2010@gmail.com' || 
                  auth.currentUser?.email === 'leaninkclothing@gmail.com';

  const isTestPage = location.pathname === '/test';

  if (isTestPage) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#F8F9FA]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="hidden md:flex h-full bg-white border-r border-slate-100 flex-col z-20 relative transition-all duration-300"
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            {isSidebarOpen && (
              <h1 className="text-sm font-black text-black leading-tight uppercase tracking-widest">
                PrepBuddy
              </h1>
            )}
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-all ${
                location.pathname === item.path
                  ? 'bg-slate-100 text-black'
                  : 'text-slate-400 hover:text-black hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5 min-w-[20px]" />
              {isSidebarOpen && <span className="text-xs uppercase tracking-wider">{item.name}</span>}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="pt-8 pb-2">
                <p className={`text-[10px] font-black text-slate-300 uppercase tracking-widest`}>
                  {isSidebarOpen ? 'Management' : '•••'}
                </p>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-all ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-black text-white'
                      : 'text-slate-400 hover:text-black hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 min-w-[20px]" />
                  {isSidebarOpen && <span className="text-xs uppercase tracking-wider">{item.name}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <div className={`flex flex-col gap-2 ${!isSidebarOpen && 'items-center'}`}>
            <Link
              to="/settings"
              className={`flex items-center gap-3 p-3 rounded-lg font-semibold text-slate-400 hover:text-black hover:bg-slate-50 transition-all ${
                location.pathname === '/settings' ? 'text-black' : ''
              }`}
            >
              <Settings className="w-5 h-5 min-w-[20px]" />
              {isSidebarOpen && <span className="text-xs uppercase tracking-wider">Settings</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg font-semibold text-slate-400 hover:text-black hover:bg-slate-50 transition-all w-full text-left"
            >
              <LogOut className="w-5 h-5 min-w-[20px]" />
              {isSidebarOpen && <span className="text-xs uppercase tracking-wider">Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around z-50 px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              location.pathname === item.path ? 'text-black' : 'text-slate-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">{item.name}</span>
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              location.pathname.startsWith('/admin') ? 'text-black' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">Admin</span>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-24 md:pb-12 relative bg-[#F8F9FA]">
        <header className="flex justify-between items-center mb-10">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-3xl font-black text-black uppercase tracking-tight">
              Welcome, {profile?.displayName || 'User'}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-widest">
              PrepBuddy Premium Account
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white text-black font-bold overflow-hidden shadow-sm">
              {profile?.displayName?.[0] || <UserIcon size={20} />}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
