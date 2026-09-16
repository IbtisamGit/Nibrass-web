import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, GraduationCap, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Lessons', path: '/dashboard/lessons', icon: BookOpen },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 text-indigo-600 border-b border-gray-100">
        <GraduationCap className="w-8 h-8" />
        <span className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</span>
      </div>

      <div className="px-4 py-6">
        <Link 
          to="/learn"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Lesson</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors group"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
