import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface NavbarProps {
  user?: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-lg border-b border-gray-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:opacity-80 transition-opacity">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">AI Learning</span>
          </Link>

          {/* Right Side Options */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100/50 px-3 py-1.5 rounded-full border border-gray-200">
                  <User className="w-4 h-4 text-indigo-500" />
                  {user.user_metadata?.username || user.email}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">
                  Playing as Guest
                </span>
                <Link 
                  to="/" 
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
