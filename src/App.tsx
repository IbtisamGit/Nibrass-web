import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import LessonView from './components/LessonView';
import Homepage from './components/Homepage';
import { 
  GraduationCap, LayoutDashboard, LogOut, Settings, BookOpen, 
  ChevronLeft, ChevronRight, Loader2, BrainCircuit, Trash2, 
  User, Mail, Trophy, Target, Activity, Search, Shield, ArrowLeft,
  Lock, Bell, Palette, Upload, Compass 
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// استيراد عناصر الرسوم البيانية
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- 1. Dashboard Overview Component ---
const DashboardOverview = () => {
  const [stats, setStats] = useState({ totalLessons: 0, totalCategories: 0, quizzesTaken: 0, avgScore: 0 });
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [donutChartData, setDonutChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Learner');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.user_metadata?.username) {
          setUserName(userData.user.user_metadata.username);
        }

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false });

        if (lessonsError) throw lessonsError;

        const { data: testData, error: testError } = await supabase
          .from('test_results')
          .select('score');

        if (testError) throw testError;

        let quizzesCount = 0;
        let average = 0;

        if (testData && testData.length > 0) {
          quizzesCount = testData.length;
          const totalScore = testData.reduce((acc, curr) => acc + curr.score, 0);
          average = Math.round(totalScore / quizzesCount);
        }

        if (lessonsData) {
          setRecentLessons(lessonsData.slice(0, 5));

          const categoryCounts = lessonsData.reduce((acc: any, lesson: any) => {
            const rawCat = (lesson.category || 'Uncategorized').trim().toLowerCase();
            const cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          const categories = Object.keys(categoryCounts);

          setStats({ 
            totalLessons: lessonsData.length, 
            totalCategories: categories.length,
            quizzesTaken: quizzesCount,
            avgScore: average
          });

          setBarChartData({
            labels: categories,
            datasets: [{
              label: 'Lessons',
              data: Object.values(categoryCounts),
              backgroundColor: 'rgba(79, 70, 229, 0.85)',
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(67, 56, 202, 1)',
            }],
          });

          const difficultyCounts = lessonsData.reduce((acc: any, lesson: any) => {
            const diff = lesson.difficulty_level || 'Medium';
            acc[diff] = (acc[diff] || 0) + 1;
            return acc;
          }, {});

          const difficultyColors: any = {
            'Easy': 'rgba(34, 197, 94, 0.85)',
            'Medium': 'rgba(234, 179, 8, 0.85)',
            'Hard': 'rgba(239, 68, 68, 0.85)'
          };

          const diffLabels = Object.keys(difficultyCounts);
          const diffBackgrounds = diffLabels.map(label => difficultyColors[label] || 'rgba(99, 102, 241, 0.85)');

          setDonutChartData({
            labels: diffLabels,
            datasets: [{
              data: Object.values(difficultyCounts),
              backgroundColor: diffBackgrounds,
              borderWidth: 0,
              hoverOffset: 4
            }]
          });
        }
      } catch (err) {
        console.error("Error fetching overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#9ca3af' } }, x: { ticks: { color: '#9ca3af' } } },
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 20, usePointStyle: true, color: '#9ca3af' } }
    },
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
          <p className="text-indigo-100">Here's a summary of your learning progress.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors hidden md:block"
        >
          Explore Topics
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">Total Lessons</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalLessons}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">Categories</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{stats.totalCategories}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">Quizzes Taken</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{stats.quizzesTaken}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">Avg Score</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">Knowledge Distribution</h3>
          <div className="flex-1 min-h-[250px]">
            {barChartData && stats.totalLessons > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Not enough data.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">Difficulty Breakdown</h3>
          <div className="flex-1 min-h-[250px] relative">
            {donutChartData && stats.totalLessons > 0 ? (
              <Doughnut data={donutChartData} options={donutChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Not enough data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Activity</h3>
          <button onClick={() => navigate('/dashboard/lessons')} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700 flex-1 overflow-y-auto">
          {recentLessons.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">No lessons generated yet.</div>
          ) : (
            recentLessons.map(lesson => (
              <div key={lesson.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{lesson.topic}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.category} • {new Date(lesson.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)} className="px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors ml-2">
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 2. MyLessons Component ---
const MyLessons = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLessons();
  }, []);

  const fetchMyLessons = async () => {
    try {
      const { data, error } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setLessons(data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      setLessons(prev => prev.filter(lesson => lesson.id !== id));
    } catch (err) {
      console.error("Error deleting lesson:", err);
    }
  };

  const filteredLessons = lessons.filter(lesson => 
    lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (lesson.category && lesson.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Search Bar Area */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> My Lessons
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm py-0.5 px-2.5 rounded-full ml-2">{lessons.length}</span>
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search lessons..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
          />
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl h-64 flex flex-col items-center justify-center shadow-sm">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium text-lg">Your library is empty. Generate a lesson to get started!</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors">Create Lesson</button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No lessons found matching "{searchTerm}".</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-500 flex flex-col group relative overflow-hidden transform hover:-translate-y-1"
            >
              
              {/* Subtle animated background gradient that appears on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/10 to-purple-50/50 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Delete Button */}
              <button 
                onClick={(e) => handleDelete(e, lesson.id)}
                className="absolute top-5 right-5 p-2 text-gray-300 dark:text-gray-600 hover:text-white hover:bg-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Delete Lesson"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex flex-col mb-4 relative z-10">
                <span className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  {new Date(lesson.created_at).toLocaleDateString()}
                </span>
                <span className="inline-flex w-fit bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/50 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 text-xs font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors duration-300">
                  {lesson.category || 'General'}
                </span>
              </div>
              
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors duration-300 relative z-10">
                {lesson.topic}
              </h3>
              
              {/* Dynamic Difficulty Badge */}
              <div className="mb-6 flex items-center relative z-10">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-md border ${
                  lesson.difficulty_level === 'Easy' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/30' :
                  lesson.difficulty_level === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30' :
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30'
                }`}>
                  {lesson.difficulty_level || 'Medium'}
                </span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-colors duration-300 relative z-10">
                <button
                  onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)}
                  className="w-full bg-white dark:bg-gray-800 group-hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 group-hover:text-white font-bold py-3 rounded-xl transition-all duration-300 border border-indigo-100 dark:border-gray-700 group-hover:border-transparent flex justify-center items-center gap-2 shadow-sm group-hover:shadow-indigo-200/50"
                >
                  View Lesson <ArrowLeft className="w-4 h-4 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 3. SettingsPage Component ---
const SettingsPage = () => {
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('account');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // AI Preferences
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiTone, setAiTone] = useState('Academic & Professional');

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email || '');
        const currentName = data.user.user_metadata?.username || 'Learner';
        const currentAvatar = data.user.user_metadata?.avatar_url || '';
        setUsername(currentName);
        setNewUsername(currentName);
        setAvatarUrl(currentAvatar);
        setNewAvatarUrl(currentAvatar);
      }
      setLoading(false);
    });
  }, []);

  const setDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    if (val) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `user_avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setNewAvatarUrl(data.publicUrl);
    } catch (error: any) {
      alert(error.message + "\n(Did you create a public bucket named 'avatars'?)");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          username: newUsername,
          avatar_url: newAvatarUrl 
        }
      });
      if (error) throw error;
      alert("Profile updated successfully!");
      setUsername(newUsername);
      setAvatarUrl(newAvatarUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // دالة إرسال بريد إعادة تعيين كلمة المرور
  const handleResetPassword = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Password updated successfully!");
      setNewPassword('');
      setIsEditingPassword(false); // إغلاق المربع بعد النجاح
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Account Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your profile, preferences, and AI learning settings.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        
        {/* Horizontal Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'account' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <User className="w-5 h-5" /> Profile Details
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'preferences' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Palette className="w-5 h-5" /> App & AI Preferences
          </button>
        </div>

        <div className="p-8">
          {/* TAB: Account Details */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-md shrink-0 overflow-hidden border-4 border-white dark:border-gray-700">
                  {newAvatarUrl || avatarUrl ? (
                    <img src={newAvatarUrl || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    username.charAt(0).toUpperCase()
                  )}
                </div>
                
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Avatar Image</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={newAvatarUrl} 
                      onChange={(e) => setNewAvatarUrl(e.target.value)} 
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                    />
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button 
                        type="button" 
                        disabled={uploading} 
                        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors whitespace-nowrap"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload File
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Provide an image URL or upload a file directly from your device.</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

              {/* Form Section */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    readOnly 
                    value={email} 
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" 
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1"><Lock className="w-3 h-3"/> Email cannot be changed.</p>
                </div>
              </div>

              {/* Security & Password Update Section */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Password & Security
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your password to keep your account secure.</p>
                  </div>
                  
                  {/* زر التغيير يظهر فقط إذا كان الحقل مخفياً */}
                  {!isEditingPassword && (
                    <button 
                      onClick={() => setIsEditingPassword(true)}
                      className="px-6 py-2.5 bg-transparent border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all whitespace-nowrap"
                    >
                      Change Password
                    </button>
                  )}
                </div>
                
                {/* حقل الإدخال يظهر فقط عند الضغط على الزر */}
                {isEditingPassword && (
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                      />
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <button 
                        onClick={() => {
                          setIsEditingPassword(false);
                          setNewPassword(''); // تفريغ الحقل عند الإلغاء
                        }}
                        disabled={updatingPassword}
                        className="flex-1 sm:flex-none px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpdatePassword}
                        disabled={updatingPassword || newPassword.length < 6}
                        className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={saving || (newUsername === username && newAvatarUrl === avatarUrl)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>

            </div>
          )}

          {/* TAB: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-indigo-500"/> Theme Selection</h4>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDarkMode(false)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-colors ${!isDarkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    Light Mode
                  </button>
                  <button 
                    onClick={() => setDarkMode(true)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-colors ${isDarkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
              
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-indigo-500"/> AI Learning Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Preferred AI Language</label>
                    <select 
                      value={aiLanguage}
                      onChange={(e) => setAiLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option>English</option>
                      <option>Arabic (العربية)</option>
                      <option>French (Français)</option>
                      <option>Spanish (Español)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Explanation Tone</label>
                    <select 
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option>Academic & Professional</option>
                      <option>Casual & Friendly</option>
                      <option>Explain Like I'm 5 (Simple)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">These settings will be used in future lessons generated by the AI.</p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- Protected Dashboard Route (Layout) ---
const DashboardLayout = ({ session }: { session: Session }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center py-3 rounded-xl font-medium transition-all duration-200 overflow-hidden ${
      isActive ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    } ${isSidebarOpen ? 'px-4 mx-4 gap-3' : 'justify-center mx-3'}`;

  const getPageTitle = () => {
    if (location.pathname.includes('/lessons/')) return 'Lesson Viewer';
    if (location.pathname.includes('/lessons')) return 'My Library';
    if (location.pathname.includes('/settings')) return 'Account Settings';
    if (location.pathname.includes('/analytics')) return 'Dashboard Analytics';
    return 'Explore & Create';
  };

  const userEmail = session.user.email || '';
  const userName = session.user.user_metadata?.username || 'Learner';
  const userAvatar = session.user.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <aside className={`relative bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors z-20 shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-700 transition-all ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <GraduationCap className="w-8 h-8 flex-shrink-0" />
          {isSidebarOpen && <span className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">Dashboard</span>}
        </div>
        
        <nav className="flex-1 py-4 space-y-2 flex flex-col">
          <NavLink to="/dashboard" end className={navLinkClass}>
            <Compass className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Explore</span>}
          </NavLink>
          <NavLink to="/dashboard/analytics" end className={navLinkClass}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Analytics</span>}
          </NavLink>
          <NavLink to="/dashboard/lessons" end className={navLinkClass}>
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">My Library</span>}
          </NavLink>
          <NavLink to="/dashboard/settings" className={navLinkClass}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Settings</span>}
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className={`flex items-center py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all overflow-hidden w-full ${isSidebarOpen ? 'px-4 gap-3' : 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 px-8 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{getPageTitle()}</h1>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
              + New Lesson
            </Link>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div className="flex items-center gap-3 cursor-default">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{userEmail}</p>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 overflow-hidden border-2 border-white dark:border-gray-800">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>

            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize dark mode check
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
        
        {/* Dashboard routes */}
        <Route path="/dashboard" element={session ? <DashboardLayout session={session} /> : <Navigate to="/" replace />}>
          <Route index element={<Homepage />} />
          <Route path="analytics" element={<DashboardOverview />} />
          <Route path="lessons" element={<MyLessons />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="lessons/:id" element={<LessonView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;