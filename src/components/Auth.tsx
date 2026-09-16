import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // أضفنا حالة لرسائل النجاح

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard'); 
      } else {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (error) throw error;
        
        // رسالة نجاح أنيقة مدمجة بدل الـ Alert المزعج
        setSuccess('Success! Redirecting to your dashboard...');
        
        // تأخير بسيط ثانية واحدة عشان المستخدم يقرأ الرسالة ثم ينتقل
        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Left side: Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-80 h-80 rounded-full bg-indigo-300 blur-3xl"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-indigo-200" />
          <h1 className="text-2xl font-bold tracking-tight">AI Learning Materials</h1>
        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Master any topic <br /> with <span className="text-indigo-200">AI-generated</span> courses.
          </h2>
          <p className="text-lg text-indigo-100 mb-8 leading-relaxed">
            Instantly generate personalized summaries, flipped flashcards, and MCQ tests. Build your knowledge base with the power of AI, designed for modern learners.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-indigo-200">
            <Sparkles className="w-5 h-5" />
            <p>Trusted by thousands of lifelong learners.</p>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <button 
          onClick={() => navigate('/learn')}
          className="absolute top-8 right-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
        >
          Continue as Guest
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h3>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your personalized learning journey.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-gray-900 sm:text-sm"
                    placeholder="johndoe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-gray-900 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-gray-900 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* رسالة النجاح الجديدة بتصميم متناسق */}
            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;